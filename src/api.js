// API client for the super-muse backend (separate repo: super-muse).
// Demo auth header stands in for the real SSO token the shell would inject.
const BASE = import.meta.env.VITE_API_URL || "";
const HEADERS = {
  Authorization: "Bearer demo:alice",
  "Content-Type": "application/json",
};

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

export const createSession = (user = "alice") => post("/api/session", { user });
export const chat = (sessionId, message) =>
  post("/api/chat", { session_id: sessionId, message });
