import Link from 'next/link';
import { GlassCard } from '@/components/ui';
import { SpotlightCard } from '@/components/fx/SpotlightCard';
import { ScrollReveal } from '@/components/fx/ScrollReveal';

const CATEGORIES: Array<{ slug: string; label: string; subtitle: string; count: string; Icon: () => JSX.Element }> = [
  { slug: 'gaming-pc-bundles', label: 'Gaming PCs', subtitle: 'Hand-built rigs', count: '180+', Icon: TowerIcon },
  { slug: 'laptops', label: 'Laptops', subtitle: 'Work + play', count: '420+', Icon: LaptopIcon },
  { slug: 'monitors', label: 'Monitors', subtitle: 'Up to 240Hz', count: '95+', Icon: MonitorIcon },
  { slug: 'all-in-one-pc', label: 'All-in-One', subtitle: 'Zero clutter', count: '40+', Icon: AioIcon },
  { slug: 'network-equipment', label: 'Networking', subtitle: 'Switches, APs', count: '60+', Icon: NetIcon },
  { slug: 'parts', label: 'Parts', subtitle: 'CPU, GPU, RAM', count: '600+', Icon: ChipIcon },
];

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-widest text-ink-500">The catalog</p>
          <h2 className="mt-2 max-w-2xl font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
            Shop by what you need.
          </h2>
        </div>
        <Link href="/shop" className="text-small font-medium text-brand-green hover:underline">
          All products &rarr;
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
        {CATEGORIES.map((c, i) => (
          <ScrollReveal key={c.slug} delay={i * 0.06}>
            <Link href={`/shop/${c.slug}`} className="block">
              <SpotlightCard className="rounded-lg">
                <GlassCard className="relative aspect-[4/3] overflow-hidden p-6">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-caption uppercase tracking-widest text-ink-500">{c.subtitle}</span>
                      <span className="font-mono text-caption text-ink-500">{c.count}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <h3 className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-semibold tracking-[-0.02em]">{c.label}</h3>
                      <span className="text-ink-500 transition-all duration-420 ease-unfold group-hover:translate-x-1 group-hover:text-brand-green">
                        <c.Icon />
                      </span>
                    </div>
                  </div>
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-px w-0 bg-brand-green transition-all duration-700 ease-unfold group-hover:w-full"
                  />
                </GlassCard>
              </SpotlightCard>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

// --- Icons (custom SVGs in brand voice) ---

function TowerIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <path d="M9 7h6M9 10h6" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
function LaptopIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M2 19h20" strokeLinecap="round" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" strokeLinecap="round" />
    </svg>
  );
}
function AioIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M10 20h4M12 17v3" strokeLinecap="round" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}
function NetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="13" width="18" height="6" rx="1" />
      <path d="M7 17h.01M11 17h.01M15 17h.01" strokeLinecap="round" strokeWidth="2" />
      <path d="M12 13V7M5 7h14" strokeLinecap="round" />
    </svg>
  );
}
function ChipIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="0.5" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" strokeLinecap="round" />
    </svg>
  );
}
