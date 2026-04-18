import Image from 'next/image';
import Link from 'next/link';
import { SpotlightCard } from '@/components/fx/SpotlightCard';
import { ScrollReveal } from '@/components/fx/ScrollReveal';

type Category = {
  slug: string;
  label: string;
  subtitle: string;
  count: string;
  /** Real product photography. Unsplash-hosted. */
  imageUrl: string;
  /** Credit: photographer name (shown small, bottom-right). */
  credit: string;
  /** Accent tint overlay colour in rgba. */
  tint: string;
};

const CATEGORIES: Category[] = [
  {
    slug: 'gaming-pc-bundles',
    label: 'Gaming PCs',
    subtitle: 'Hand-built rigs',
    count: '180+',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1600&q=85&auto=format&fit=crop',
    credit: 'Thermaltake build',
    tint: 'rgba(30, 181, 58, 0.20)',
  },
  {
    slug: 'laptops',
    label: 'Laptops',
    subtitle: 'Work + play',
    count: '420+',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1600&q=85&auto=format&fit=crop',
    credit: 'MacBook Pro',
    tint: 'rgba(79, 145, 255, 0.18)',
  },
  {
    slug: 'monitors',
    label: 'Monitors',
    subtitle: 'Up to 240Hz',
    count: '95+',
    imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1600&q=85&auto=format&fit=crop',
    credit: 'Alienware setup',
    tint: 'rgba(139, 92, 246, 0.22)',
  },
  {
    slug: 'all-in-one-pc',
    label: 'All-in-One',
    subtitle: 'Zero clutter',
    count: '40+',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1600&q=85&auto=format&fit=crop',
    credit: 'iMac',
    tint: 'rgba(34, 211, 238, 0.18)',
  },
  {
    slug: 'network-equipment',
    label: 'Networking',
    subtitle: 'Switches, APs',
    count: '60+',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&q=85&auto=format&fit=crop',
    credit: 'Data centre',
    tint: 'rgba(240, 184, 73, 0.18)',
  },
  {
    slug: 'parts',
    label: 'Parts',
    subtitle: 'CPU, GPU, RAM',
    count: '600+',
    imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=1600&q=85&auto=format&fit=crop',
    credit: 'Circuit macro',
    tint: 'rgba(30, 181, 58, 0.20)',
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
                <article className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lift transition-transform duration-500 ease-unfold group-hover:-translate-y-1 sm:aspect-[4/3]">
                  {/* Real product photography, slow zoom on hover */}
                  <Image
                    src={c.imageUrl}
                    alt={c.label}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                    className="object-cover transition-transform duration-[900ms] ease-unfold group-hover:scale-[1.08]"
                    priority={i < 3}
                  />

                  {/* Tint wash for brand coherence */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundColor: c.tint }}
                  />

                  {/* Bottom-to-top darkening for text legibility */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.35) 50%, rgba(10,10,10,0.85) 100%)',
                    }}
                  />

                  {/* Hover glow wash */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(60% 60% at 30% 100%, ${c.tint.replace('0.1', '0.5').replace('0.2', '0.5')}, transparent 70%)`,
                    }}
                  />

                  {/* Top meta strip */}
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/75 sm:text-caption">
                      {c.subtitle}
                    </span>
                    <span className="font-mono text-[10px] text-white/75 sm:text-caption">{c.count}</span>
                  </div>

                  {/* Bottom label strip */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <h3 className="font-display text-[clamp(1.25rem,5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                      {c.label}
                    </h3>
                    <span className="mt-1 inline-flex items-center gap-1 text-caption text-white/80 transition-all duration-420 ease-unfold group-hover:text-brand-green-400">
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
                </article>
              </SpotlightCard>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
