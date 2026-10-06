// API client for the vyber backend (separate repo: vyber).
// Demo auth header stands in for the real SSO token the shell would inject.
//
// Chat is ASYNC on the backend: startChat() returns a run id immediately,
// streamRun() follows its Server-Sent Events (via fetch, so the auth
// header can be sent — the browser's EventSource cannot set headers),
// getRun() is the polling fallback, cancelRun() stops a run.
const BASE = import.meta.env.VITE_API_URL || "";
const HEADERS = {
  Authorization: "Bearer demo:alice",
  "Content-Type": "application/json",
};

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

export const createSession = (user = "alice") => post("/api/session", { user });
export const startChat = (sessionId, message) =>
  post("/api/chat", { session_id: sessionId, message });
export const cancelRun = (runId) => post(`/api/runs/${runId}/cancel`);

export async function getRun(runId) {
  const r = await fetch(`${BASE}/api/runs/${runId}`, { headers: HEADERS });
  if (!r.ok) throw new Error(`/api/runs/${runId} -> ${r.status}`);
  return r.json();
}

// Calls onEvent(obj) for every SSE event until the run terminates.
export async function streamRun(runId, onEvent) {
  const r = await fetch(`${BASE}/api/runs/${runId}/events`, { headers: HEADERS });
  if (!r.ok || !r.body) throw new Error(`events -> ${r.status}`);
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop();
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data: "));
      if (line) onEvent(JSON.parse(line.slice(6)));
    }
  }
}
