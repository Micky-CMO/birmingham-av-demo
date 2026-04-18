import { GlassCard } from '@/components/ui';

const ITEMS = [
  {
    title: '12-month warranty',
    body: 'Every unit ships with a year of parts + labour cover. Extend to 24 months at checkout.',
    icon: ShieldIcon,
  },
  {
    title: 'Free UK shipping',
    body: 'Next-working-day on orders placed before 3pm, insured door-to-door.',
    icon: TruckIcon,
  },
  {
    title: '30-day returns',
    body: 'Changed your mind? Send it back within 30 days for a full refund, no awkward questions.',
    icon: RotateIcon,
  },
];

export function WhyStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.title} className="p-5 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-green-100 text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green-400">
                <Icon />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-[-0.015em] sm:mt-5 sm:text-h3">
                {item.title}
              </h3>
              <p className="mt-2 text-small text-ink-500 dark:text-ink-300">{item.body}</p>
            </GlassCard>
          );
        })}
      </div>
    </section>
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
