import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpSearch } from '@/components/editorial/HelpSearch';

export const metadata: Metadata = {
  title: 'Help centre',
  description:
    'Answers to the things most people write in about. If nothing here resolves it, the chat widget is routed to a human within working hours.',
};

// Demo data — replaced by CMS in production.
const data = {
  categories: [
    {
      slug: 'orders-delivery',
      name: 'Orders & delivery',
      articleCount: 14,
      intro:
        'Tracking, timings, missed parcels, and what happens between your order and your doorstep.',
    },
    {
      slug: 'returns-refunds',
      name: 'Returns & refunds',
      articleCount: 9,
      intro:
        'How to start a return, refund windows, restocking fees, and faulty unit procedure.',
    },
    {
      slug: 'warranty-repairs',
      name: 'Warranty & repairs',
      articleCount: 11,
      intro: 'What\u2019s covered, how to claim, AV Care excess, and loan units.',
    },
    {
      slug: 'av-care',
      name: 'AV Care subscription',
      articleCount: 8,
      intro: 'Tiers, pricing, registering your products, claims, cancelling.',
    },
    {
      slug: 'build-specs',
      name: 'Builds & specifications',
      articleCount: 17,
      intro:
        'Custom configurations, upgrade paths, part compatibility, serial numbers.',
    },
    {
      slug: 'account-security',
      name: 'Account & security',
      articleCount: 10,
      intro: 'Passkeys, two-factor, email changes, closing your account.',
    },
    {
      slug: 'payments-billing',
      name: 'Payments & billing',
      articleCount: 7,
      intro: 'Cards, PayPal, Klarna, Clearpay, invoice terms, VAT receipts.',
    },
    {
      slug: 'business-trade',
      name: 'Business & trade',
      articleCount: 6,
      intro: 'Purchase orders, net-30 terms, bulk quotes, procurement contacts.',
    },
  ],
  popular: [
    {
      slug: 'how-long-does-a-custom-build-take',
      title: 'How long does a custom build take?',
      category: 'Builds & specifications',
      reads: 12840,
    },
    {
      slug: 'what-does-av-care-actually-cover',
      title: 'What does AV Care actually cover?',
      category: 'AV Care subscription',
      reads: 9421,
    },
    {
      slug: 'where-is-my-order',
      title: 'Where is my order?',
      category: 'Orders & delivery',
      reads: 8903,
    },
    {
      slug: 'start-a-return',
      title: 'Start a return',
      category: 'Returns & refunds',
      reads: 7712,
    },
    {
      slug: 'register-a-product-for-av-care',
      title: 'Register a product for AV Care',
      category: 'AV Care subscription',
      reads: 6480,
    },
    {
      slug: 'enrol-a-passkey',
      title: 'Enrol a passkey on your account',
      category: 'Account & security',
      reads: 5219,
    },
  ],
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* ---- hero ---- */}
      <section className="bav-fade mx-auto max-w-page px-12 pb-[72px] pt-32">
        <div className="grid gap-12" style={{ gridTemplateColumns: '4fr 8fr' }}>
          <div>
            <div className="bav-label text-ink-60">— Help centre</div>
            <div className="bav-label mt-3.5 text-ink-30">97 articles</div>
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
              How can we <span className="bav-italic">help</span>.
            </h1>
            <p
              className="mt-7 text-ink-60"
              style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 560 }}
            >
              Answers to the things most people write in about. If nothing here
              resolves it, the chat widget is routed to a human within working
              hours, and to AV Care triage overnight.
            </p>

            {/* search */}
            <HelpSearch />
          </div>
        </div>
      </section>

      {/* ---- category grid ---- */}
      <section className="mx-auto max-w-page px-12 pb-[72px]">
        <div
          className="mb-8 grid gap-12"
          style={{ gridTemplateColumns: '4fr 8fr' }}
        >
          <div className="bav-label text-ink-60">— Browse by subject</div>
          <div />
        </div>

        <div className="help-grid">
          {data.categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/help/${cat.slug}`}
              className="help-cat-tile"
            >
              <div className="flex items-baseline justify-between">
                <span className="bav-label text-ink-30">
                  №{String(i + 1).padStart(2, '0')}
                </span>
                <span className="bav-label font-mono text-ink-30">
                  {cat.articleCount} articles
                </span>
              </div>
              <h3
                className="font-display font-light text-ink"
                style={{
                  fontSize: 28,
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                  marginTop: 48,
                  marginBottom: 16,
                }}
              >
                {cat.name}
              </h3>
              <p
                className="m-0 text-ink-60"
                style={{ fontSize: 14, lineHeight: 1.55, minHeight: 66 }}
              >
                {cat.intro}
              </p>
              <div className="mt-8">
                <span className="bav-underline bav-label text-ink">
                  Read articles <span className="arrow">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- popular ---- */}
      <section className="mx-auto max-w-page px-12 py-[72px]">
        <div className="grid gap-12" style={{ gridTemplateColumns: '4fr 8fr' }}>
          <div>
            <div className="bav-label text-ink-60">— Most read</div>
            <p
              className="mt-6 text-ink-60"
              style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 260 }}
            >
              Read counts are rolling 90-day, updated nightly. Useful as a rough
              signal of where people are looking; not a substitute for asking us
              directly.
            </p>
          </div>

          <div>
            {data.popular.map((art, i) => (
              <Link
                key={art.slug}
                href={`/help/${art.slug}`}
                className="help-popular-row"
              >
                <span className="bav-label font-mono text-ink-30">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="font-display font-light text-ink"
                  style={{ fontSize: 22, lineHeight: 1.2 }}
                >
                  {art.title}
                </span>
                <span className="bav-label cat text-ink-60">{art.category}</span>
                <span className="bav-label reads text-right font-mono text-ink-30">
                  {art.reads.toLocaleString('en-GB')} reads
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- contact strip ---- */}
      <section className="mt-[72px] border-t border-ink-10 bg-paper-2">
        <div
          className="mx-auto grid max-w-page gap-12 px-12 py-24"
          style={{ gridTemplateColumns: '4fr 8fr' }}
        >
          <div>
            <div className="bav-label text-ink-60">— Still stuck</div>
            <div className="mt-6 inline-flex items-center gap-2.5">
              <span className="bav-pulse" />
              <span className="bav-label text-ink-60">Chat is online</span>
            </div>
          </div>

          <div>
            <h2
              className="m-0 font-display font-light text-ink"
              style={{
                fontSize: 'clamp(36px, 4.5vw, 64px)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              Write to us <span className="bav-italic">directly</span>.
            </h2>
            <p
              className="mt-6 text-ink-60"
              style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 620 }}
            >
              The chat widget routes first to our AI agent, which resolves most
              order, returns, and spec questions on its own. Anything it
              can&rsquo;t handle escalates to the support team, with your
              message and the context already attached. Median response time to
              a human is 7 minutes during working hours.
            </p>

            <div
              className="mt-12 grid border-l border-t border-ink-10"
              style={{ gridTemplateColumns: '1fr 1fr' }}
            >
              <Link
                href="/support"
                className="block border-b border-r border-ink-10 text-inherit no-underline"
                style={{ padding: '36px 32px' }}
              >
                <div className="bav-label text-ink-30">Start a chat</div>
                <div
                  className="mt-5 font-display font-light text-ink"
                  style={{ fontSize: 22 }}
                >
                  Chat with support
                </div>
                <div
                  className="mt-3 font-mono text-ink-60"
                  style={{ fontSize: 12 }}
                >
                  Mon–Fri · 08:00–18:00 GMT
                </div>
              </Link>
              <a
                href="mailto:hello@birminghamav.co.uk"
                className="block border-b border-r border-ink-10 text-inherit no-underline"
                style={{ padding: '36px 32px' }}
              >
                <div className="bav-label text-ink-30">Email</div>
                <div
                  className="mt-5 font-display font-light text-ink"
                  style={{ fontSize: 22 }}
                >
                  hello@birminghamav.co.uk
                </div>
                <div
                  className="mt-3 font-mono text-ink-60"
                  style={{ fontSize: 12 }}
                >
                  Replies within 24 hours
                </div>
              </a>
              <a
                href="tel:+441214960000"
                className="block border-b border-r border-ink-10 text-inherit no-underline"
                style={{ padding: '36px 32px' }}
              >
                <div className="bav-label text-ink-30">Phone</div>
                <div
                  className="mt-5 font-mono font-light text-ink"
                  style={{ fontSize: 22 }}
                >
                  0121 496 0000
                </div>
                <div
                  className="mt-3 font-mono text-ink-60"
                  style={{ fontSize: 12 }}
                >
                  Mon–Fri · 09:00–17:00 GMT
                </div>
              </a>
              <Link
                href="/contact"
                className="block border-b border-r border-ink-10 text-inherit no-underline"
                style={{ padding: '36px 32px' }}
              >
                <div className="bav-label text-ink-30">In writing</div>
                <div
                  className="mt-5 font-display font-light text-ink"
                  style={{ fontSize: 22 }}
                >
                  Post & addresses
                </div>
                <div
                  className="mt-3 font-mono text-ink-60"
                  style={{ fontSize: 12 }}
                >
                  Birmingham B16 · returns & trade
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
