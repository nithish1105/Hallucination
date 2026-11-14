"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

type User = { id: string; email: string; name: string; role: string };
type VerificationStatus = "supported" | "contradicted" | "conflicting" | "not_verified";
type Evidence = {
  source: string;
  content: string;
  url?: string | null;
  relevance_score?: number;
  nli_label?: string;
  nli_probability?: number | null;
};
type Claim = { id: string; text: string; status: VerificationStatus; confidence?: number | null; evidence: Evidence[] };
type Verification = {
  status: VerificationStatus;
  confidence?: number | null;
  confidence_method?: string;
  reason: string;
  claims: Claim[];
  verification_model_available?: boolean;
};
type Chat = { id: string; title: string; pinned?: boolean; updated_at?: string; last_message?: string };
type Message = {
  id: string;
  chat_id?: string;
  role: "user" | "assistant";
  content: string;
  hallucination?: Verification;
  error?: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...init,
    cache: "no-store",
    headers: { ...(init?.headers ?? {}) },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? data.detail : null;
    if (typeof detail === "string" && detail) throw new Error(detail);
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") return item.msg;
          return "";
        })
        .filter(Boolean);
      if (messages.length) throw new Error(messages.join("; "));
    }
    throw new Error("The request could not be completed.");
  }
  return data as T;
}

const statusLabel: Record<VerificationStatus, string> = {
  supported: "Supported",
  contradicted: "Contradicted",
  conflicting: "Conflicting evidence",
  not_verified: "Not verified",
};

function BrandMark({ small = false }: { small?: boolean }) {
  return <span className={`brand-mark${small ? " brand-mark-small" : ""}`} aria-hidden="true">M</span>;
}

function RichText({ text }: { text: string }) {
  const renderInline = (line: string, keyPrefix: string) => {
    const pieces = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
    return pieces.map((piece, index) => {
      const key = `${keyPrefix}-${index}`;
      if (piece.startsWith("**") && piece.endsWith("**")) return <strong key={key}>{piece.slice(2, -2)}</strong>;
      if (piece.startsWith("`") && piece.endsWith("`")) return <code className="inline-code" key={key}>{piece.slice(1, -1)}</code>;
      const link = piece.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (link) return <a href={link[2]} key={key} target="_blank" rel="noreferrer">{link[1]}</a>;
      return <span key={key}>{piece}</span>;
    });
  };

  const lines = text.split("\n");
  const blocks: Array<{ type: "paragraph" | "list" | "code" | "heading"; lines: string[]; level?: number }> = [];
  let code: string[] | null = null;
  let list: string[] | null = null;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push({ type: "code", lines: code });
        code = null;
      } else {
        if (list) { blocks.push({ type: "list", lines: list }); list = null; }
        code = [];
      }
      continue;
    }
    if (code) { code.push(line); continue; }
    const listItem = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)$/);
    if (listItem) {
      if (!list) list = [];
      list.push(listItem[1]);
      continue;
    }
    if (list) { blocks.push({ type: "list", lines: list }); list = null; }
    if (!line.trim()) continue;
    const heading = line.match(/^\s*(#{1,4})\s+(.+)$/);
    if (heading) blocks.push({ type: "heading", lines: [heading[2]], level: heading[1].length });
    else blocks.push({ type: "paragraph", lines: [line] });
  }
  if (code) blocks.push({ type: "code", lines: code });
  if (list) blocks.push({ type: "list", lines: list });

  return <div className="rich-text">{blocks.map((block, index) => {
    if (block.type === "code") return <pre className="code-block" key={index}><code>{block.lines.join("\n")}</code></pre>;
    if (block.type === "list") return <ul key={index}>{block.lines.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `${index}-${itemIndex}`)}</li>)}</ul>;
    if (block.type === "heading") {
      const Heading = `h${Math.min(block.level ?? 3, 4)}` as "h1" | "h2" | "h3" | "h4";
      return <Heading key={index}>{renderInline(block.lines[0], `${index}-h`)}</Heading>;
    }
    return <p key={index}>{renderInline(block.lines[0], `${index}-p`)}</p>;
  })}</div>;
}

function VerificationCard({ result }: { result: Verification }) {
  return (
    <section className={`verification-card status-${result.status}`} aria-label="Claim verification results">
      <div className="verification-header">
        <span className={`status-dot status-dot-${result.status}`} />
        <strong>{statusLabel[result.status]}</strong>
        {typeof result.confidence === "number" && (
          <span className="confidence-value">{Math.round(result.confidence * 100)}% estimate</span>
        )}
      </div>
      <p className="verification-reason">{result.reason}</p>
      {typeof result.confidence === "number" && (
        <p className="confidence-note">Uncalibrated estimate; not a guarantee of truth.</p>
      )}
      {!result.verification_model_available && (
        <p className="model-note">The NLI verification model is not available locally. Claims without an exact evidence match remain unverified.</p>
      )}
      {result.claims.length > 0 && (
        <div className="claim-list">
          {result.claims.map((claim) => (
            <details className="claim-item" key={claim.id}>
              <summary>
                <span className={`claim-label claim-${claim.status}`}>{statusLabel[claim.status]}</span>
                <span className="claim-text">{claim.text}</span>
              </summary>
              {claim.evidence.length > 0 ? (
                <div className="evidence-list">
                  {claim.evidence.map((item, index) => (
                    <article className="evidence-item" key={`${claim.id}-${index}`}>
                      <div className="evidence-title-row">
                        {item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a> : <strong>{item.source}</strong>}
                        {typeof item.relevance_score === "number" && <span>{Math.round(item.relevance_score * 100)}% match</span>}
                      </div>
                      <p>{item.content}</p>
                      {item.nli_label && <small>Model result: {item.nli_label.replaceAll("_", " ")}</small>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="no-evidence">No supporting passage was found for this claim.</p>
              )}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [otpStep, setOtpStep] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        const result = await api<{ user: User }>("auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        onAuthenticated(result.user);
      } else if (!otpStep) {
        const result = await api<{ message: string; dev_otp?: string }>("auth/send-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, purpose: "signup" }),
        });
        setNotice(result.message);
        setDevOtp(result.dev_otp ?? "");
        setOtpStep(true);
      } else {
        await api("auth/verify-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, otp, purpose: "signup" }),
        });
        const result = await api<{ user: User }>("auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, name, password }),
        });
        onAuthenticated(result.user);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setOtpStep(false);
    setError("");
    setNotice("");
  }

  return (
    <main className="auth-shell">
      <div className="auth-topline"><BrandMark /><span>MAYA AI</span><span className="auth-topline-note">Evidence-aware answers</span></div>
      <section className="auth-card">
        <div className="auth-brand"><BrandMark /><span>MAYA</span></div>
        <p className="eyebrow">AI answer verification</p>
        <h1>{mode === "login" ? "Welcome back" : otpStep ? "Check your inbox" : "Create your account"}</h1>
        <p className="auth-subtitle">{mode === "login" ? "Sign in to continue your conversations." : "MAYA checks factual claims against retrieved evidence."}</p>
        <div className="auth-tabs" role="tablist" aria-label="Authentication method">
          <button type="button" className={mode === "login" ? "selected" : ""} onClick={() => switchMode("login")}>Sign in</button>
          <button type="button" className={mode === "signup" ? "selected" : ""} onClick={() => switchMode("signup")}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && !otpStep && <label>Name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>}
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} readOnly={otpStep} required /></label>
          {mode === "signup" && otpStep ? (
            <label>6-digit verification code<input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} required /></label>
          ) : (
            <label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "login" ? 1 : 12} maxLength={72} required /></label>
          )}
          {notice && <p className="auth-notice">{notice}{devOtp && <><br /><strong>Development code: {devOtp}</strong></>}</p>}
          {error && <p className="inline-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : otpStep ? "Verify and create account" : "Continue"}
          </button>
        </form>
        <p className="privacy-note">Your conversations are tied to your account. Verification estimates are not guarantees of truth.</p>
      </section>
      <div className="auth-footer">Don&apos;t just trust AI. Verify it.</div>
    </main>
  );
}

export default function MayaWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadChats = useCallback(async () => {
    const result = await api<Chat[]>("chat/history");
    setChats(result);
  }, []);

  useEffect(() => {
    api<User>("auth/me")
      .then((currentUser) => { setUser(currentUser); return loadChats(); })
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, [loadChats]);

  async function openChat(chat: Chat) {
    setError("");
    setActiveChatId(chat.id);
    setSidebarOpen(false);
    try {
      const saved = await api<Message[]>(`chat/${encodeURIComponent(chat.id)}`);
      setMessages(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this conversation.");
    }
  }

  async function startNewChat() {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setError("");
    setSidebarOpen(false);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  async function deleteChat(chat: Chat, event: React.MouseEvent) {
    event.stopPropagation();
    if (!window.confirm(`Delete “${chat.title || "New chat"}”? This also removes its messages.`)) return;
    try {
      await api(`chat/${encodeURIComponent(chat.id)}`, { method: "DELETE" });
      setChats((items) => items.filter((item) => item.id !== chat.id));
      if (activeChatId === chat.id) { setActiveChatId(null); setMessages([]); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this conversation.");
    }
  }

  async function togglePin(chat: Chat, event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await api(`chat/${encodeURIComponent(chat.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pinned: !chat.pinned }),
      });
      await loadChats();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this conversation.");
    }
  }

  async function logout() {
    try { await api("auth/logout", { method: "POST" }); } catch { /* The local session is cleared either way. */ }
    setUser(null);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt || sending) return;
    setError("");
    setSending(true);
    setInput("");
    const pendingId = `pending-${Date.now()}`;
    const assistantId = `answer-${Date.now()}`;
    setMessages((items) => [
      ...items,
      { id: pendingId, role: "user", content: prompt },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "text/event-stream" },
        body: JSON.stringify({ content: prompt, chat_id: activeChatId }),
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? "MAYA could not answer this message.");
      }
      if (!response.body) throw new Error("The server did not return a response stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamError = "";
      const handleEvent = (raw: string) => {
        const dataLine = raw.split("\n").find((line) => line.startsWith("data: "));
        if (!dataLine) return;
        const event = JSON.parse(dataLine.slice(6));
        if (event.type === "token") {
          setMessages((items) => items.map((item) => item.id === assistantId ? { ...item, content: item.content + event.content } : item));
        } else if (event.type === "verification") {
          setMessages((items) => items.map((item) => item.id === assistantId ? { ...item, hallucination: event.data } : item));
        } else if (event.type === "metadata") {
          setActiveChatId(event.chat_id);
        } else if (event.type === "error") {
          streamError = event.message;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        frames.forEach(handleEvent);
        if (done) break;
      }
      if (buffer.trim()) handleEvent(buffer);
      if (streamError) {
        setMessages((items) => items.map((item) => item.id === assistantId ? { ...item, error: streamError } : item));
      } else {
        await loadChats();
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The response failed.";
      setMessages((items) => items.map((item) => item.id === assistantId ? { ...item, error: message } : item));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function handleAuthenticated(nextUser: User) {
    setUser(nextUser);
    try { await loadChats(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load conversations."); }
  }

  if (checkingSession) return <main className="loading-screen"><BrandMark /><span>Loading MAYA…</span></main>;
  if (!user) return <AuthScreen onAuthenticated={handleAuthenticated} />;

  const filteredChats = chats.filter((chat) => (chat.title || "New chat").toLowerCase().includes(search.toLowerCase()));
  const pinnedChats = filteredChats.filter((chat) => chat.pinned);
  const recentChats = filteredChats.filter((chat) => !chat.pinned);

  return (
    <div className="app-shell" data-theme={theme}>
      {sidebarOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand-lockup" href="#" onClick={(event) => { event.preventDefault(); void startNewChat(); }}>
            <BrandMark /><span>MAYA <small>AI</small></span>
          </a>
          <button className="icon-button sidebar-close" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <button className="new-chat-button" onClick={() => void startNewChat()}><span>＋</span> New chat</button>
        <label className="search-field"><span aria-hidden="true">⌕</span><input placeholder="Search conversations" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <nav className="conversation-nav" aria-label="Conversations">
          {pinnedChats.length > 0 && <div className="nav-section"><div className="nav-section-title">PINNED</div>{pinnedChats.map((chat) => <ChatRow key={chat.id} chat={chat} active={chat.id === activeChatId} onOpen={openChat} onDelete={deleteChat} onPin={togglePin} />)}</div>}
          <div className="nav-section"><div className="nav-section-title">RECENT</div>{recentChats.length > 0 ? recentChats.map((chat) => <ChatRow key={chat.id} chat={chat} active={chat.id === activeChatId} onOpen={openChat} onDelete={deleteChat} onPin={togglePin} />) : <p className="empty-sidebar">{search ? "No matching conversations" : "Your conversations will appear here."}</p>}</div>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-assurance"><span className="assurance-dot" /><span>Evidence checks are estimates, not guarantees.</span></div>
          <div className="user-row"><span className="user-avatar">{(user.name || user.email).slice(0, 1).toUpperCase()}</span><span className="user-identity"><strong>{user.name || "MAYA user"}</strong><small>{user.email}</small></span><button className="icon-button logout-button" title="Sign out" aria-label="Sign out" onClick={() => void logout()}>↗</button></div>
        </div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="topbar-title">{activeChatId ? chats.find((chat) => chat.id === activeChatId)?.title || "Conversation" : "New chat"}<span className="topbar-caption">MAYA · Evidence-aware assistant</span></div>
          <div className="topbar-actions"><span className="availability"><i /> Claim-level checks</span><button className="icon-button theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☼" : "◐"}</button></div>
        </header>

        <div className={`conversation${messages.length === 0 ? " conversation-empty" : ""}`}>
          {messages.length === 0 ? (
            <div className="welcome-panel">
              <div className="welcome-mark"><BrandMark /></div>
              <p className="eyebrow">MAYA AI · ANSWER VERIFICATION</p>
              <h1>Don&apos;t just trust AI.<br /><span>Verify it.</span></h1>
              <p className="welcome-copy">Ask a question. Review the answer claim by claim, with the evidence Maya could find.</p>
              <div className="prompt-suggestions">
                <button onClick={() => setInput("What evidence supports the claim that Python was first released in 1991?")}>Check a factual claim <span>↗</span></button>
                <button onClick={() => setInput("Explain how claim-level verification works and what its limits are.")}>Explore verification <span>↗</span></button>
                <button onClick={() => setInput("Summarize the difference between a contradicted claim and an unverified claim.")}>Understand uncertainty <span>↗</span></button>
              </div>
            </div>
          ) : (
            <div className="message-list" aria-live="polite">
              {messages.map((message) => <MessageView key={message.id} message={message} />)}
              {sending && <div className="working-indicator"><span /><span /><span /> MAYA is preparing an answer and checking its claims…</div>}
              <div className="end-spacer" />
            </div>
          )}
        </div>

        {error && <div className="global-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
        <div className="composer-wrap">
          <form className="composer" onSubmit={(event) => void sendMessage(event)}>
            <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask MAYA anything…" rows={1} maxLength={12000} aria-label="Message MAYA" disabled={sending} />
            <div className="composer-footer"><span>Enter to send · Shift + Enter for a new line</span><button className="send-button" type="submit" disabled={!input.trim() || sending} aria-label="Send message">{sending ? <span className="send-spinner" /> : <span>↑</span>}</button></div>
          </form>
          <p className="disclaimer">MAYA can make mistakes. Review the evidence and treat confidence as an estimate.</p>
        </div>
      </main>
    </div>
  );
}

function ChatRow({ chat, active, onOpen, onDelete, onPin }: {
  chat: Chat;
  active: boolean;
  onOpen: (chat: Chat) => void;
  onDelete: (chat: Chat, event: React.MouseEvent) => void;
  onPin: (chat: Chat, event: React.MouseEvent) => void;
}) {
  return (
    <div className={`chat-row${active ? " chat-row-active" : ""}`}>
      <button className="chat-row-open" onClick={() => void onOpen(chat)} title={chat.title || "New chat"}>{chat.title || "New chat"}</button>
      <button className="chat-row-action" aria-label={chat.pinned ? "Unpin conversation" : "Pin conversation"} title={chat.pinned ? "Unpin" : "Pin"} onClick={(event) => onPin(chat, event)}>{chat.pinned ? "◆" : "◇"}</button>
      <button className="chat-row-action delete-chat" aria-label="Delete conversation" title="Delete" onClick={(event) => onDelete(chat, event)}>×</button>
    </div>
  );
}

function MessageView({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const [showVerification, setShowVerification] = useState(true);
  if (message.role === "user") {
    return <article className="message message-user"><div className="user-message-bubble"><RichText text={message.content} /></div></article>;
  }
  return (
    <article className="message message-assistant">
      <div className="assistant-avatar"><BrandMark small /></div>
      <div className="assistant-message-content">
        <div className="assistant-name">MAYA <span>AI</span></div>
        {message.content ? <RichText text={message.content} /> : !message.error && <div className="assistant-loading"><span /><span /><span /></div>}
        {message.error && <div className="inline-error answer-error" role="alert">{message.error}<small>No verification result was produced for this response.</small></div>}
        {message.content && <div className="message-tools"><button onClick={() => { void navigator.clipboard.writeText(message.content).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1300); }); }}>{copied ? "Copied" : "Copy"}</button>{message.hallucination && <button onClick={() => setShowVerification((value) => !value)}>{showVerification ? "Hide check" : "Show check"}</button>}</div>}
        {message.hallucination && showVerification && <VerificationCard result={message.hallucination} />}
      </div>
    </article>
  );
}
