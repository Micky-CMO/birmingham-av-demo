'use client';

import { useEffect, useRef, useState } from 'react';
import { SUPPORT_CHAT_OPEN_EVENT } from '@/components/editorial/StartChatButton';

// =============================================================================
// SupportWidget — ported from artefact 24 (batch 5).
//
// Floating chat widget that sits bottom-right on every storefront page. The
// shell CSS (.cw-*) lives in globals.css under the
// "Editorial + Legal templates" section. MessageBlock and ReplyBox mirror the
// structure from artefact 17 (return detail); they are scoped to this file
// since they are not reused elsewhere yet.
// =============================================================================

type Message = {
  messageId: string;
  author: 'customer' | 'ai' | 'human';
  authorName: string;
  timestamp: string;
  body: string;
  confidence?: number;
};

function formatDateTime(d: string): string {
  const dt = new Date(d);
  return (
    dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
    ' · ' +
    dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
}

function MessageBlock({ message }: { message: Message }) {
  const m = message;
  const isCustomer = m.author === 'customer';
  const isAI = m.author === 'ai';
  const isHuman = m.author === 'human';

  return (
    <div
      className="grid gap-6 border-t border-ink-10 py-6"
      style={{ gridTemplateColumns: '180px 1fr' }}
    >
      <div>
        <div
          className="mb-1.5 font-mono uppercase text-ink-60"
          style={{ fontSize: 11, letterSpacing: '0.14em' }}
        >
          {isCustomer && '— You'}
          {isAI && '— Triage'}
          {isHuman && '— Staff'}
        </div>
        <div className="mb-1 text-ink" style={{ fontSize: 13 }}>
          {m.authorName}
        </div>
        <div className="font-mono text-ink-60" style={{ fontSize: 11 }}>
          {formatDateTime(m.timestamp)}
        </div>
      </div>
      <div>
        <p
          className="m-0 text-ink"
          style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 560 }}
        >
          {m.body}
        </p>
        {isAI && typeof m.confidence === 'number' && (
          <div
            className="mt-3.5 font-mono uppercase text-ink-60"
            style={{ fontSize: 11, letterSpacing: '0.14em' }}
          >
            Confidence {(m.confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyBox({ onSend }: { onSend: (body: string) => void }) {
  const [val, setVal] = useState('');
  const trimmed = val.trim();
  return (
    <div>
      <div className="bav-label mb-3 text-ink-60">— Reply</div>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Anything else we should know?"
        rows={5}
        className="bav-field w-full resize-y border border-ink-10 bg-transparent font-sans text-ink"
        style={{
          padding: '18px 20px',
          fontSize: 14,
          lineHeight: 1.6,
          outline: 'none',
        }}
      />
      <div className="mt-3 flex justify-end">
        <button
          disabled={trimmed.length === 0}
          className="bav-cta-secondary"
          onClick={() => {
            if (trimmed.length === 0) return;
            onSend(trimmed);
            setVal('');
          }}
          style={{
            width: 'auto',
            padding: '14px 32px',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            opacity: trimmed.length === 0 ? 0.4 : 1,
            cursor: trimmed.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Send reply
        </button>
      </div>
    </div>
  );
}

const INITIAL_MESSAGES: Message[] = [
  {
    messageId: 'm1',
    author: 'ai',
    authorName: 'BAV specialist',
    timestamp: '2026-04-19T10:14:00Z',
    body:
      "Hello. I'm the BAV PC specialist — I can help with hardware recommendations, Windows + Linux support, error codes, refurbishment process, returns, AV Care, and anything else about the shop. What are you trying to figure out?",
  },
];

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [escalated, setEscalated] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll to bottom on new messages / typing change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  // External open trigger — fired from any "Start a chat" CTA.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(SUPPORT_CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(SUPPORT_CHAT_OPEN_EVENT, handler);
  }, []);

  const handleSend = async (body: string) => {
    const userMessageId = 'm' + (messages.length + 1);
    const aiMessageId = 'm' + (messages.length + 2);
    const now = new Date().toISOString();

    // Append user message immediately, stage empty AI message we'll stream into.
    const userMsg: Message = {
      messageId: userMessageId,
      author: 'customer',
      authorName: 'You',
      timestamp: now,
      body,
    };
    const aiMsg: Message = {
      messageId: aiMessageId,
      author: 'ai',
      authorName: 'BAV specialist',
      timestamp: now,
      body: '',
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setTyping(true);

    // Build history from prior exchanges (skip the welcome seed + current stage).
    const history = messages
      .filter((m) => m.author === 'customer' || m.author === 'ai')
      .slice(1)
      .map((m) => ({
        role: m.author === 'customer' ? 'user' : 'assistant',
        content: m.body,
      }));

    try {
      const res = await fetch('/api/chat/specialist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: body, history }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let streamed = '';
      let lastError: string | null = null;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() ?? '';
        for (const e of events) {
          const eventLine = e.match(/^event:\s*(.+)$/m)?.[1]?.trim();
          const dataLine = e.match(/^data:\s*(.+)$/m)?.[1]?.trim();
          if (!eventLine || !dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine);
            if (eventLine === 'token' && typeof parsed.text === 'string') {
              streamed += parsed.text;
              setMessages((prev) =>
                prev.map((m) => (m.messageId === aiMessageId ? { ...m, body: streamed } : m)),
              );
            } else if (eventLine === 'error') {
              lastError = parsed.message ?? 'specialist error';
            }
          } catch {
            // skip malformed event
          }
        }
      }

      if (lastError && !streamed) {
        // Upstream couldn't answer — fall back to human handoff UI.
        setMessages((prev) =>
          prev.map((m) =>
            m.messageId === aiMessageId
              ? {
                  ...m,
                  body:
                    "I couldn't reach the specialist just now. A member of the team will pick this up shortly — you don't need to do anything.",
                  authorName: 'BAV specialist',
                }
              : m,
          ),
        );
        setEscalated(true);
      } else if (!streamed) {
        setMessages((prev) =>
          prev.map((m) =>
            m.messageId === aiMessageId
              ? { ...m, body: '…that one stumped me. Escalating to a human now.' }
              : m,
          ),
        );
        setEscalated(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'network error';
      console.warn('[support] chat failed', msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === aiMessageId
            ? {
                ...m,
                body:
                  "I'm having trouble reaching my systems. A team member will join this thread shortly — no action needed on your side.",
              }
            : m,
        ),
      );
      setEscalated(true);
    } finally {
      setTyping(false);
    }
  };

  if (!open) {
    return (
      <button
        className="cw-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open support chat"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="square"
        >
          <path d="M4 5 L20 5 L20 17 L12 17 L7 21 L7 17 L4 17 Z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="cw-panel" role="dialog" aria-label="Support chat">
      {/* Header */}
      <div className="cw-header">
        <div>
          <div
            className="font-display font-light"
            style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.01em' }}
          >
            Support <span className="bav-italic">chat</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2.5">
            <span className="bav-pulse" aria-hidden="true" />
            <span
              className="font-mono uppercase text-ink-60"
              style={{ fontSize: 11, letterSpacing: '0.14em' }}
            >
              Open · replies within minutes
            </span>
          </div>
        </div>
        <button
          className="cw-close"
          onClick={() => setOpen(false)}
          aria-label="Close support chat"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="square"
          >
            <path d="M6 9 L12 15 L18 9" />
          </svg>
        </button>
      </div>

      {/* Escalation banner */}
      {escalated && (
        <div className="cw-esc-banner">
          <div className="bav-label mb-1.5 text-ink-60">
            — Escalated to a human
          </div>
          <p
            className="m-0 font-sans text-ink"
            style={{ fontSize: 13, lineHeight: 1.55 }}
          >
            A team member will join this thread shortly. The triage assistant
            stays on in case it can help in the meantime.
          </p>
        </div>
      )}

      {/* Thread */}
      <div className="cw-thread" ref={scrollRef}>
        {messages.map((m) => (
          <MessageBlock key={m.messageId} message={m} />
        ))}

        {typing && (
          <div className="cw-typing">
            <div>
              <div
                className="mb-1.5 font-mono uppercase text-ink-60"
                style={{ fontSize: 11, letterSpacing: '0.14em' }}
              >
                — Staff
              </div>
              <div className="text-ink-30" style={{ fontSize: 13 }}>
                Joining now…
              </div>
            </div>
            <div style={{ paddingTop: 2 }}>
              <span className="dots" aria-label="Typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Reply */}
      <div className="cw-reply">
        <ReplyBox onSend={handleSend} />
      </div>
    </div>
  );
}

export default SupportWidget;
