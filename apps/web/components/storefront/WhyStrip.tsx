import { GlassCard } from '@/components/ui';

const ITEMS = [
  {
    kind: 'warranty' as const,
    title: '12-month warranty',
    body: 'Every unit ships with a year of parts + labour cover. Extend to 24 months at checkout.',
  },
  {
    kind: 'shipping' as const,
    title: 'Free UK shipping',
    body: 'Next-working-day on orders placed before 3pm, insured door-to-door via our courier partners.',
  },
  {
    kind: 'returns' as const,
    title: '30-day returns',
    body: 'Changed your mind? Send it back within 30 days for a full refund, no awkward questions.',
  },
];

export function WhyStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        {ITEMS.map((item) => (
          <GlassCard key={item.title} className="p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-green-100 text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green-400">
              {item.kind === 'warranty' && <ShieldIcon />}
              {item.kind === 'shipping' && <TruckIcon />}
              {item.kind === 'returns' && <RotateIcon />}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold tracking-[-0.015em] sm:mt-5 sm:text-h3">
              {item.title}
            </h3>
            <p className="mt-2 text-small text-ink-500 dark:text-ink-300">{item.body}</p>

            {item.kind === 'shipping' && <CourierRow />}
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function CourierRow() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-ink-300/50 pt-4 dark:border-obsidian-500/40">
      <RoyalMailLogo />
      <DPDLogo />
      <EvriLogo />
      <ParcelforceLogo />
    </div>
  );
}

// ============================================================================
// Courier marks. Redrawn as small inline SVGs in the brand voice so they read
// on light and dark surfaces. Not the official trademarks, styled approximations.
// ============================================================================

function RoyalMailLogo() {
  return (
    <div className="flex h-6 items-center gap-1.5" title="Royal Mail">
      <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="21" height="15" rx="2" fill="#EF2B2D" />
        <path d="M4 5l4 3.5L12 5v6" stroke="#FFD700" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 5h5M14 8h5M14 11h5" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
        Royal Mail
      </span>
    </div>
  );
}

function DPDLogo() {
  return (
    <div className="flex h-6 items-center gap-1.5" title="DPD">
      <svg width="26" height="16" viewBox="0 0 26 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="25" height="15" rx="2" fill="#DC0032" />
        <text x="13" y="11.5" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="900" fill="#FFFFFF" textAnchor="middle" letterSpacing="0.5">DPD</text>
      </svg>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
        DPD
      </span>
    </div>
  );
}

function EvriLogo() {
  return (
    <div className="flex h-6 items-center gap-1.5" title="Evri">
      <svg width="26" height="16" viewBox="0 0 26 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="25" height="15" rx="8" fill="#56C4D6" />
        <text x="13" y="11.5" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="700" fill="#0A3346" textAnchor="middle" letterSpacing="0">evri</text>
      </svg>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
        Evri
      </span>
    </div>
  );
}

function ParcelforceLogo() {
  return (
    <div className="flex h-6 items-center gap-1.5" title="Parcelforce Worldwide">
      <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="27" height="15" rx="2" fill="#004990" />
        <path d="M4 3l-2 3h2l-1.5 4h2l1-2h2l0.5 2h2L8 3z" fill="#FFD700" />
        <text x="17" y="11.5" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="700" fill="#FFFFFF" textAnchor="middle">PFORCE</text>
      </svg>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
        Parcelforce
      </span>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}
function RotateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
      <path d="M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
