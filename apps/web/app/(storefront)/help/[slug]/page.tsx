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
          'AV Care is a subscription that sits on top of the standard twelve-month manufacturer warranty. It covers what the warranty doesn\u2019t, and keeps covering long after year one. Two tiers: Essential (£14.99/mo or £149/yr) and Plus (£29.99/mo or £299/yr). £100 excess per claim. 30-day free trial.',
      },
      { kind: 'h2', id: 'essential', text: 'Essential' },
      {
        kind: 'list',
        items: [
          ['Accidental damage', 'Drops, spills, power-surge damage, cracked screens.'],
          ['Free collection', 'We pay both legs of UK collection and return.'],
          ['48-hour diagnostic SLA', 'From the moment the unit lands on the bench.'],
          ['Software support line', 'Driver issues, Windows activation, BIOS flashes, boot repair.'],
          ['Runs forever while subscribed', 'No 12-month expiry — still covered year 3, year 5.'],
        ],
      },
      { kind: 'h2', id: 'plus', text: 'Plus' },
      {
        kind: 'p',
        text:
          'Everything in Essential, with the workshop treating you as priority.',
      },
      {
        kind: 'list',
        items: [
          ['Loan device', 'Mid-range laptop or desktop shipped same day your unit is collected.'],
          ['Cross-shipping', 'Replacement part ships before we receive the faulty one back.'],
          ['Annual preventative service', 'Thermal repaste, fan clean, burn-in re-test, firmware updates.'],
          ['Component upgrade offset', 'If the same part isn\u2019t available, we apply 100% of its value toward the next-tier equivalent.'],
          ['24-hour diagnostic SLA', 'Priority queue. AV Care Plus jobs go first.'],
        ],
      },
      { kind: 'h2', id: 'excluded', text: 'What\u2019s not covered' },
      {
        kind: 'p',
        text:
          'Theft, intentional damage, cosmetic wear that doesn\u2019t affect function, unauthorised modifications, software licence fees (Windows, Adobe, etc.).',
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
  'change-my-delivery-address': {
    title: 'Change a delivery address',
    headlinePlain: 'Change a delivery',
    headlineItalic: 'address',
    category: { slug: 'orders-delivery', name: 'Orders & delivery' },
    lastUpdatedIso: '2026-04-10T10:00:00Z',
    readMinutes: 2,
    body: [
      {
        kind: 'p',
        text:
          'You can change the delivery address yourself up until the order reaches the In build stage. After that, any change has to go through chat so the courier manifest can be reissued.',
      },
      { kind: 'h2', id: 'before-build', text: 'Before the build starts' },
      {
        kind: 'list',
        items: [
          ['Open the order', 'Go to /account/orders and click the order number.'],
          ['Edit the address', 'If the status is Queued, the address row has an Edit button. Update and save.'],
          ['Confirmation', 'You\u2019ll get an email confirming the new address inside a minute.'],
        ],
      },
      { kind: 'h2', id: 'after-build', text: 'After the build has started' },
      {
        kind: 'p',
        text:
          'If the order is already In build or later, message us from the order page. We can re-route to any UK address before dispatch; international address changes after the build has started may trigger a re-invoice for duties.',
      },
      { kind: 'h2', id: 'already-shipped', text: 'Already shipped' },
      {
        kind: 'p',
        text:
          'Once a DPD tracking number is active, use DPD\u2019s own redirect tool via the tracking link on your order page. We can\u2019t amend a parcel already in the courier network, only redirect via the courier\u2019s portal.',
      },
    ],
    related: [
      { slug: 'where-is-my-order', title: 'Where is my order?', category: 'Orders & delivery' },
      { slug: 'cancel-an-order', title: 'Cancel an order', category: 'Orders & delivery' },
    ],
  },
  'cancel-an-order': {
    title: 'Cancel an order',
    headlinePlain: 'Cancel an',
    headlineItalic: 'order',
    category: { slug: 'orders-delivery', name: 'Orders & delivery' },
    lastUpdatedIso: '2026-04-10T10:00:00Z',
    readMinutes: 2,
    body: [
      {
        kind: 'p',
        text:
          'Standard stock orders can be cancelled before they\u2019re packed. Custom builds can be cancelled before component staging begins; once parts are pulled for your unit, cancellation becomes a return with any bespoke components refundable less a restocking fee.',
      },
      { kind: 'h2', id: 'how', text: 'How to cancel' },
      {
        kind: 'list',
        items: [
          ['Open the order', 'From /account/orders, click the order you want to cancel.'],
          ['Cancel button', 'If the order is still cancellable, a Cancel order button is visible. Click it.'],
          ['Confirm reason', 'Pick a reason (optional). Refund starts immediately.'],
          ['Refund timing', 'Cards: 3–5 working days. PayPal / Klarna / Clearpay: within 24 hours. Bank transfer: up to 5 working days.'],
        ],
      },
      { kind: 'h2', id: 'cant-cancel', text: 'If the Cancel button isn\u2019t visible' },
      {
        kind: 'p',
        text:
          'Your order has already progressed past the cancellation window. Open chat from the order page — we\u2019ll offer the closest option, which is either a full return on arrival or, for custom builds mid-assembly, a partial refund on any non-bespoke components.',
      },
    ],
    related: [
      { slug: 'where-is-my-order', title: 'Where is my order?', category: 'Orders & delivery' },
      { slug: 'start-a-return', title: 'Start a return', category: 'Returns & refunds' },
    ],
  },
  'register-a-product-for-av-care': {
    title: 'Register a product for AV Care',
    headlinePlain: 'Register a product for',
    headlineItalic: 'AV Care',
    category: { slug: 'av-care', name: 'AV Care subscription' },
    lastUpdatedIso: '2026-04-10T10:00:00Z',
    readMinutes: 3,
    body: [
      {
        kind: 'p',
        text:
          'AV Care is billed per account, not per product. Once you\u2019ve subscribed, every eligible BAV product under your account is covered automatically — no need to register each one individually. This page explains where to see what\u2019s registered and how to add a product bought outside the site.',
      },
      { kind: 'h2', id: 'automatic', text: 'What registers automatically' },
      {
        kind: 'p',
        text:
          'Anything bought through this account since you activated AV Care. Open /account/av-care to see the list of covered items, their build numbers, and the start date of cover.',
      },
      { kind: 'h2', id: 'add-external', text: 'Adding a product bought elsewhere' },
      {
        kind: 'list',
        items: [
          ['Go to /account/av-care', 'Click "Register external product".'],
          ['Enter the serial number', 'BAV-built products have the build number engraved on the chassis plate or printed on the birth certificate.'],
          ['Upload proof of purchase', 'A photo of the receipt or original order confirmation. We accept purchases from the eBay store too.'],
          ['Inspection', 'For non-BAV-built products, we may ask you to ship the unit in for a one-time baseline check before cover activates.'],
        ],
      },
      { kind: 'h2', id: 'cancel-or-pause', text: 'Cancelling or pausing' },
      {
        kind: 'p',
        text:
          'Cancel any time from /account/av-care. Cover continues to the end of your current billing period. Pause up to 60 days per year if you\u2019re away — pro-rated to the nearest day.',
      },
    ],
    related: [
      { slug: 'what-does-av-care-actually-cover', title: 'What does AV Care actually cover?', category: 'AV Care subscription' },
      { slug: 'start-a-return', title: 'Start a return', category: 'Returns & refunds' },
    ],
  },
  'request-a-rush-slot': {
    title: 'Request a rush build slot',
    headlinePlain: 'Request a rush build',
    headlineItalic: 'slot',
    category: { slug: 'build-specs', name: 'Builds & specifications' },
    lastUpdatedIso: '2026-04-10T10:00:00Z',
    readMinutes: 2,
    body: [
      {
        kind: 'p',
        text:
          'Standard turnaround is four to seven working days. Rush slots compress that to two to three, subject to stock and bench availability. Rush is an extra £199 and waives the 24-hour soak test — only appropriate if you need the machine fast and understand the trade-off.',
      },
      { kind: 'h2', id: 'availability', text: 'When rush is available' },
      {
        kind: 'p',
        text:
          'We keep one or two rush slots per week. They clear quickly. Ask in chat before placing the order — the answer is usually within fifteen minutes of a message during working hours.',
      },
      { kind: 'h2', id: 'limits', text: 'What we won\u2019t rush' },
      {
        kind: 'list',
        items: [
          ['Water loops', 'Hard-tubed custom loops need full bench time; we don\u2019t compress them.'],
          ['Parts on allocation', 'If the GPU or CPU is on distributor allocation, the order waits on stock regardless of rush.'],
          ['Chassis mods', 'Bespoke chassis work needs its own schedule; rush doesn\u2019t apply.'],
        ],
      },
      {
        kind: 'callout',
        title: 'What the rush fee covers',
        body:
          'Priority queueing, same-day parts staging, and next-day dispatch instead of queued dispatch. It doesn\u2019t buy a different machine — build quality and QC sign-off are identical.',
      },
    ],
    related: [
      { slug: 'how-long-does-a-custom-build-take', title: 'How long does a custom build take?', category: 'Builds & specifications' },
      { slug: 'where-is-my-order', title: 'Where is my order?', category: 'Orders & delivery' },
    ],
  },
  'enrol-a-passkey': {
    title: 'Enrol a passkey on your account',
    headlinePlain: 'Enrol a',
    headlineItalic: 'passkey',
    category: { slug: 'account-security', name: 'Account & security' },
    lastUpdatedIso: '2026-04-10T10:00:00Z',
    readMinutes: 3,
    body: [
      {
        kind: 'p',
        text:
          'Passkeys replace the password with your device\u2019s biometric (Face ID, Touch ID, Windows Hello) or a hardware security key. Safer, faster, no phishing surface. Every account should have at least one.',
      },
      { kind: 'h2', id: 'enrol', text: 'Enrol one' },
      {
        kind: 'list',
        items: [
          ['Go to /account/security', 'Sign in first if you haven\u2019t already.'],
          ['Click "Add passkey"', 'Your browser or OS will prompt for authentication — Face ID, Touch ID, Windows Hello, or a YubiKey.'],
          ['Name the passkey', 'e.g. "MacBook Pro" or "Pixel 9". Helps if you later need to revoke one.'],
          ['Save', 'That\u2019s it. Next time you sign in, pick "Sign in with a passkey" and authenticate.'],
        ],
      },
      { kind: 'h2', id: 'multiple', text: 'Enrol more than one' },
      {
        kind: 'p',
        text:
          'We recommend at least two passkeys on different devices — one on your phone, one on your laptop. If one device is lost, the other still gets you in without needing a password reset.',
      },
      { kind: 'h2', id: 'supported', text: 'What\u2019s supported' },
      {
        kind: 'list',
        items: [
          ['iOS 16 / macOS Ventura and later', 'Face ID and Touch ID via Safari, Chrome, Firefox, Edge.'],
          ['Android 9 and later', 'Fingerprint or screen-lock PIN via Chrome, Firefox, Edge.'],
          ['Windows 10 / 11', 'Windows Hello (face, fingerprint, PIN) via Edge, Chrome, Firefox.'],
          ['Hardware keys', 'YubiKey 5, Google Titan, Feitian — anything WebAuthn-compliant.'],
        ],
      },
      { kind: 'h2', id: 'lost-device', text: 'Lost your device?' },
      {
        kind: 'p',
        text:
          'Sign in on a device that still has an enrolled passkey and revoke the lost device\u2019s passkey from /account/security. If no other passkey is enrolled, use the magic-link fallback (email to the address on file) and enrol a fresh passkey immediately.',
      },
    ],
    related: [
      { slug: 'where-is-my-order', title: 'Where is my order?', category: 'Orders & delivery' },
    ],
  },
  'vat-receipts-and-invoices': {
    title: 'VAT receipts and invoices',
    headlinePlain: 'VAT receipts and',
    headlineItalic: 'invoices',
    category: { slug: 'payments-billing', name: 'Payments & billing' },
    lastUpdatedIso: '2026-04-10T10:00:00Z',
    readMinutes: 2,
    body: [
      {
        kind: 'p',
        text:
          'Birmingham AV Ltd is VAT registered (GB 217 8934 12). Every order includes a VAT invoice accessible from the order page. Business accounts can also enable net-30 terms with a separate invoicing flow.',
      },
      { kind: 'h2', id: 'download', text: 'Downloading a VAT invoice' },
      {
        kind: 'list',
        items: [
          ['Open the order', 'From /account/orders, click the order number.'],
          ['Click "Download VAT invoice"', 'A PDF with itemised VAT, subtotal, and total lands in your downloads.'],
          ['Order number as reference', 'The PDF filename is BAV-<ordernumber>.pdf; the invoice itself references the same number.'],
        ],
      },
      { kind: 'h2', id: 'business', text: 'Business accounts' },
      {
        kind: 'p',
        text:
          'Trade accounts get purchase-order support, net-30 payment terms, and consolidated monthly invoicing. Apply at /business — we\u2019ll do a credit check and confirm limits inside two working days.',
      },
      { kind: 'h2', id: 'vat-refunds', text: 'VAT refunds on returns' },
      {
        kind: 'p',
        text:
          'If you return a product and the refund is issued, the VAT portion is refunded automatically in the same transaction. A credit note PDF is issued alongside the refund email.',
      },
      { kind: 'h2', id: 'export', text: 'Export orders (outside the UK)' },
      {
        kind: 'p',
        text:
          'Orders shipped outside the UK are zero-rated for VAT provided the shipping address is outside the UK and valid commercial documentation is generated. Duty and import VAT in the destination country are the buyer\u2019s responsibility.',
      },
    ],
    related: [
      { slug: 'where-is-my-order', title: 'Where is my order?', category: 'Orders & delivery' },
      { slug: 'cancel-an-order', title: 'Cancel an order', category: 'Orders & delivery' },
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
