import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "ipdc-crm-ai-demo-123456789",
  appId: "1:762028635470:web:59406873d34f5f8d7cda1f",
  storageBucket: "ipdc-crm-ai-demo-123456789.firebasestorage.app",
  apiKey: "AIzaSyB12wK2zMkplX2oyuvRVszVAhnmgP-b6zk",
  authDomain: "ipdc-crm-ai-demo-123456789.firebaseapp.com",
  messagingSenderId: "762028635470"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
