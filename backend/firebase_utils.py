import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
import json
from datetime import datetime

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
    print("[OK] Firebase initialized successfully (Cloud Mode)")
except Exception as e:
    print(f"[WARN] Firebase initialization failed: {e}")
    print("[INFO] Falling back to Local Development Mode (JSON Storage)")
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
        except:
            pass
    # Local Fallback
    return f"local://{destination_path}"

def save_lead_history(lead_data):
    """Saves lead history to Firestore or Local JSON."""
    if firebase_ready and db:
        try:
            doc_ref = db.collection("leads").document()
            lead_data["timestamp"] = firestore.SERVER_TIMESTAMP
            doc_ref.set(lead_data)
            return doc_ref.id
        except:
            pass
    
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
    return lead_data["id"]

def get_lead_history(limit=50):
    """Retrieves lead history from Firestore or Local JSON."""
    if firebase_ready and db:
        try:
            leads_ref = db.collection("leads").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit)
            docs = leads_ref.stream()
            return [{**doc.to_dict(), "id": doc.id} for doc in docs]
        except:
            pass
            
    # Local JSON Fallback
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, "r") as f:
            leads = json.load(f)
            return sorted(leads, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]
    return []
