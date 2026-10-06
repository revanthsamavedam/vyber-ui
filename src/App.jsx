import { useEffect, useRef, useState } from "react";
import { cancelRun, createSession, startChat, streamRun } from "./api";

const TERMINAL = ["done", "failed", "cancelled"];

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [model, setModel] = useState("—");
  const [messages, setMessages] = useState([]);
  const [runs, setRuns] = useState([]); // [{id, prompt, status, steps, live}]
  const [files, setFiles] = useState([]);
  const [review, setReview] = useState(null);
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
              "I'm Vyber. One request is enough — I'll plan it, hand parts to my " +
              "researcher / builder / data / writer specialists, and have a reviewer check " +
              "anything before it's written. The chat never locks: send more messages while " +
              "I work and they'll queue, and you can stop a run from its card.",
          },
        ]);
      })
      .catch((e) =>
        setMessages([
          { role: "assistant", text: `Can't reach the API (${e.message}). Is the vyber backend running on :8091?` },
        ])
      );
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  function patchRun(id, patch) {
    setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function watchRun(runId) {
    streamRun(runId, (event) => {
      if (event.type === "status") {
        patchRun(runId, { status: event.status });
      } else if (event.type === "subagent.started") {
        patchRun(runId, {});
        setRuns((rs) =>
          rs.map((r) =>
            r.id === runId
              ? { ...r, live: `${event.agent} is working on: ${event.task}` }
              : r
          )
        );
      } else if (event.type === "step") {
        setRuns((rs) =>
          rs.map((r) =>
            r.id === runId ? { ...r, steps: [...r.steps, event.step], live: "" } : r
          )
        );
      } else if (event.type === "result") {
        const res = event.result;
        patchRun(runId, { status: "done", live: "" });
        setMessages((m) => [...m, { role: "assistant", text: res.summary }]);
        setFiles(res.files || []);
        setReview(res.review || null);
      } else if (event.type === "error") {
        patchRun(runId, { status: "failed", live: "" });
        setMessages((m) => [...m, { role: "assistant", text: `Run failed: ${event.error}` }]);
      }
    }).catch(() => {
      // Stream dropped — the run card's status may lag; a refresh of the
      // page loses nothing server-side (runs and events persist there).
    });
  }

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !sessionId) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    try {
      const { run_id } = await startChat(sessionId, text);
      setRuns((rs) => [
        ...rs,
        { id: run_id, prompt: text, status: "queued", steps: [], live: "" },
      ]);
      watchRun(run_id);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `Couldn't start a run: ${err.message}` }]);
    }
  }

  async function stop(runId) {
    try {
      const out = await cancelRun(runId);
      patchRun(runId, { status: out.status, live: "" });
    } catch {
      /* run may have just finished — status will arrive via the stream */
    }
  }

  return (
    <div className="shell">
      <header>
        <strong>Vyber</strong>
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
          </div>
          <form onSubmit={send}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for research, a draft, data, or something built… (Enter queues it)"
              autoComplete="off"
            />
            <button type="submit" disabled={!sessionId}>Send</button>
          </form>
        </section>
        <aside className="side">
          <h3>Live activity</h3>
          {runs.length === 0 && <i>No runs yet.</i>}
          {runs.map((run) => (
            <div key={run.id} className="run">
              <div className="run-head">
                <span className={`chip ${run.status}`}>{run.status}</span>
                <span className="run-prompt">{run.prompt}</span>
                {!TERMINAL.includes(run.status) && (
                  <button className="stop" onClick={() => stop(run.id)}>Stop</button>
                )}
              </div>
              {run.live && <div className="live">● {run.live}</div>}
              {run.steps.map((s, i) => (
                <div key={i} className="step">
                  <b>{s.agent}</b> <span className="kind">{s.kind}</span>
                  <br />{s.task}
                  <br /><i>{s.output}</i>
                </div>
              ))}
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
