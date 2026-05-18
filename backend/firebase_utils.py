import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Local Fallback Setup
LOCAL_DATA_DIR = "data"
os.makedirs(LOCAL_DATA_DIR, exist_ok=True)
LEADS_FILE = os.path.join(LOCAL_DATA_DIR, "leads.json")

# Initialize Firebase Admin with Robust Error Handling
firebase_ready = False
try:
    if not firebase_admin._apps:
        firebase_admin.initialize_app(options={
            'storageBucket': "ipdc-crm-ai-demo-123456789.firebasestorage.app"
        })
    db = firestore.client()
    bucket = storage.bucket()
    firebase_ready = True
    logger.info("Firebase initialized successfully (Cloud Mode)")
except ValueError as e:
    logger.warning("Firebase config error: %s", e)
    logger.info("Falling back to Local Development Mode (JSON Storage)")
    db = None
    bucket = None
except Exception as e:
    logger.warning("Firebase initialization failed: %s", e)
    logger.info("Falling back to Local Development Mode (JSON Storage)")
    db = None
    bucket = None


def upload_document(file_path: str, destination_path: str):
    """Uploads a file to Firebase Storage or saves locally if offline."""
    if firebase_ready and bucket:
        try:
            blob = bucket.blob(destination_path)
            blob.upload_from_filename(file_path)
            blob.make_public()
            return blob.public_url
        except Exception as e:
            logger.error("Storage upload failed for %s: %s", destination_path, e)
    # Local Fallback
    return f"local://{destination_path}"


def save_lead_history(lead_data):
    """Saves lead history to Firestore or Local JSON."""
    if firebase_ready and db:
        try:
            doc_ref = db.collection("leads").document()
            lead_data["timestamp"] = firestore.SERVER_TIMESTAMP
            doc_ref.set(lead_data)
            logger.info("Lead saved to Firestore: %s", doc_ref.id)
            return doc_ref.id
        except Exception as e:
            logger.error("Firestore write failed: %s", e)

    # Local JSON Fallback
    leads = []
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, "r") as f:
            leads = json.load(f)

    lead_data["id"] = str(len(leads) + 1)
    lead_data["timestamp"] = datetime.now().isoformat()
    leads.append(lead_data)

    with open(LEADS_FILE, "w") as f:
        json.dump(leads, f, indent=4)
    logger.info("Lead saved locally: %s", lead_data["id"])
    return lead_data["id"]


def get_lead_history(limit=50):
    """Retrieves lead history from Firestore or Local JSON."""
    if firebase_ready and db:
        try:
            leads_ref = db.collection("leads").order_by(
                "timestamp", direction=firestore.Query.DESCENDING
            ).limit(limit)
            docs = leads_ref.stream()
            return [{**doc.to_dict(), "id": doc.id} for doc in docs]
        except Exception as e:
            logger.error("Firestore read failed: %s", e)

    # Local JSON Fallback
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, "r") as f:
            leads = json.load(f)
            return sorted(leads, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]
    return []


def log_audit_event(endpoint: str, method: str, user_id: str, status_code: int, summary: str):
    """Logs an API call to the audit_logs Firestore collection."""
    if firebase_ready and db:
        try:
            db.collection("audit_logs").document().set({
                "endpoint": endpoint,
                "method": method,
                "user_id": user_id or "anonymous",
                "status_code": status_code,
                "summary": summary,
                "timestamp": firestore.SERVER_TIMESTAMP,
            })
        except Exception as e:
            logger.error("Audit log write failed: %s", e)
    else:
        logger.debug(
            "Audit (local): %s %s -> %d | %s", method, endpoint, status_code, summary
        )


def get_audit_logs(limit: int = 20, offset: int = 0):
    """Retrieves audit logs from Firestore with pagination."""
    if firebase_ready and db:
        try:
            query = (
                db.collection("audit_logs")
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .limit(limit)
                .offset(offset)
            )
            docs = query.stream()
            return [{**doc.to_dict(), "id": doc.id} for doc in docs]
        except Exception as e:
            logger.error("Audit log read failed: %s", e)
    return []


def get_audit_stats():
    """Returns aggregate audit statistics."""
    if firebase_ready and db:
        try:
            # Count total leads
            leads = db.collection("leads").stream()
            total_leads = sum(1 for _ in leads)

            # Count audit events
            logs = db.collection("audit_logs").stream()
            total_events = sum(1 for _ in logs)

            return {
                "total_appraisals": total_leads,
                "total_audit_events": total_events,
            }
        except Exception as e:
            logger.error("Audit stats read failed: %s", e)
    return {"total_appraisals": 0, "total_audit_events": 0}


def get_knowledge_docs():
    """Returns metadata for all ingested knowledge base documents."""
    if firebase_ready and db:
        try:
            docs = (
                db.collection("knowledge_base")
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .stream()
            )
            results = []
            for doc in docs:
                d = doc.to_dict()
                results.append({
                    "id": doc.id,
                    "title": d.get("title", "Untitled"),
                    "type": d.get("type", "circular"),
                    "timestamp": str(d.get("timestamp", "")),
                    "content_length": len(d.get("content", "")),
                })
            return results
        except Exception as e:
            logger.error("Knowledge base read failed: %s", e)
    return []


def delete_knowledge_doc(doc_id: str) -> bool:
    """Deletes a knowledge base document by ID."""
    if firebase_ready and db:
        try:
            db.collection("knowledge_base").document(doc_id).delete()
            logger.info("Knowledge doc deleted: %s", doc_id)
            return True
        except Exception as e:
            logger.error("Knowledge doc delete failed: %s", e)
    return False
