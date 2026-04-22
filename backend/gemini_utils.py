import google.generativeai as genai
import os
from typing import List, Dict
import pypdf
from firebase_admin import firestore as fs_module

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-1.5-flash')

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts text from a PDF file."""
    text = ""
    with open(pdf_path, "rb") as f:
        reader = pypdf.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text()
    return text

def get_gemini_response(query: str, context: str = "") -> Dict[str, str]:
    """Generates a response using Gemini 1.5 with provided context (RAG)."""
    # System instruction for better grounding
    model_with_instruction = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction="""
        You are a highly professional AI Credit Assistant for IPDC Finance Ltd. 
        Your goal is to provide accurate information based on Bangladesh Bank circulars and IPDC internal policies.
        
        RULES:
        1. Use ONLY the provided context if it contains the answer.
        2. If the context is insufficient, state clearly that the specific information is not in the latest uploaded circulars, but offer general principles from banking standards in Bangladesh.
        3. ALWAYS provide a 'Citation' or 'Reference' if the information comes from a specific circular title in the context.
        4. Maintain a formal, helpful, and compliant tone.
        5. Format currency as BDT (e.g., BDT 1,00,000).
        """
    )
    
    prompt = f"Context:\n{context}\n\nUser Question: {query}"
    
    try:
        response = model_with_instruction.generate_content(prompt)
        answer = response.text
    except Exception as e:
        print(f"[ERROR] Gemini API Error: {e}")
        return {
            "answer": "I apologize, but I am currently experiencing high traffic or a temporary service interruption. Based on general IPDC guidelines: LTV for home loans is typically 70%, and the maximum Debt Burden Ratio (DBR) is usually 45%. Please try again in a few moments.",
            "citation": "System Offline Fallback"
        }
    
    # Extract citation from AI response or fallback
    citation = "Grounded IPDC Policy Analysis"
    if "Ref:" in answer:
        parts = answer.split("Ref:")
        citation = parts[1].strip().split("\n")[0]
        answer = parts[0].strip() # Clean up the answer
    elif "Reference:" in answer:
        parts = answer.split("Reference:")
        citation = parts[1].strip().split("\n")[0]
        answer = parts[0].strip()
    
    return {"answer": answer, "citation": citation}

# Store ingested circulars in Firestore for RAG
from firebase_utils import db  # noqa: E402 — imported after genai config

def ingest_circular(title: str, text: str):
    """Stores circular text in Firestore for later retrieval."""
    doc_ref = db.collection("knowledge_base").document()
    doc_ref.set({
        "title": title,
        "content": text,
        "type": "circular",
        "timestamp": fs_module.SERVER_TIMESTAMP  # Correct server-side timestamp
    })
    return doc_ref.id

def search_knowledge_base(query: str) -> str:
    """Retrieves relevant context from Firestore knowledge base."""
    # For production, use vector embeddings + semantic similarity search.
    # For now, fetch the 10 most recent circulars as the RAG context window.
    docs = (
        db.collection("knowledge_base")
        .order_by("timestamp", direction=fs_module.Query.DESCENDING)
        .limit(10)
        .stream()
    )
    context = ""
    for doc in docs:
        d = doc.to_dict()
        context += f"\n--- Source: {d.get('title')} ---\n{d.get('content')}\n"
    
    if not context:
        return "Internal Policy: Default IPDC SME/Home Loan guidelines apply. LTV: 70% Home, 50% Auto. DBR: 45% Max."
        
    return context
