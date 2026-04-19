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
    authorName: 'Triage · assistant',
    timestamp: '2026-04-19T10:14:00Z',
    body:
      "Hello. I'm the triage assistant. Tell me what's happening and I'll either answer or hand you to a colleague. If you have an order number to hand, it speeds things up.",
    confidence: 0.92,
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

  const handleSend = (body: string) => {
    setMessages((prev) => [
      ...prev,
      {
        messageId: 'm' + (prev.length + 1),
        author: 'customer',
        authorName: 'You',
        timestamp: new Date().toISOString(),
        body,
      },
    ]);
    // Demo escalation flow: after the first customer message, show an
    // escalation banner and have a member of staff join ~3.5s later.
    setTyping(true);
    setEscalated(true);
  };

  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          messageId: 'm' + (prev.length + 1),
          author: 'human',
          authorName: 'Leila · support',
          timestamp: new Date().toISOString(),
          body:
            "Hi, Leila here. I've picked this up from the triage assistant. Give me a few minutes to check and I'll be back with an answer or a next step.",
        },
      ]);
      setTyping(false);
    }, 3500);
    return () => clearTimeout(t);
  }, [typing]);

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
