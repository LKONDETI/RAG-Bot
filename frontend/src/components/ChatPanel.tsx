import { useState } from "react";
import { QueryResult, Source, askQuestion } from "../api";

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);
    try {
      const result: QueryResult = await askQuestion(question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: result.answer, sources: result.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: could not get a response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (idx: number) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="panel chat-panel">
      <h2>Chat</h2>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <p>{msg.text}</p>
            {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
              <div className="sources">
                <button className="sources-toggle" onClick={() => toggleSources(idx)}>
                  {expandedSources.has(idx) ? "Hide sources" : "Show sources"}
                </button>
                {expandedSources.has(idx) && (
                  <ul>
                    {msg.sources.map((s, si) => (
                      <li key={si}>
                        <strong>{s.filename}</strong>: {s.excerpt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="message assistant"><p>Thinking…</p></div>}
      </div>
      <div className="input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question…"
        />
        <button onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  );
}
