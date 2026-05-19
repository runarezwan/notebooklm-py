/**
 * Typed API client for the FastAPI backend.
 * All endpoints use NEXT_PUBLIC_API_URL so we never hardcode localhost.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatResponse {
  answer: string;
  citation: string;
}

export interface EligibilityRequest {
  product_type: string;
  income: number;
  existing_emi: number;
  asset_value: number;
  tenure_years: number;
  interest_rate: number;
  customer_name?: string;
}

export interface EligibilityResponse {
  income_limit: number;
  asset_limit: number;
  final_limit: number;
  status: string;
}

export interface CIBRequest {
  customer_name: string;
  nid_number?: string | null;
}

export interface CIBResponse {
  customer_found: boolean;
  record_count: number;
  history: Record<string, unknown>[];
  cib_analysis: string;
}

export interface OCRResponse {
  status: string;
  extracted_data: Record<string, string>;
  cloud_url?: string;
  error_log?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime_seconds: number;
  firebase_connected: boolean;
}

export interface AuditLog {
  id: string;
  endpoint: string;
  method: string;
  user_id: string;
  status_code: number;
  summary: string;
  timestamp: string;
}

export interface AuditLogsResponse {
  page: number;
  limit: number;
  logs: AuditLog[];
}

export interface AuditStats {
  total_appraisals: number;
  total_audit_events: number;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: string;
  timestamp: string;
  content_length: number;
  chunk_count?: number;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const api = {
  chat: (query: string) => post<ChatResponse>("/api/chat", { query }),

  eligibility: (data: EligibilityRequest) =>
    post<EligibilityResponse>("/api/eligibility", data),

  history: () => get<Record<string, unknown>[]>("/api/history"),

  cib: (data: CIBRequest) => post<CIBResponse>("/api/cib", data),

  ingest: (file: File, title: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    return postForm<{ status: string; doc_id: string; message: string }>(
      "/api/ingest",
      fd,
    );
  },

  ocr: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return postForm<OCRResponse>("/api/ocr", fd);
  },

  health: () => get<HealthResponse>("/api/health"),

  auditLogs: (page = 1, limit = 20) =>
    get<AuditLogsResponse>(`/api/audit?page=${page}&limit=${limit}`),

  auditStats: () => get<AuditStats>("/api/audit/stats"),

  knowledgeList: () => get<KnowledgeDoc[]>("/api/knowledge"),

  knowledgeDelete: (docId: string) =>
    del<{ status: string; doc_id: string }>(`/api/knowledge/${docId}`),
};
