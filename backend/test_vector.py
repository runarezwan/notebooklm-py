from firebase_utils import db
from google.cloud.firestore_v1.vector import Vector
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure

if db:
    try:
        col = db.collection("test_vectors")
        # Check if find_nearest exists
        if hasattr(col, "find_nearest"):
            print("find_nearest IS available.")
        else:
            print("find_nearest IS NOT available.")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("No db")
