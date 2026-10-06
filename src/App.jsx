import { useEffect, useRef, useState } from "react";
import { chat, createSession } from "./api";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [model, setModel] = useState("—");
  const [messages, setMessages] = useState([]);
  const [steps, setSteps] = useState([]);
  const [files, setFiles] = useState([]);
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    createSession()
      .then((s) => {
        setSessionId(s.session_id);
        setModel(s.model);
        setMessages([
          {
            role: "assistant",
            text:
              "I'm Super Muse. One request is enough — I'll plan it, hand parts to my " +
              "researcher / builder / data / writer specialists, and have a reviewer check " +
              "anything before it's written to your workspace. Try me.",
          },
        ]);
      })
      .catch((e) =>
        setMessages([
          { role: "assistant", text: `Can't reach the API (${e.message}). Is the super-muse backend running on :8091?` },
        ])
      );
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const out = await chat(sessionId, text);
      setMessages((m) => [...m, { role: "assistant", text: out.summary }]);
      setSteps(out.steps || []);
      setFiles(out.files || []);
      setReview(out.review || null);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `Request failed: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <header>
        <strong>Super Muse</strong>
        <span className="sub">
          One ask → a planner delegates to specialists → a reviewer gates anything written. Model: {model}
        </span>
      </header>
      <main>
        <section className="chatpane">
          <div className="log" ref={logRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>{m.text}</div>
            ))}
            {busy && <div className="msg assistant">Planning and delegating…</div>}
          </div>
          <form onSubmit={send}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for research, a draft, data, or something built…"
              autoComplete="off"
            />
            <button type="submit" disabled={busy || !sessionId}>Send</button>
          </form>
        </section>
        <aside className="side">
          <h3>Agent trace</h3>
          {steps.length === 0 && <i>No runs yet.</i>}
          {steps.map((s, i) => (
            <div key={i} className="step">
              <b>{s.agent}</b> <span className="kind">{s.kind}</span>
              <br />{s.task}
              <br /><i>{s.output}</i>
            </div>
          ))}
          <h3>Workspace files</h3>
          <pre>{files.length ? files.join("\n") : "—"}</pre>
          <h3>Review</h3>
          <pre>{review ? JSON.stringify(review, null, 2) : "No file plan to review."}</pre>
        </aside>
      </main>
    </div>
  );
}
