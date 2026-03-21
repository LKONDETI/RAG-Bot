const BASE = "http://localhost:8000";

export interface Document {
  id: string;
  filename: string;
}

export interface Source {
  filename: string;
  excerpt: string;
}

export interface QueryResult {
  answer: string;
  sources: Source[];
}

export interface AuthResult {
  token: string;
  username: string;
  user_id: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function loginUser(username: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  return data;
}

export async function registerUser(username: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function uploadDocument(file: File, authHeaders: Record<string, string>): Promise<Document> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: authHeaders,
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return { id: data.doc_id, filename: data.filename };
}

export async function listDocuments(authHeaders: Record<string, string>): Promise<Document[]> {
  const res = await fetch(`${BASE}/documents`, { headers: authHeaders });
  if (!res.ok) throw new Error("Failed to list documents");
  return res.json();
}

export async function deleteDocument(id: string, authHeaders: Record<string, string>): Promise<void> {
  const res = await fetch(`${BASE}/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  if (!res.ok) throw new Error("Delete failed");
}

export async function ingestUrl(url: string, authHeaders: Record<string, string>): Promise<Document> {
  const res = await fetch(`${BASE}/ingest-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to ingest URL");
  }
  const data = await res.json();
  return { id: data.doc_id, filename: data.filename };
}

export async function askQuestion(question: string, authHeaders: Record<string, string>): Promise<QueryResult> {
  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Query failed");
  return res.json();
}
