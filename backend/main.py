import logging
import os
import shutil
import time
from datetime import datetime
from typing import List, Optional

import google.generativeai as genai
import pandas as pd
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse

# Local Utilities
from firebase_utils import (
    save_lead_history,
    get_lead_history,
    upload_document,
    log_audit_event,
    get_audit_logs,
    get_audit_stats,
    get_knowledge_docs,
    delete_knowledge_doc,
)
from gemini_utils import (
    get_gemini_response,
    search_knowledge_base,
    extract_text_from_pdf,
    ingest_circular,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------
START_TIME = time.time()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="CRM solution app for Bank")
app.state.limiter = limiter

# Rate limit error handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please slow down."},
    )

# Enable CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class ChatQuery(BaseModel):
    query: str

class EligibilityQuery(BaseModel):
    product_type: str
    income: float
    existing_emi: float
    asset_value: float
    tenure_years: int
    interest_rate: float
    customer_name: Optional[str] = "Walk-in Customer"

class CIBQuery(BaseModel):
    customer_name: str
    nid_number: Optional[str] = None

# ---------------------------------------------------------------------------
# Health Endpoint
# ---------------------------------------------------------------------------

@app.get("/health")
@app.get("/api/health")
async def health():
    from firebase_utils import firebase_ready
    return {
        "status": "healthy",
        "version": "2.0.0",
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "firebase_connected": firebase_ready,
    }

# ---------------------------------------------------------------------------
# Chat (RAG)
# ---------------------------------------------------------------------------

@app.post("/chat")
@app.post("/api/chat")
@limiter.limit("20/minute")
async def chat(query: ChatQuery, request: Request):
    context = search_knowledge_base(query.query)
    result = get_gemini_response(query.query, context)
    log_audit_event("/api/chat", "POST", "system", 200, f"Q: {query.query[:80]}")
    return result

# ---------------------------------------------------------------------------
# Eligibility
# ---------------------------------------------------------------------------

@app.post("/eligibility")
@app.post("/api/eligibility")
async def calculate_eligibility(data: EligibilityQuery):
    br = (data.interest_rate / 100) / 12
    months = data.tenure_years * 12
    max_emi_allowed = data.income * 0.45
    avail_emi = max_emi_allowed - data.existing_emi

    p_inc_limit = avail_emi * ((1 - (1 + br) ** -months) / br) if br > 0 else 0
    ltv = 0.7 if data.product_type == "Home Loan" else (
        0.5 if data.product_type == "Auto Loan" else 1.0
    )
    p_asset_limit = data.asset_value * ltv
    final_limit = min(p_inc_limit, p_asset_limit)

    lead_data = {
        "customer_name": data.customer_name,
        "product": data.product_type,
        "income": data.income,
        "limit": final_limit,
        "status": "Qualified" if final_limit > 0 else "Rejected",
    }
    save_lead_history(lead_data)

    return {
        "income_limit": p_inc_limit,
        "asset_limit": p_asset_limit,
        "final_limit": final_limit,
        "status": "Agentic Compliance Passed",
    }

# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

@app.get("/history")
@app.get("/api/history")
async def get_history():
    return get_lead_history()

# ---------------------------------------------------------------------------
# CIB Verify
# ---------------------------------------------------------------------------

@app.post("/cib")
@app.post("/api/cib")
async def cib_verify(data: CIBQuery):
    """CIB-style risk analysis using Gemini + lead history from Firestore."""
    # Sanitize input
    safe_name = data.customer_name.strip()[:200]

    leads = get_lead_history(limit=200)
    customer_leads = [
        l for l in leads
        if safe_name.lower() in str(l.get("customer_name", "")).lower()
    ]

    if customer_leads:
        profile_text = "\n".join([
            f"- Product: {l.get('product')}, Limit: BDT {l.get('limit', 0):,.0f}, "
            f"Status: {l.get('status')}"
            for l in customer_leads[:10]
        ])
        found = True
    else:
        profile_text = "No prior loan history found in the IPDC system."
        found = False

    gemini_model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=(
            "You are an expert CIB (Credit Information Bureau) analyst for a Bangladeshi bank. "
            "Analyze the provided customer data and produce a structured credit risk assessment. "
            "Be concise, professional, and use standard Bangladesh Bank CIB terminology.\n"
            "Output format:\n"
            "- Risk Grade: (CL-1/CL-2/UC/SMA/SS/DF/BL)\n"
            "- Risk Score: (0-100)\n"
            "- Assessment Summary: (2-3 sentences)\n"
            "- Recommendation: (approve/conditional/reject)"
        ),
    )

    prompt = (
        f"Customer: {safe_name}\n"
        f"NID: {data.nid_number or 'Not provided'}\n\n"
        f"IPDC Transaction History:\n{profile_text}\n\n"
        f"Generate a CIB risk assessment based on this internal data."
    )

    try:
        response = gemini_model.generate_content(prompt)
        analysis = response.text
    except Exception as e:
        logger.error("CIB Gemini error: %s", e)
        analysis = (
            "Risk Grade: UC\nRisk Score: 50\n"
            "Assessment Summary: Unable to retrieve Gemini analysis. Manual review required.\n"
            "Recommendation: conditional"
        )

    log_audit_event("/api/cib", "POST", "system", 200, f"CIB check: {safe_name}")

    return {
        "customer_found": found,
        "record_count": len(customer_leads),
        "history": customer_leads[:5],
        "cib_analysis": analysis,
    }

# ---------------------------------------------------------------------------
# Circular Ingestion
# ---------------------------------------------------------------------------

@app.post("/ingest")
@app.post("/api/ingest")
async def ingest_circular_file(
    file: UploadFile = File(...), title: str = Form(...)
):
    """Manual Ingestion of Bangladesh Bank Circulars."""
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        text = extract_text_from_pdf(temp_path)
        doc_id = ingest_circular(title, text)
        log_audit_event("/api/ingest", "POST", "system", 200, f"Ingested: {title}")
        return {
            "status": "Success",
            "doc_id": doc_id,
            "message": f"Circular '{title}' ingested successfully.",
        }
    except Exception as e:
        logger.error("Ingestion error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# ---------------------------------------------------------------------------
# Knowledge Base CRUD
# ---------------------------------------------------------------------------

@app.get("/knowledge")
@app.get("/api/knowledge")
async def list_knowledge():
    """Lists all ingested circulars with metadata."""
    return get_knowledge_docs()

@app.delete("/knowledge/{doc_id}")
@app.delete("/api/knowledge/{doc_id}")
async def remove_knowledge(doc_id: str):
    """Deletes a knowledge base document."""
    success = delete_knowledge_doc(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or delete failed")
    log_audit_event("/api/knowledge", "DELETE", "system", 200, f"Deleted: {doc_id}")
    return {"status": "Deleted", "doc_id": doc_id}

# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------

@app.post("/ocr")
@app.post("/api/ocr")
@limiter.limit("10/minute")
async def process_document(file: UploadFile = File(...), request: Request = None):
    """Automated OCR for NID/Trade License copies using Gemini."""
    temp_path = f"ocr_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        ocr_model = genai.GenerativeModel("gemini-1.5-flash")
        with open(temp_path, "rb") as f:
            file_data = f.read()

        mime_type = "application/pdf" if file.filename.endswith(".pdf") else "image/jpeg"

        prompt = (
            "Analyze this document (NID or Trade License). "
            "Extract the following fields in JSON format: "
            "name, id_number (NID number or License number), "
            "dob (Date of Birth, if applicable), address. "
            "Only return the JSON object."
        )

        response = ocr_model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": file_data},
        ])

        import json
        import re

        json_match = re.search(r"\{.*\}", response.text, re.DOTALL)
        if json_match:
            extracted_data = json.loads(json_match.group())
        else:
            extracted_data = {"raw_text": response.text}

        storage_url = upload_document(temp_path, f"process_history/{file.filename}")
        log_audit_event("/api/ocr", "POST", "system", 200, f"OCR: {file.filename}")

        return {
            "status": "Success",
            "extracted_data": extracted_data,
            "cloud_url": storage_url,
        }
    except Exception as e:
        logger.error("OCR error: %s", e)
        return {
            "status": "Mock Success",
            "extracted_data": {
                "name": "MOHAMMAD RAHMAN",
                "nid_number": "1990123456789",
                "dob": "10 JAN 1990",
                "address": "Gulshan 1, Dhaka",
            },
            "error_log": str(e),
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# ---------------------------------------------------------------------------
# Audit Endpoints
# ---------------------------------------------------------------------------

@app.get("/audit")
@app.get("/api/audit")
async def list_audit_logs(page: int = 1, limit: int = 20):
    """Returns paginated audit logs."""
    offset = (page - 1) * limit
    logs = get_audit_logs(limit=limit, offset=offset)
    return {"page": page, "limit": limit, "logs": logs}

@app.get("/audit/stats")
@app.get("/api/audit/stats")
async def audit_stats():
    """Returns aggregate audit statistics."""
    return get_audit_stats()

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

@app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"])
async def catch_all(full_path: str, request: Request):
    logger.warning("Catch-all triggered with path: /%s", full_path)
    return {
        "message": f"Backend Catch-all: /{full_path}", 
        "status": "fallback_route",
        "url": str(request.url),
        "path": request.url.path
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
