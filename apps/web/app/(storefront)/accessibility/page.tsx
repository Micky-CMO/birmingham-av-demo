import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Accessibility',
  description:
    'How Birmingham AV designs, tests, and supports for people who shop, configure, and collaborate with us — regardless of ability. Our commitments, standards, and contact.',
};

export const dynamic = 'force-static';

const COMMITMENTS = [
  {
    eyebrow: '— Keyboard',
    title: 'Every surface is keyboard-operable.',
    body: 'Every interaction on this site — mega menu, cart, configurator, admin — can be completed without a mouse. Focus rings are visible, focus order is logical, skip links get you to main content on every page.',
  },
  {
    eyebrow: '— Screen readers',
    title: 'Labels, landmarks, and plain-English copy.',
    body: 'Product names carry context (condition, build number, warranty) rather than marketing euphemisms. Every form field has a visible label. Every image has an alt description written by the builder, not a stock feed.',
  },
  {
    eyebrow: '— Motion',
    title: 'Respectful of `prefers-reduced-motion`.',
    body: 'Parallax, scroll reveals, and transitions defer to the operating system. If you have motion reduction enabled, the site remains useful and nothing animates beyond a fade.',
  },
  {
    eyebrow: '— Contrast',
    title: 'WCAG 2.1 AA across every palette.',
    body: 'Typography is tested against paper and paper-two backgrounds at every weight. Interactive states meet 4.5:1 minimum. Dark mode, when enabled, uses an obsidian palette with the same rigour.',
  },
  {
    eyebrow: '— Workshop content',
    title: 'Captions and transcripts on every video.',
    body: 'Workshop reels, builder introductions, burn-in walkthroughs — all ship with burnt-in captions and a link to the full transcript. No audio content is essential without a written alternative.',
  },
  {
    eyebrow: '— Forms',
    title: 'Errors you can read, fix, and retry.',
    body: 'Every form returns field-level errors in plain English. No colour-only signalling. No timeouts that catch you out. The configurator saves your progress if you navigate away.',
  },
];

const VALUES = [
  {
    title: 'Independence',
    body: 'Anything you can do with a mouse, you can do with a keyboard, a screen reader, or voice control. That is the whole design brief — not a secondary mode, not a fallback.',
  },
  {
    title: 'Clarity',
    body: 'Plain British English. Short sentences. Real product names. Error messages that say what went wrong and what to try next. If we write copy the team cannot read aloud easily, we rewrite it.',
  },
  {
    title: 'Patience',
    body: 'No countdowns on checkout. No auto-dismissing banners. No pop-ups that fight you for focus. You set the pace, and the interface waits.',
  },
];

export default function AccessibilityPage() {
  return (
    <>
      {/* HERO */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:pt-32 md:pb-40">
          <div className="bav-fade">
            <div className="bav-label mb-16 text-ink-60">— Accessibility</div>
            <h1 className="m-0 mb-14 font-display text-[clamp(56px,9vw,140px)] font-light leading-[0.95] tracking-[-0.035em]">
              Made for <span className="bav-italic">everyone</span>.
            </h1>
            <div className="max-w-[560px]">
              <p className="mb-12 text-[21px] leading-[1.5] text-ink-60">
                Accessibility is not a feature we bolted on at the end. It sits in the same
                review as performance, security, and design — a blocker at every release.
                Here is how, and who to contact when we fall short.
              </p>
              <Link
                href="#contact"
                className="bav-underline text-[14px] text-ink no-underline"
              >
                <span>Report a barrier</span>
                <span className="arrow font-mono">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-b border-ink-10 bg-paper-2">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
          <div className="bav-label mb-16 text-ink-60">— Our values</div>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-12">
            {VALUES.map((v) => (
              <div key={v.title}>
                <h2 className="m-0 mb-6 font-display text-[40px] font-light leading-[1.05] tracking-[-0.025em]">
                  {v.title}
                </h2>
                <p className="m-0 text-[17px] leading-[1.55] text-ink-60">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITMENTS */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
          <div className="bav-label mb-16 text-ink-60">— Commitments</div>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-x-16 md:gap-y-20">
            {COMMITMENTS.map((c) => (
              <div key={c.title}>
                <div className="bav-label mb-5 text-ink-60">{c.eyebrow}</div>
                <h3 className="m-0 mb-5 font-display text-[28px] font-light leading-[1.2] tracking-[-0.02em]">
                  {c.title}
                </h3>
                <p className="m-0 text-[16px] leading-[1.6] text-ink-60">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STANDARDS + CONTACT */}
      <section id="contact">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20">
            <div>
              <div className="bav-label mb-8 text-ink-60">— Standards we hold ourselves to</div>
              <ul className="list-none space-y-4 p-0 text-[16px] leading-[1.6] text-ink">
                <li>WCAG 2.1 AA as the minimum across every template</li>
                <li>WAI-ARIA 1.2 for live regions, dialog semantics, and mega menus</li>
                <li>UK Public Sector Bodies Accessibility Regulations 2018 as a reference even though we are private sector</li>
                <li>EN 301 549 for the accessibility of ICT products and services</li>
                <li>Internal keyboard + NVDA audits before each sprint closes</li>
              </ul>
            </div>
            <div>
              <div className="bav-label mb-8 text-ink-60">— Report a barrier</div>
              <p className="m-0 mb-7 text-[17px] leading-[1.55] text-ink-60">
                If something on this site is hard to use — a button you cannot reach, copy a
                screen reader mispronounces, a form that rejects your input — we want to know.
                A real person reads every message and a fix lands within five working days or
                a status update explaining why not.
              </p>
              <a
                href="mailto:access@birmingham-av.com?subject=Accessibility feedback"
                className="bav-underline text-[14px] text-ink no-underline"
              >
                <span>access@birmingham-av.com</span>
                <span className="arrow font-mono">→</span>
              </a>
              <div className="bav-label mt-10 text-ink-30">
                Last audit · 19 April 2026 · Next audit · 14 July 2026
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
