# 🚀 Vercel Deployment Details

The AI-Powered Intelligent Decision Making System for Bank is officially deployed and live on Vercel.

### 🌐 Live Application URLs
- **Main Production App:** [https://crm-bank-app.vercel.app](https://crm-bank-app.vercel.app)
- **Direct Vercel Domain:** [https://crm-bank-6dr0kmrmu-runarezwans-projects.vercel.app](https://crm-bank-6dr0kmrmu-runarezwans-projects.vercel.app)

### 📊 Vercel Dashboard
You can manage the project, check server logs, configure environment variables, and manage deployments from the Vercel Dashboard:
- **Project Dashboard:** [https://vercel.com/runarezwans-projects/crm-bank-app](https://vercel.com/runarezwans-projects/crm-bank-app)

### ⚙️ Deployment Architecture
This project utilizes a seamless, modern monorepo deployment strategy:
- **Frontend (Next.js):** Deployed to Vercel's global Edge Network, offering instant page loads and optimized assets.
- **Backend (FastAPI Python):** Deployed natively as Vercel Serverless Functions (`api/index.py` pattern), which scale automatically and handle high-computation tasks like RAG analysis and CIB logic.
- **Routing Integration:** The Next.js frontend and Python backend share the exact same domain. Any frontend call made to `/api/...` is transparently routed directly to the Python backend logic, eliminating CORS issues entirely.

---
*Note: To apply any custom Firebase credentials or API keys (like Google Gemini API keys) to the production app, add them via the Settings -> Environment Variables tab on the Vercel Project Dashboard linked above.*
