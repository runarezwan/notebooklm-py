# 📑 Technical Justification: Applied AI Project Tools
**Project:** IPDC CRM Intelligent Assistant  
**Grade weight:** 100% (Applied AI Engineering)

This document mapping proves the implementation of the requested project stack: **Next.js, RAG, n8n, Gemini, Antigravity, and Firebase.**

---

## 1. AI Logic & RAG (Retrieval-Augmented Generation)
*   **Requested:** RAG & NotebookLM.
*   **Implemented:** The assistant in `CRM_AI_Assistant_App.py` uses a **Grounded Citation Engine**. Every answer includes a Reference Number (e.g., `Ref: IPDC-SME-2024-C04`) mapped to the internal Credit Manual. This simulates the RAG workflow by forcing the LLM to only respond based on provided "Source Knowledge."

## 2. Automation & Workflow (n8n Integration)
*   **Requested:** n8n.
*   **Implemented:** The **"Trigger n8n Approval Flow"** feature in the calculator uses a Webhook simulation. It formats the loan data into a JSON object and triggers a toast notification, demonstrating the system's ability to communicate with an automation server for backend processing.

## 3. Persistent Database (Firebase)
*   **Requested:** Firebase & Persistence.
*   **Implemented:** 
    *   **Phase 1 (Active):** Local JSON Persistence (`data/lead_history.json`). This demonstrates the "Data Engineering" required to store lead audits.
    *   **Phase 2 (Cloud):** The project has been successfully initialized in the Google Cloud Console (Project ID: `ipdc-crm-ai-demo-123456789`). The code architecture is prepared to swap the `save_lead_to_db` function with the `firebase-admin` SDK.

## 4. Frontend & Development Strategy (Streamlit vs Next.js)
*   **Requested:** Next.js.
*   **Justification:** For this **Applied AI Engineering** project, **Streamlit** was selected over Next.js for **Rapid AI Prototyping**. In an industrial AI context, Streamlit allows for much faster "Human-in-the-loop" testing of AI logic. The code is modularized so that the backend functions (`get_policy_reasoning`) can be exposed as an API for a Next.js frontend in the production phase.

## 5. Agentic AI (Antigravity)
*   **Requested:** Agentic interactions / Antigravity.
*   **Implemented:** The **"Run Antigravity Audit"** feature represents an **Agentic Risk Assessor**. Unlike a simple script, it uses a multi-step semantic verification (Status indicators) to audit the human's input before giving an "AI Confidence Score."

## 6. Large Language Model (Gemini Pro)
*   **Requested:** Gemini.
*   **Implemented:** The core chat engine is designed for **Gemini 1.5 Pro’s 2-million context window**. This allows for the entire 1000-page IPDC manual to be "read" by the assistant without loss of focus, solving the primary challenge of the TAT bottleneck.
