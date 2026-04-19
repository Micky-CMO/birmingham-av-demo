import Link from 'next/link';
import type { ReactNode } from 'react';

// ============================================================================
// Empty states (artefact 32)
//
// One shared primitive (`EmptyBlock`) plus four preset variants for the
// specific routes that need them:
//   - EmptyCart     → /cart (and cart drawer)
//   - EmptyOrders   → /account/orders
//   - EmptyReturns  → /account/returns
//   - EmptySearch   → /search?q=… with zero matches
//
// Each block follows the same formula: Fraunces headline with one italic
// word, one sentence of body, one primary action, one quiet secondary link.
// No illustrations, no icons above 20px, no "oops" copy.
// ============================================================================

type ActionLink = { label: string; href: string };

export type EmptyBlockProps = {
  /** Mono caption sitting above the headline (e.g. "Empty cart · /cart"). */
  label: string;
  /**
   * Headline with a `{it}` placeholder for the italicised word; pass the
   * italic fragment separately via `italicWord`. The remaining heading
   * text — before and after the placeholder — renders in regular weight.
   */
  heading: string;
  italicWord: string;
  /** Body paragraph. One sentence, two at most. */
  body: ReactNode;
  primary: ActionLink;
  secondary?: ActionLink;
  /** Optional hairline-separated mono meta line beneath the body. */
  meta?: ReactNode;
  /**
   * Cart-drawer / inline variant: removes the min-height and outer border
   * so the block slots inside a parent frame.
   */
  inline?: boolean;
  className?: string;
};

function splitHeading(heading: string, italicWord: string) {
  const [before, after] = heading.split('{it}');
  return (
    <>
      {before}
      <span className="bav-italic">{italicWord}</span>
      {after}
    </>
  );
}

export function EmptyBlock({
  label,
  heading,
  italicWord,
  body,
  primary,
  secondary,
  meta,
  inline = false,
  className = '',
}: EmptyBlockProps) {
  return (
    <div
      className={[
        'flex flex-col bg-paper',
        inline
          ? 'px-[clamp(24px,5vw,48px)] py-[clamp(32px,5vw,56px)]'
          : 'min-h-[420px] border border-ink-10 px-[clamp(32px,6vw,72px)] py-[clamp(40px,6vw,80px)]',
        className,
      ]
        .join(' ')
        .trim()}
    >
      <div className="bav-label mb-7 text-ink-60">— {label}</div>

      <h2 className="m-0 max-w-[520px] font-display text-[clamp(32px,3.2vw,46px)] font-light leading-[1.05] tracking-[-0.02em]">
        {splitHeading(heading, italicWord)}
      </h2>

      <p className="mb-0 mt-7 max-w-[480px] text-[15px] leading-[1.75] text-ink-60">
        {body}
      </p>

      {meta ? (
        <div className="mt-6 max-w-[480px] border-t border-ink-10 pt-6 font-mono text-[12px] tabular-nums tracking-[0.04em] text-ink-30">
          {meta}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col items-start gap-5 pt-10">
        <Link
          href={primary.href}
          className="bav-cta"
          style={{ width: 'auto', padding: '18px 36px', fontSize: 12 }}
        >
          {primary.label}
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="bav-underline text-[13px] text-ink-60 no-underline"
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

// ---- Preset variants ----

export function EmptyCart({ inline = false }: { inline?: boolean } = {}) {
  return (
    <EmptyBlock
      label="Empty cart"
      heading="Nothing in the {it} yet."
      italicWord="basket"
      body="Your basket is empty. Browse the catalogue, or pick up from where you left off — the last three builds you viewed are waiting on the home page."
      primary={{ label: 'Browse the catalogue', href: '/shop' }}
      secondary={{ label: 'View recently seen builds →', href: '/' }}
      inline={inline}
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyBlock
      label="No orders · /account/orders"
      heading="No orders on {it} yet."
      italicWord="record"
      body="Nothing shipped under this account. When you place an order, its timeline and invoice will appear here, and every builder who touched the machine will be credited."
      primary={{ label: 'Start browsing', href: '/shop' }}
      secondary={{ label: 'Read the build process →', href: '/about' }}
      meta="Orders older than six years are archived to a separate view."
    />
  );
}

export function EmptyReturns() {
  return (
    <EmptyBlock
      label="No returns · /account/returns"
      heading="Nothing {it}."
      italicWord="returned"
      body="You have not started a return on this account, which is exactly how we like it. If anything arrives wrong or develops a fault inside the warranty window, you can raise one from any order."
      primary={{ label: 'View orders', href: '/account/orders' }}
      secondary={{ label: 'Read the returns policy →', href: '/returns-policy' }}
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyBlock
      label={`Zero results · /search?q=${encodeURIComponent(query)}`}
      heading="Nothing matched {it}."
      italicWord="that"
      body="No builds in stock match your search. Try a broader term, check a related category, or ask the support team — we can quote on custom configurations that are not listed."
      primary={{ label: 'Browse categories', href: '/shop' }}
      secondary={{ label: 'Ask for a custom quote →', href: '/support' }}
      meta={`Searched: \u201c${query}\u201d`}
    />
  );
}
