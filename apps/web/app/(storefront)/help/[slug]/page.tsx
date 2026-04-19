import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HelpArticleFeedback } from '@/components/editorial/HelpArticleFeedback';

// =============================================================================
// Help article page.
//
// This uses a static ARTICLES map for now so we can render the same editorial
// shell Claude Web designed in artefact 28. Real articles come from a CMS
// later; when they do, swap ARTICLES for a fetch in this file and keep the
// block schema + the component tree untouched.
// =============================================================================

type ArticleBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; id: string; text: string }
  | { kind: 'list'; items: [string, string][] }
  | { kind: 'pullquote'; text: string }
  | { kind: 'callout'; title: string; body: string };

type RelatedArticle = {
  slug: string;
  title: string;
  category: string;
};

type Article = {
  title: string;
  dek?: string;
  headlinePlain: string;
  headlineItalic: string;
  category: { slug: string; name: string };
  lastUpdatedIso: string;
  readMinutes: number;
  body: ArticleBlock[];
  related: RelatedArticle[];
};

const ARTICLES: Record<string, Article> = {
  'how-long-does-a-custom-build-take': {
    title: 'How long does a custom build take?',
    headlinePlain: 'How long does a custom build',
    headlineItalic: 'take',
    category: { slug: 'build-specs', name: 'Builds & specifications' },
    lastUpdatedIso: '2026-03-14T10:14:00Z',
    readMinutes: 4,
    body: [
      {
        kind: 'p',
        text:
          'Typical turnaround from confirmed order to dispatch is four to seven working days. Two of those are the build itself; the rest is component staging, thermal testing, and QC. Rush slots are occasionally available; ask in chat before placing the order.',
      },
      {
        kind: 'h2',
        id: 'what-happens-in-order',
        text: 'What happens, in order',
      },
      {
        kind: 'list',
        items: [
          [
            'Order lands',
            'Payment clears and the order is assigned a build number. You receive a confirmation email with the assigned builder.',
          ],
          [
            'Parts staged',
            'Components are pulled from stock and cross-checked against the spec sheet. Any substitution is flagged to you before assembly begins.',
          ],
          [
            'Build',
            'One builder, one unit, from first screw to boot. Typically one working day for a standard tower; two for water-cooled or chassis-modified builds.',
          ],
          [
            'Stress test',
            'Twenty-four hours on the bench running Prime95, OCCT, and 3DMark loops. Thermals and clocks logged.',
          ],
          [
            'QC',
            'Second pair of eyes: visible cable runs, screw torque, seating, BIOS version, Windows activation, benchmark spot-check.',
          ],
          [
            'Pack & dispatch',
            'Foam-cut double-boxing, corners padded. Dispatched by DPD next-day on a signed-for service.',
          ],
        ],
      },
      { kind: 'h2', id: 'why-not-faster', text: 'Why not faster' },
      {
        kind: 'p',
        text:
          'The bottleneck is the twenty-four hour soak test. We could skip it; most shops do. It catches roughly one fault per forty units, almost always thermal paste application or a marginal memory kit. Catching it before the unit leaves the workshop is the point of building the machine in the first place.',
      },
      {
        kind: 'pullquote',
        text:
          'Two of those days are the build itself; the rest is what stops you being the one to find the fault.',
      },
      { kind: 'h2', id: 'tracking', text: 'Tracking your build' },
      {
        kind: 'p',
        text:
          'Every order has a live status at /account/orders/[number]. The stages are Queued, In build, QC, Shipped, and Delivered; each is timestamped. When a builder is assigned, their name and builder code appear on the order detail. You can message them directly through the same screen.',
      },
      { kind: 'h2', id: 'exceptions', text: 'Exceptions' },
      {
        kind: 'p',
        text:
          'A handful of situations stretch the timeline. If a GPU is on allocation from the distributor, the order waits on stock; we will tell you within one working day of placing the order. If you requested a custom cable set or a chassis we do not stock, allow an extra five to seven working days. Water loops with hard tubing are booked into a separate bench and run to a longer schedule; expect fourteen working days from order to dispatch.',
      },
      {
        kind: 'callout',
        title: 'Need it sooner?',
        body:
          'Ask in chat before you place the order. We keep one or two same-week slots open for bookings that can match our current stock; if the build is standard and parts are available, same-week dispatch is often achievable.',
      },
    ],
    related: [
      { slug: 'where-is-my-order', title: 'Where is my order?', category: 'Orders & delivery' },
      { slug: 'start-a-return', title: 'Start a return', category: 'Returns & refunds' },
      {
        slug: 'register-a-product-for-av-care',
        title: 'Register a product for AV Care',
        category: 'AV Care subscription',
      },
      {
        slug: 'request-a-rush-slot',
        title: 'Request a rush build slot',
        category: 'Builds & specifications',
      },
    ],
  },
  'where-is-my-order': {
    title: 'Where is my order?',
    headlinePlain: 'Where is my',
    headlineItalic: 'order',
    category: { slug: 'orders-delivery', name: 'Orders & delivery' },
    lastUpdatedIso: '2026-02-02T10:00:00Z',
    readMinutes: 3,
    body: [
      {
        kind: 'p',
        text:
          'Every order page shows the live stage of your build and, once dispatched, the DPD tracking number. If the carrier scan hasn\u2019t updated in 24 hours, open chat with the order number and we\u2019ll open a trace.',
      },
      { kind: 'h2', id: 'stages', text: 'Order stages, in order' },
      {
        kind: 'list',
        items: [
          ['Queued', 'Payment cleared; awaiting a bench and a builder.'],
          ['In build', 'Your named builder is on it.'],
          ['QC', 'Second-pair-of-eyes review and soak-test log check.'],
          ['Shipped', 'Tracking number live on the order page.'],
          ['Delivered', 'Signed for at your address.'],
        ],
      },
    ],
    related: [
      {
        slug: 'how-long-does-a-custom-build-take',
        title: 'How long does a custom build take?',
        category: 'Builds & specifications',
      },
      {
        slug: 'change-my-delivery-address',
        title: 'Change a delivery address',
        category: 'Orders & delivery',
      },
      {
        slug: 'cancel-an-order',
        title: 'Cancel an order',
        category: 'Orders & delivery',
      },
    ],
  },
  'start-a-return': {
    title: 'Start a return',
    headlinePlain: 'Start a',
    headlineItalic: 'return',
    category: { slug: 'returns-refunds', name: 'Returns & refunds' },
    lastUpdatedIso: '2026-03-01T10:00:00Z',
    readMinutes: 3,
    body: [
      {
        kind: 'p',
        text:
          'Returns are opened from /account/returns against the specific order line. Standard orders are returnable within thirty days under the Consumer Contracts Regulations; custom builds are excluded once component staging has begun, except where the unit is faulty.',
      },
      { kind: 'h2', id: 'how', text: 'How it works' },
      {
        kind: 'list',
        items: [
          [
            'Open the return',
            'Go to /account/returns, pick the order, tell us the reason. The more specific, the faster we can triage.',
          ],
          [
            'Print the label',
            'We generate a pre-paid DPD label if the return qualifies, or a collection if the unit is heavy.',
          ],
          [
            'Box it up',
            'Original packaging where possible. Faulty units get a loan unit if AV Care is active.',
          ],
          [
            'Refund or replacement',
            'Refunds land within three working days of the return clearing the bench. Replacements join the build queue with priority.',
          ],
        ],
      },
    ],
    related: [
      {
        slug: 'what-does-av-care-actually-cover',
        title: 'What does AV Care actually cover?',
        category: 'AV Care subscription',
      },
      {
        slug: 'where-is-my-order',
        title: 'Where is my order?',
        category: 'Orders & delivery',
      },
    ],
  },
  'what-does-av-care-actually-cover': {
    title: 'What does AV Care actually cover?',
    headlinePlain: 'What does AV Care actually',
    headlineItalic: 'cover',
    category: { slug: 'av-care', name: 'AV Care subscription' },
    lastUpdatedIso: '2026-01-20T10:00:00Z',
    readMinutes: 5,
    body: [
      {
        kind: 'p',
        text:
          'AV Care is a monthly subscription that extends and broadens the standard twelve-month warranty. It is not insurance; it is a maintenance contract, and the line between the two matters.',
      },
      { kind: 'h2', id: 'included', text: 'What\u2019s included' },
      {
        kind: 'list',
        items: [
          [
            'Extended warranty',
            'Parts and labour cover beyond the standard year, for as long as the subscription is active.',
          ],
          [
            'Priority queue',
            'Repairs and replacement dispatches jump the standard queue.',
          ],
          [
            'Loan unit',
            'A loan machine shipped within one working day of a qualifying fault being accepted.',
          ],
          [
            'Annual service',
            'Dust-out, paste refresh, fan check, and BIOS update. You post it in; we cover both ways.',
          ],
        ],
      },
      { kind: 'h2', id: 'excluded', text: 'What\u2019s not included' },
      {
        kind: 'p',
        text:
          'Physical damage, liquid damage, third-party modifications, and consumables. Accidental damage has its own add-on tier with a per-claim excess documented on /warranty.',
      },
    ],
    related: [
      {
        slug: 'register-a-product-for-av-care',
        title: 'Register a product for AV Care',
        category: 'AV Care subscription',
      },
      {
        slug: 'start-a-return',
        title: 'Start a return',
        category: 'Returns & refunds',
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = ARTICLES[params.slug];
  if (!article) return { title: 'Help article not found' };
  return {
    title: article.title,
    description: article.dek ?? article.title,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function HelpArticlePage({ params }: { params: { slug: string } }) {
  const article = ARTICLES[params.slug];
  if (!article) notFound();

  const toc = article.body
    .filter((b): b is Extract<ArticleBlock, { kind: 'h2' }> => b.kind === 'h2')
    .map((b) => ({ id: b.id, label: b.text }));

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* breadcrumb */}
      <nav className="mx-auto flex max-w-page items-center gap-3.5 px-12 pt-12">
        <Link
          href="/help"
          className="bav-label bav-hover-opa text-ink-60 no-underline"
        >
          Help
        </Link>
        <span className="bav-label text-ink-30">/</span>
        <Link
          href={`/help/${article.category.slug}`}
          className="bav-label bav-hover-opa text-ink-60 no-underline"
        >
          {article.category.name}
        </Link>
        <span className="bav-label text-ink-30">/</span>
        <span className="bav-label text-ink">Article</span>
      </nav>

      {/* title block */}
      <header className="bav-fade mx-auto max-w-page px-12 pb-24 pt-[72px]">
        <div
          className="grid items-end"
          style={{ gridTemplateColumns: '4fr 8fr', gap: 96 }}
        >
          <div>
            <div className="bav-label text-ink-60">— {article.category.name}</div>
            <div className="mt-3.5 flex flex-col gap-1.5">
              <span className="bav-label font-mono text-ink-30">
                Updated {formatDate(article.lastUpdatedIso)}
              </span>
              <span className="bav-label font-mono text-ink-30">
                {article.readMinutes} min read
              </span>
            </div>
          </div>
          <div>
            <h1
              className="m-0 font-display font-light text-ink"
              style={{
                fontSize: 'clamp(40px, 5.5vw, 72px)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              {article.headlinePlain}{' '}
              <span className="bav-italic">{article.headlineItalic}</span>.
            </h1>
          </div>
        </div>
      </header>

      {/* body + toc */}
      <main className="mx-auto max-w-page px-12 pb-24">
        <div className="help-article-grid">
          {/* left sticky rail */}
          <aside>
            <div className="help-toc-rail">
              <div className="bav-label mb-3.5 text-ink-60">— In this article</div>
              <nav>
                {toc.map((t) => (
                  <a key={t.id} href={`#${t.id}`} className="help-toc-link">
                    {t.label}
                  </a>
                ))}
              </nav>

              {/* related below toc */}
              <div className="mt-14">
                <div className="bav-label mb-3.5 text-ink-60">— Also useful</div>
                <div>
                  {article.related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/help/${r.slug}`}
                      className="bav-hover-opa block border-t border-ink-10 py-4 text-inherit no-underline"
                    >
                      <div className="bav-label mb-1.5 text-ink-30">
                        {r.category}
                      </div>
                      <div
                        className="font-display font-light text-ink"
                        style={{ fontSize: 17, lineHeight: 1.25 }}
                      >
                        {r.title}
                      </div>
                    </Link>
                  ))}
                  <div className="border-b border-ink-10" />
                </div>
              </div>
            </div>
          </aside>

          {/* article body */}
          <article className="article-body">
            {article.body.map((block, i) => {
              if (block.kind === 'p') return <p key={i}>{block.text}</p>;
              if (block.kind === 'h2')
                return (
                  <h2 key={i} id={block.id}>
                    {block.text}
                  </h2>
                );
              if (block.kind === 'list')
                return (
                  <ol key={i} className="bav-list">
                    {block.items.map(([t, b], j) => (
                      <li key={j}>
                        <div>
                          <div className="li-title">{t}</div>
                          <div className="li-body">{b}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                );
              if (block.kind === 'pullquote')
                return (
                  <blockquote key={i} className="pullquote">
                    {'\u201C'}
                    {block.text}
                    {'\u201D'}
                  </blockquote>
                );
              if (block.kind === 'callout')
                return (
                  <div key={i} className="callout">
                    <div className="ct">{block.title}</div>
                    <p className="cb">{block.body}</p>
                  </div>
                );
              return null;
            })}

            {/* feedback — client island */}
            <HelpArticleFeedback />

            {/* contact footer */}
            <div
              className="mt-[72px] flex flex-wrap items-center justify-between gap-6 border-b border-t border-ink-10 py-12"
              style={{ maxWidth: '68ch' }}
            >
              <div>
                <div className="bav-label text-ink-30">Still need help</div>
                <div
                  className="mt-2.5 font-display font-light text-ink"
                  style={{ fontSize: 24 }}
                >
                  Write to support directly.
                </div>
              </div>
              <Link
                href="/support"
                className="bav-underline bav-label text-ink no-underline"
              >
                Start a chat <span className="arrow">→</span>
              </Link>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
