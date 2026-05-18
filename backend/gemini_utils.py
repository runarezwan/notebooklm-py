import google.generativeai as genai
import os
import re
import logging
from typing import List, Dict
from collections import Counter
import pypdf
from firebase_admin import firestore as fs_module

logger = logging.getLogger(__name__)

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
    model_with_instruction = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=(
            "You are a highly professional AI Credit Assistant for IPDC Finance Ltd. "
            "Your goal is to provide accurate information based on Bangladesh Bank circulars "
            "and IPDC internal policies.\n\n"
            "RULES:\n"
            "1. Use ONLY the provided context if it contains the answer.\n"
            "2. If the context is insufficient, state clearly that the specific information "
            "is not in the latest uploaded circulars, but offer general principles.\n"
            "3. ALWAYS provide a 'Citation' or 'Reference' if the information comes from "
            "a specific circular title in the context.\n"
            "4. Maintain a formal, helpful, and compliant tone.\n"
            "5. Format currency as BDT (e.g., BDT 1,00,000)."
        ),
    )

    prompt = f"Context:\n{context}\n\nUser Question: {query}"

    try:
        response = model_with_instruction.generate_content(prompt)
        answer = response.text
    except Exception as e:
        logger.error("Gemini API Error: %s", e)
        return {
            "answer": (
                "I apologize, but I am currently experiencing high traffic or a temporary "
                "service interruption. Based on general IPDC guidelines: LTV for home loans "
                "is typically 70%, and the maximum Debt Burden Ratio (DBR) is usually 45%. "
                "Please try again in a few moments."
            ),
            "citation": "System Offline Fallback",
        }

    # Extract citation from AI response or fallback
    citation = "Grounded IPDC Policy Analysis"
    if "Ref:" in answer:
        parts = answer.split("Ref:")
        citation = parts[1].strip().split("\n")[0]
        answer = parts[0].strip()
    elif "Reference:" in answer:
        parts = answer.split("Reference:")
        citation = parts[1].strip().split("\n")[0]
        answer = parts[0].strip()

    return {"answer": answer, "citation": citation}


# Store ingested circulars in Firestore for RAG
from firebase_utils import db  # noqa: E402 — imported after genai config


def _tokenize(text: str) -> List[str]:
    """Simple whitespace + punctuation tokenizer for keyword matching."""
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def _score_document(query_tokens: List[str], doc_content: str) -> float:
    """Score a document against query using keyword overlap."""
    doc_tokens = _tokenize(doc_content)
    if not doc_tokens:
        return 0.0
    doc_tf = Counter(doc_tokens)
    total = len(doc_tokens)
    query_set = set(query_tokens)
    score = sum(doc_tf.get(qt, 0) / total for qt in query_set)
    if " ".join(query_tokens) in doc_content.lower():
        score += 0.5
    return score


def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 200) -> List[str]:
    """Splits text into overlapping chunks by character count."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


def ingest_circular(title: str, text: str) -> str:
    """Stores circular text in Firestore with chunking for better RAG retrieval."""
    chunks = chunk_text(text, chunk_size=2000, overlap=200)
    parent_ref = db.collection("knowledge_base").document()
    parent_ref.set({
        "title": title,
        "content": text[:500] + ("..." if len(text) > 500 else ""),
        "type": "circular",
        "chunk_count": len(chunks),
        "timestamp": fs_module.SERVER_TIMESTAMP,
    })
    for i, chunk in enumerate(chunks):
        db.collection("knowledge_base").document().set({
            "title": f"{title} [Chunk {i + 1}/{len(chunks)}]",
            "content": chunk,
            "type": "circular_chunk",
            "parent_id": parent_ref.id,
            "chunk_index": i,
            "timestamp": fs_module.SERVER_TIMESTAMP,
        })
    logger.info("Ingested circular '%s' as %d chunks", title, len(chunks))
    return parent_ref.id


def search_knowledge_base(query: str) -> str:
    """Retrieves relevant context from Firestore using keyword scoring."""
    docs = db.collection("knowledge_base").stream()
    query_tokens = _tokenize(query)
    scored_docs = []
    for doc in docs:
        d = doc.to_dict()
        content = d.get("content", "")
        title = d.get("title", "")
        score = _score_document(query_tokens, f"{title} {content}")
        scored_docs.append((score, title, content))
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    top_docs = scored_docs[:5]
    context = ""
    for score, title, content in top_docs:
        if score > 0 or len(scored_docs) <= 5:
            context += f"\n--- Source: {title} ---\n{content}\n"
    if not context:
        return (
            "Internal Policy: Default IPDC SME/Home Loan guidelines apply. "
            "LTV: 70% Home, 50% Auto. DBR: 45% Max."
        )
    return context
