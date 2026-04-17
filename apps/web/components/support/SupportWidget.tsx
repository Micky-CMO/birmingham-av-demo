'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Button, GlassCard, Input } from '@/components/ui';
import { cn } from '@/lib/cn';

type Message = { id: string; role: 'user' | 'assistant' | 'system'; body: string };

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      body: 'Hello. I can help with orders, specs, returns, and shipping. How can I help today?',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const ticketId = useRef<string | null>(null);

  async function send() {
    if (!draft.trim() || sending) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', body: draft.trim() };
    setMessages((m) => [...m, userMsg]);
    setDraft('');
    setSending(true);
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticketId.current ?? undefined, body: userMsg.body }),
      });
      const data = (await res.json()) as {
        ticketId?: string;
        reply?: string;
        escalated?: boolean;
        error?: { message: string };
      };
      if (data.ticketId) ticketId.current = data.ticketId;
      if (data.reply) setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', body: data.reply! }]);
      if (data.escalated)
        setMessages((m) => [
          ...m,
          { id: `s-${Date.now()}`, role: 'system', body: 'Escalated to our team. Someone will reply here shortly.' },
        ]);
      if (data.error)
        setMessages((m) => [...m, { id: `s-${Date.now()}`, role: 'system', body: `Chat is offline (${data.error!.message})` }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: `s-${Date.now()}`, role: 'system', body: 'Network error. Try again in a moment.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open support chat"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-ring-green hover:bg-brand-green-600"
      >
        <ChatIcon />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-5 z-40 w-[360px] max-w-[calc(100vw-2.5rem)]"
          >
            <GlassCard className="flex h-[520px] flex-col overflow-hidden">
              <header className="flex items-center justify-between border-b border-ink-300/60 px-4 py-3 dark:border-obsidian-500/60">
                <div>
                  <div className="text-small font-medium">Birmingham AV support</div>
                  <div className="text-caption text-ink-500">AI + humans, any time.</div>
                </div>
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                  className="text-ink-500 hover:text-ink-900 dark:hover:text-ink-50"
                >
                  &times;
                </button>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-small',
                      m.role === 'user' && 'ml-auto bg-brand-green text-white',
                      m.role === 'assistant' && 'bg-ink-100 text-ink-900 dark:bg-obsidian-800 dark:text-ink-50',
                      m.role === 'system' && 'mx-auto text-center text-caption text-ink-500',
                    )}
                  >
                    {m.body}
                  </div>
                ))}
                {sending && <div className="ml-1 text-caption text-ink-500">AI is typing...</div>}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
                className="flex gap-2 border-t border-ink-300/60 p-3 dark:border-obsidian-500/60"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask about anything"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !draft.trim()}>
                  Send
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a8 8 0 1 1-3-6.2L21 4l-1 4.5A8 8 0 0 1 21 12Z" strokeLinejoin="round" />
    </svg>
  );
}
