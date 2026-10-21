import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Send,
  MessageSquare,
  Plus,
  ArrowUpRight,
  Info,
  LoaderCircle,
  BookOpen,
} from "lucide-react";
import type { WorkspaceContext } from "../layouts/WorkspaceLayout";
import type { Message } from "../types";
import { useAuth } from "../hooks/AuthContext";
import { workspaceConfig } from "../services/workspaces";
import { api } from "../services/api";
import { ErrorMessage } from "../components/Status";
import { Sources } from "../components/ReportPanel";
export default function AssistantPage() {
  const { workspace, health } = useOutletContext<WorkspaceContext>();
  const c = workspaceConfig[workspace];
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages([]);
    setDraft("");
    setError("");
  }, [workspace, user?.id]);
  useEffect(() => {
    if (messages.length)
      end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    if (!user) {
      setError("Sign in to use your workspace assistant.");
      return;
    }
    const updated: Message[] = [
      ...messages,
      { role: "user", content: draft.trim() },
    ];
    setMessages(updated);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      const result = await api.chat(workspace, updated.slice(-19));
      setMessages([
        ...updated,
        { role: "assistant", content: result.message, sources: result.sources },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">ASK. UNDERSTAND. GROW.</span>
          <h1>Your {c.name} assistant</h1>
          <p>
            A focused space for questions about{" "}
            {workspace === "agrivision"
              ? "plants, crops, and farming"
              : "livestock and everyday animal care"}
            .
          </p>
        </div>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={() => {
            setMessages([]);
            setError("");
            setDraft("");
          }}
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>
      <div className="assistant-grid">
        <section className="panel chat-panel">
          <header className="chat-header">
            <span className="circle-icon">
              <c.icon size={23} />
            </span>
            <div>
              <strong>{c.name} AI Assistant</strong>
              <small>
                {health?.workspaces[workspace].assistant_configured
                  ? "AI service configured"
                  : "AI service currently unavailable"}
              </small>
            </div>
          </header>
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <span className="chat-welcome-icon">
                  <MessageSquare size={34} strokeWidth={1.3} />
                </span>
                <h2>What’s on your mind?</h2>
                <p>
                  Start with your{" "}
                  {workspace === "agrivision"
                    ? "crop and growing conditions"
                    : "animal and your observations"}
                  .<br />A little context helps make a better conversation.
                </p>
                <div className="chat-prompts">
                  {c.prompts.map((p) => (
                    <button onClick={() => setDraft(p)} key={p}>
                      {p}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div className={`chat-message ${m.role}`} key={i}>
                  <small>
                    {m.role === "user" ? "You" : `${c.name} assistant`}
                  </small>
                  <p>{m.content}</p>
                  {m.sources && <Sources sources={m.sources} />}
                </div>
              ))
            )}
            {busy && (
              <div className="loading" role="status">
                <LoaderCircle className="spin" size={18} />
                Thinking…
              </div>
            )}
            <div ref={end} />
          </div>
          {error && (
            <div className="chat-error">
              <ErrorMessage message={error} />
            </div>
          )}
          {!user && (
            <div className="chat-login">
              <Link to={`/auth/login?next=/${workspace}/assistant`}>
                Sign in
              </Link>{" "}
              to ask the assistant. You can read the guide without an account.
            </div>
          )}
          <form className="chat-composer" onSubmit={send}>
            <label className="sr-only" htmlFor="chat-input">
              Your question
            </label>
            <textarea
              id="chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Ask about your ${c.plural}…`}
              rows={2}
              maxLength={2000}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              className="button"
              disabled={busy || !draft.trim()}
              aria-label="Send question"
            >
              <Send size={19} />
            </button>
          </form>
          <p className="chat-footnote">
            Educational guidance. Always confirm important care decisions with a
            qualified expert.
          </p>
        </section>
        <aside className="assistant-side">
          <div className="panel">
            <Info size={25} />
            <h2>A little context helps.</h2>
            <p>
              {workspace === "agrivision"
                ? "Share your crop, location, recent weather, and when the symptoms first appeared."
                : "Share the animal’s species, age, behaviour, and when you first noticed a change."}
            </p>
            <p>The assistant cannot provide a professional diagnosis.</p>
          </div>
          <Link className="guide-prompt" to={`/${workspace}/guide`}>
            <BookOpen size={24} />
            <div>
              <strong>Need a place to start?</strong>
              <span>
                Read the {c.guide.toLowerCase()}
                <ArrowUpRight size={14} />
              </span>
            </div>
          </Link>
        </aside>
      </div>
    </>
  );
}
