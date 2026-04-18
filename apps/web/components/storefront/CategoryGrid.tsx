import Link from 'next/link';
import { SpotlightCard } from '@/components/fx/SpotlightCard';
import { ScrollReveal } from '@/components/fx/ScrollReveal';

type Category = {
  slug: string;
  label: string;
  subtitle: string;
  count: string;
  Art: () => JSX.Element;
  gradientFrom: string;
  gradientTo: string;
};

const CATEGORIES: Category[] = [
  {
    slug: 'gaming-pc-bundles', label: 'Gaming PCs', subtitle: 'Hand-built rigs', count: '180+',
    Art: TowerArt, gradientFrom: '#0a2a13', gradientTo: '#1EB53A',
  },
  {
    slug: 'laptops', label: 'Laptops', subtitle: 'Work + play', count: '420+',
    Art: LaptopArt, gradientFrom: '#0b1d2e', gradientTo: '#4F91FF',
  },
  {
    slug: 'monitors', label: 'Monitors', subtitle: 'Up to 240Hz', count: '95+',
    Art: MonitorArt, gradientFrom: '#1a0b2e', gradientTo: '#8B5CF6',
  },
  {
    slug: 'all-in-one-pc', label: 'All-in-One', subtitle: 'Zero clutter', count: '40+',
    Art: AioArt, gradientFrom: '#0e2a20', gradientTo: '#22D3EE',
  },
  {
    slug: 'network-equipment', label: 'Networking', subtitle: 'Switches, APs', count: '60+',
    Art: NetArt, gradientFrom: '#2e1c0a', gradientTo: '#F0B849',
  },
  {
    slug: 'parts', label: 'Parts', subtitle: 'CPU, GPU, RAM', count: '600+',
    Art: ChipArt, gradientFrom: '#0a2a24', gradientTo: '#1EB53A',
  },
];

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-24">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-widest text-ink-500">The catalog</p>
          <h2 className="mt-2 max-w-2xl font-display text-[clamp(1.75rem,7vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
            Shop by what you need.
          </h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center text-small font-medium text-brand-green hover:underline"
        >
          All products &rarr;
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3">
        {CATEGORIES.map((c, i) => (
          <ScrollReveal key={c.slug} delay={i * 0.06}>
            <Link href={`/shop/${c.slug}`} className="group block">
              <SpotlightCard className="rounded-2xl">
                <article
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink-900/5 shadow-lift transition-transform duration-500 ease-unfold group-hover:-translate-y-1 sm:aspect-[4/3] dark:border-obsidian-500/40"
                  style={{
                    background: `radial-gradient(120% 120% at 100% 0%, ${c.gradientTo}33, transparent 55%), linear-gradient(135deg, ${c.gradientFrom} 0%, #0A0A0A 70%)`,
                  }}
                >
                  {/* Large centred SVG artwork, always visible */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-white/80 transition-transform duration-700 ease-unfold group-hover:scale-[1.06] sm:p-10"
                  >
                    <div className="h-full w-full max-h-[55%] max-w-[85%] drop-shadow-[0_0_30px_rgba(30,181,58,0.35)]">
                      <c.Art />
                    </div>
                  </div>

                  {/* Glow wash on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(80% 80% at 50% 50%, ${c.gradientTo}40, transparent 60%)`,
                    }}
                  />

                  {/* Top meta strip */}
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/60 sm:text-caption">
                      {c.subtitle}
                    </span>
                    <span className="font-mono text-[10px] text-white/60 sm:text-caption">{c.count}</span>
                  </div>

                  {/* Bottom label strip */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <h3 className="font-display text-[clamp(1.15rem,5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-white">
                      {c.label}
                    </h3>
                    <span className="mt-1 inline-flex items-center gap-1 text-caption text-white/70 transition-all duration-420 ease-unfold group-hover:text-brand-green-400">
                      Explore
                      <span aria-hidden className="transition-transform duration-420 group-hover:translate-x-1">
                        &rarr;
                      </span>
                    </span>
                  </div>

                  {/* Accent bottom line */}
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-green transition-all duration-700 ease-unfold group-hover:w-full"
                  />

                  {/* Hairline noise grid */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }}
                  />
                </article>
              </SpotlightCard>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Editorial category artwork: single-weight SVGs that fill their container.
// Drawn in white (opacity controlled upstream) so they read on any gradient.
// ============================================================================

function TowerArt() {
  return (
    <svg viewBox="0 0 200 240" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <rect x="40" y="20" width="120" height="200" rx="6" />
      <path d="M58 42h84M58 58h84M58 74h84" strokeLinecap="round" opacity="0.6" />
      <rect x="62" y="110" width="76" height="50" rx="4" />
      <circle cx="100" cy="135" r="18" />
      <circle cx="100" cy="135" r="10" strokeDasharray="2 3" />
      <circle cx="100" cy="135" r="2.5" fill="currentColor" stroke="none" />
      <path d="M58 178h84M58 190h60" strokeLinecap="round" opacity="0.6" />
      <rect x="80" y="202" width="40" height="6" rx="2" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>
  );
}

function LaptopArt() {
  return (
    <svg viewBox="0 0 240 200" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <rect x="40" y="30" width="160" height="110" rx="6" />
      <rect x="50" y="40" width="140" height="90" rx="3" opacity="0.35" fill="currentColor" stroke="none" />
      <path d="M16 150h208l-14 24H30z" strokeLinejoin="round" />
      <path d="M102 164h36" strokeLinecap="round" />
      <path d="M68 58h40M68 68h80M68 78h60M68 92h100M68 102h64M68 112h44" strokeLinecap="round" opacity="0.5" strokeWidth="1.4" />
    </svg>
  );
}

function MonitorArt() {
  return (
    <svg viewBox="0 0 240 200" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <rect x="16" y="16" width="208" height="140" rx="6" />
      <rect x="28" y="28" width="184" height="116" rx="3" opacity="0.25" fill="currentColor" stroke="none" />
      <path d="M40 78l28 32 28 -22 34 28 40 -36 32 20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" opacity="0.8" />
      <path d="M92 170h56M120 156v14" strokeLinecap="round" />
      <rect x="78" y="180" width="84" height="8" rx="3" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  );
}

function AioArt() {
  return (
    <svg viewBox="0 0 240 220" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <rect x="16" y="14" width="208" height="150" rx="6" />
      <rect x="28" y="26" width="184" height="126" rx="3" opacity="0.25" fill="currentColor" stroke="none" />
      <circle cx="120" cy="90" r="30" />
      <circle cx="120" cy="90" r="16" fill="currentColor" stroke="none" opacity="0.65" />
      <circle cx="120" cy="90" r="5" fill="currentColor" stroke="none" />
      <path d="M98 178h44M120 164v14" strokeLinecap="round" />
      <rect x="82" y="188" width="76" height="8" rx="3" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  );
}

function NetArt() {
  return (
    <svg viewBox="0 0 240 200" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <rect x="18" y="124" width="204" height="52" rx="4" />
      <g fill="currentColor" stroke="none">
        <circle cx="44" cy="150" r="3.5" />
        <circle cx="66" cy="150" r="3.5" />
        <circle cx="88" cy="150" r="3.5" />
        <circle cx="110" cy="150" r="3.5" />
        <circle cx="132" cy="150" r="3.5" />
        <circle cx="154" cy="150" r="3.5" />
        <circle cx="176" cy="150" r="3.5" />
        <circle cx="198" cy="150" r="3.5" />
      </g>
      <path d="M120 120V72M68 72h104M68 72V44M120 72V44M172 72V44" strokeLinecap="round" />
      <g>
        <circle cx="68" cy="34" r="10" />
        <circle cx="120" cy="34" r="10" />
        <circle cx="172" cy="34" r="10" />
        <path d="M64 30a6 6 0 0112 0M60 26a10 10 0 0120 0" strokeLinecap="round" opacity="0.7" />
        <path d="M116 30a6 6 0 0112 0M112 26a10 10 0 0120 0" strokeLinecap="round" opacity="0.7" />
        <path d="M168 30a6 6 0 0112 0M164 26a10 10 0 0120 0" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}

function ChipArt() {
  return (
    <svg viewBox="0 0 220 220" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
      <rect x="48" y="48" width="124" height="124" rx="8" />
      <rect x="68" y="68" width="84" height="84" rx="4" opacity="0.3" fill="currentColor" stroke="none" />
      <rect x="86" y="86" width="48" height="48" rx="3" />
      <text x="110" y="118" fill="currentColor" stroke="none" fontSize="14" fontFamily="monospace" fontWeight="700" textAnchor="middle">BAV</text>
      <g strokeLinecap="round">
        <path d="M70 48V28M90 48V28M110 48V28M130 48V28M150 48V28" />
        <path d="M70 192v-20M90 192v-20M110 192v-20M130 192v-20M150 192v-20" />
        <path d="M48 70H28M48 90H28M48 110H28M48 130H28M48 150H28" />
        <path d="M192 70h-20M192 90h-20M192 110h-20M192 130h-20M192 150h-20" />
      </g>
    </svg>
  );
}
