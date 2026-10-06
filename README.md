# super-muse-ui

The React UI for **Super Muse**. The backend (orchestrator, subagents,
memory, API) lives in the separate repo
[super-muse](https://github.com/revanthsamavedam/super-muse) — this repo
is only the browser app: chat on the left, live agent trace / workspace
files / review on the right.

## Run it

```bash
# 1. backend (from the super-muse repo)
uvicorn api.main:app --port 8091

# 2. this UI
npm install
npm run dev        # http://localhost:5173
```

In dev, Vite proxies `/api` to the backend on :8091, so no CORS setup is
needed locally. For a deployed UI, build with `VITE_API_URL` pointing at
the API origin (`npm run build`) and add that origin to the API's
`SUPER_CORS_ORIGINS`.

The demo auth header in `src/api.js` (`Bearer demo:alice`) stands in for
the SSO token a production shell would inject — swap that one place when
the real identity flow is wired.
