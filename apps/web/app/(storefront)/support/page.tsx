import type { Metadata } from 'next';
import Link from 'next/link';
import { StartChatButton } from '@/components/editorial/StartChatButton';
import { SupportContactForm } from '@/components/editorial/SupportContactForm';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Every ticket is read. Chat is the fastest channel; it routes first to our AI agent and escalates anything it can\u2019t handle to a human, with the context already attached.',
};

const data = {
  channels: [
    {
      key: 'chat',
      label: 'Chat',
      heading: 'Chat with support',
      meta: 'Median human reply in 7 minutes',
      hours: 'Mon–Fri · 08:00–18:00 GMT',
      status: 'online',
    },
    {
      key: 'email',
      label: 'Email',
      heading: 'hello@birminghamav.co.uk',
      meta: 'Replies within 24 hours',
      hours: 'Ticket-tracked, routed to the right team',
    },
    {
      key: 'phone',
      label: 'Phone',
      heading: '0121 496 0000',
      meta: 'Orders, trade, and urgent issues',
      hours: 'Mon–Fri · 09:00–17:00 GMT',
    },
  ],
  commonIssues: [
    { slug: 'where-is-my-order', label: 'Where is my order?', cat: 'Orders & delivery' },
    { slug: 'start-a-return', label: 'Start a return', cat: 'Returns & refunds' },
    {
      slug: 'change-my-delivery-address',
      label: 'Change a delivery address',
      cat: 'Orders & delivery',
    },
    { slug: 'cancel-an-order', label: 'Cancel an order', cat: 'Orders & delivery' },
    {
      slug: 'register-a-product-for-av-care',
      label: 'Register a product for AV Care',
      cat: 'AV Care',
    },
    {
      slug: 'what-does-av-care-cover',
      label: 'What does AV Care cover?',
      cat: 'AV Care',
    },
    { slug: 'enrol-a-passkey', label: 'Enrol a passkey', cat: 'Account & security' },
    { slug: 'vat-receipt', label: 'Get a VAT receipt', cat: 'Payments & billing' },
  ],
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* ---- hero ---- */}
      <section className="bav-fade mx-auto max-w-page px-12 pb-[72px] pt-32">
        <div className="grid gap-12" style={{ gridTemplateColumns: '4fr 8fr' }}>
          <div>
            <div className="bav-label text-ink-60">— Support</div>
            <div className="mt-5 inline-flex items-center gap-2.5">
              <span className="bav-pulse" />
              <span className="bav-label text-ink-60">Chat is online</span>
            </div>
          </div>
          <div>
            <h1
              className="m-0 font-display font-light text-ink"
              style={{
                fontSize: 'clamp(44px, 6vw, 88px)',
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
              }}
            >
              Support, <span className="bav-italic">directly</span>.
            </h1>
            <p
              className="mt-8 text-ink-60"
              style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 640 }}
            >
              Every ticket is read. Chat is our fastest channel; it routes first
              to our AI agent, which handles the majority of order, returns, and
              spec questions, and escalates the rest to a person with the
              context already attached. Nothing disappears into a queue.
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              <StartChatButton>Start a chat</StartChatButton>
              <Link
                href="/help"
                className="bav-cta-secondary no-underline"
                style={{ width: 'auto' }}
              >
                Browse help articles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---- channels ---- */}
      <section className="mx-auto max-w-page px-12 py-[72px]">
        <div className="bav-label mb-12 text-ink-60">— Channels</div>
        <div
          className="grid border-l border-t border-ink-10"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {data.channels.map((ch, i) => (
            <div
              key={ch.key}
              className="border-b border-r border-ink-10"
              style={{ padding: '48px 40px' }}
            >
              <div className="flex items-center justify-between">
                <span className="bav-label text-ink-30">
                  №{String(i + 1).padStart(2, '0')} · {ch.label}
                </span>
                {ch.status === 'online' && (
                  <span className="inline-flex items-center gap-2">
                    <span className="bav-pulse" />
                    <span className="bav-label text-ink-60">Online</span>
                  </span>
                )}
              </div>
              <h3
                className={`font-display font-light text-ink ${
                  ch.key === 'phone' ? 'font-mono' : ''
                }`}
                style={{
                  fontSize: 26,
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                  marginTop: 40,
                  marginBottom: 12,
                }}
              >
                {ch.heading}
              </h3>
              <p
                className="m-0 text-ink-60"
                style={{ fontSize: 14, lineHeight: 1.55 }}
              >
                {ch.meta}
              </p>
              <p
                className="font-mono uppercase text-ink-30"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  margin: '24px 0 0',
                }}
              >
                {ch.hours}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- common issues ---- */}
      <section className="mx-auto max-w-page px-12 py-[72px]">
        <div className="grid gap-12" style={{ gridTemplateColumns: '4fr 8fr' }}>
          <div>
            <div className="bav-label text-ink-60">— Common issues</div>
            <p
              className="mt-6 text-ink-60"
              style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 260 }}
            >
              The most frequent questions the support team answers, linked to
              the article that resolves them. If yours isn&rsquo;t here, write
              to us.
            </p>
          </div>
          <div>
            {data.commonIssues.map((issue) => (
              <Link
                key={issue.slug}
                href={`/help/${issue.slug}`}
                className="support-issue-tile"
              >
                <div>
                  <span
                    className="font-display font-light text-ink"
                    style={{ fontSize: 22, lineHeight: 1.25 }}
                  >
                    {issue.label}
                  </span>
                  <div className="bav-label mt-2 text-ink-30">{issue.cat}</div>
                </div>
                <span className="bav-label text-ink">Read →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- contact form ---- */}
      <section className="mt-24 border-t border-ink-10 bg-paper-2">
        <div
          className="mx-auto grid max-w-page px-12 py-24"
          style={{ gridTemplateColumns: '4fr 8fr', gap: 96 }}
        >
          <div>
            <div className="bav-label text-ink-60">— Write to us</div>
            <p
              className="mt-6 text-ink-60"
              style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 280 }}
            >
              For anything that doesn&rsquo;t need a chat. Goes to the same
              inbox as hello@birminghamav.co.uk; include an order number if you
              have one and we&rsquo;ll pull it up.
            </p>
          </div>

          <div>
            <SupportContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
