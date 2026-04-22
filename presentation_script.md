# Oral Presentation: AI Powered Intelligent Decision Making System

## 1. Introduction
**Slide/Opening Hook:** 
"Welcome. Today I am presenting the **AI Powered Intelligent Decision Making System**, our Applied AI Project designed to revolutionize enterprise credit risk management. We have evolved a standard CRM prototype into a high-scale, AI-native assistant."

## 2. Why It Is Important (The Problem & Solution)
**Key Talking Points:**
* **The TAT Bottleneck:** Traditional credit risk assessment and manual reviews of extensive credit manuals (sometimes over 1,000 pages) take too long, leading to high Turn Around Times (TAT).
* **Accuracy and Compliance:** Relying solely on manual audits can lead to inconsistencies. Our system ensures that every decision is grounded in official policy (like Bangladesh Bank Circulars and internal guidelines).
* **Modernization:** It bridges the gap between legacy CRM data and modern Agentic AI, automating tedious tasks like customer onboarding and initial risk screening.

## 3. How It Works (The Core Mechanism)
**Key Talking Points:**
* **Retrieval-Augmented Generation (RAG):** The system doesn't just guess; it uses a **Grounded Citation Engine**. When a query or risk assessment is made, the AI retrieves specific rules from the internal manuals and provides answers with exact Reference Numbers.
* **Agentic Risk Assessment:** Using a multi-step semantic verification process, the system acts as an "Agentic Risk Assessor." It audits human input and calculates an AI Confidence Score before making a recommendation.
* **Automated Workflows:** Once a lead is processed, the system formats loan data and triggers automated approval flows (webhooks) to notify managers or update backend systems.
* **Real-time Synchronization:** Data and AI decisions are instantly synced to a cloud database, ensuring all users see the latest status.

## 4. What Are The Tools (The Tech Stack)
**Key Talking Points:**
* **Frontend (Next.js & Recharts):** Provides a premium, dark-mode glassmorphism UI with live financial charts and role-based navigation.
* **Backend (FastAPI):** A robust, modular API handling business logic and Pydantic schemas.
* **AI Engine (Gemini 1.5 Pro):** Chosen for its massive 2-million token context window, allowing it to process entire policy manuals simultaneously.
* **Automation (n8n):** Handles the background approval flows and webhook integrations.
* **Database (Firebase / Cloud Firestore):** Handles persistent, real-time data storage, moving beyond local JSON files.
* **Agentic Framework (Antigravity):** Powers the multi-step audit and intelligent decision-making logic.

## 5. Additional Key Points (Security, Reporting & Future)
**Key Talking Points:**
* **Enterprise Security (RBAC):** We implemented Role-Based Access Control so sensitive audits and verifications are restricted to authorized administrators.
* **Professional Reporting:** The system features automated, enterprise-grade PDF generation with IPDC branding for official documentation.
* **Multimodal OCR:** The system can read and extract data directly from uploaded customer documents, accelerating onboarding.
* **Future Roadmap:** Looking ahead, we plan to implement Vector Search via Vertex AI for faster policy retrieval, set up automated CI/CD pipelines, and introduce a full Audit Trail Dashboard for maximum compliance.

## 6. Conclusion
**Closing Statement:**
"In summary, the AI Powered Intelligent Decision Making System proves that by combining state-of-the-art tools like Gemini, RAG, and automated workflows, we can drastically reduce processing times while increasing the safety and accuracy of credit decisions. Thank you."
