# vyber-ui

The React UI for **Vyber**. The backend (orchestrator, subagents,
memory, API) lives in the separate repo
[vyber](https://github.com/revanthsamavedam/vyber) — this repo
is only the browser app: chat on the left, and on the right a **live
activity view**: every run is a card whose steps stream in over SSE as
the planner delegates and subagents finish. The chat never locks —
messages sent while a run is working queue up server-side, and each
running card has a Stop button.

## Run it

```bash
# 1. backend (from the vyber repo)
uvicorn api.main:app --port 8091

# 2. this UI
npm install
npm run dev        # http://localhost:5173
```

In dev, Vite proxies `/api` to the backend on :8091, so no CORS setup is
needed locally. For a deployed UI, build with `VITE_API_URL` pointing at
the API origin (`npm run build`) and add that origin to the API's
`VYBER_CORS_ORIGINS`.

The demo auth header in `src/api.js` (`Bearer demo:alice`) stands in for
the SSO token a production shell would inject — swap that one place when
the real identity flow is wired.
