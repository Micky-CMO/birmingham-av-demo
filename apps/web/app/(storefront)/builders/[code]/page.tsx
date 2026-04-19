import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TIER_LABEL: Record<string, string> = {
  elite: 'Elite',
  preferred: 'Preferred',
  standard: 'Standard',
  probation: 'Probation',
};

// avgBuildMinutes → "3h 24min" display string
function formatBuildTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Mirrors buildNumberFromSku in app/(storefront)/product/[slug]/page.tsx so the
// tiles on the profile show the same № device as the shop + product pages.
function buildNumberFromSku(sku: string): string {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return '000';
  return m[1].padStart(3, '0').slice(-3);
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const b = await prisma.builder.findUnique({
    where: { builderCode: params.code.toUpperCase() },
    select: { displayName: true, bio: true, builderCode: true },
  });
  if (!b) {
    return {
      title: 'Builder not found',
      description: 'This Birmingham AV builder profile is no longer available.',
    };
  }
  return {
    title: `${b.displayName} — Birmingham AV`,
    description: (b.bio ?? `${b.displayName} builds at Birmingham AV.`).slice(0, 155),
  };
}

export default async function BuilderProfile({ params }: { params: { code: string } }) {
  const b = await prisma.builder.findUnique({
    where: { builderCode: params.code.toUpperCase() },
  });
  if (!b || b.status !== 'active') notFound();

  const products = await prisma.product.findMany({
    where: { builderId: b.builderId, isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: { inventory: true },
  });

  const estYear = new Date(b.joinedAt).getFullYear();
  const tierLabel = TIER_LABEL[b.tier] ?? b.tier;
  const firstName = b.displayName.split(' ')[0];
  const isFeaturedTier = b.tier === 'elite' || b.tier === 'preferred';

  const stats = [
    { label: 'Units built', value: b.totalUnitsBuilt.toLocaleString('en-GB') },
    { label: 'Quality score', value: `${Number(b.qualityScore).toFixed(1)} / 5.0` },
    { label: 'RMA rate (90d)', value: `${(Number(b.rmaRateRolling90d) * 100).toFixed(1)}%` },
    { label: 'Avg build time', value: formatBuildTime(b.avgBuildMinutes) },
  ];

  return (
    <main>
      {/* Breadcrumb */}
      <div className="border-b border-ink-10">
        <div className="bav-page-pad mx-auto flex max-w-page items-center justify-between px-12 py-[18px]">
          <div className="bav-label flex gap-2.5 text-ink-60">
            <Link href="/builders" className="bav-hover-opa text-inherit no-underline">
              Builders
            </Link>
            <span className="text-ink-30">/</span>
            <span className="text-ink">{b.displayName}</span>
          </div>
          <div className="bav-label text-ink-30">{b.builderCode}</div>
        </div>
      </div>

      {/* Hero: portrait + info */}
      <section className="border-b border-ink-10">
        <div className="bav-page-pad mx-auto max-w-page px-12 py-16 md:py-24">
          <div className="bav-profile-layout">
            {/* Left — large portrait */}
            <div className="bav-fade">
              <div
                className="bav-ink-canvas relative"
                style={{ aspectRatio: '4 / 5' }}
              >
                <div className="bav-label absolute left-5 top-5 text-[13px] tracking-[0.14em] text-[rgba(247,245,242,0.40)]">
                  {b.builderCode}
                </div>
                {isFeaturedTier && (
                  <div className="bav-label absolute bottom-5 left-5 text-[rgba(247,245,242,0.40)]">
                    {tierLabel}
                  </div>
                )}
                <div className="bav-label absolute bottom-5 right-5 text-[rgba(247,245,242,0.40)]">
                  Est. {estYear}
                </div>
              </div>
            </div>

            {/* Right — sticky info column */}
            <div
              className="bav-profile-info bav-fade"
              style={{ animationDelay: '120ms' }}
            >
              <div className="mb-6 flex items-center gap-3.5">
                <div className="bav-label text-ink-60">{b.builderCode}</div>
                <div className="bav-label flex items-center gap-2 text-ink-60">
                  <span className="bav-pulse" />
                  <span>Active</span>
                </div>
              </div>

              <h1 className="m-0 mb-5 font-display text-[clamp(40px,4.5vw,64px)] font-light leading-[0.96] tracking-[-0.025em]">
                {b.displayName}
              </h1>

              <div className="bav-label mb-7 text-ink-60">
                {tierLabel} builder · {b.yearsBuilding}{' '}
                {b.yearsBuilding === 1 ? 'year' : 'years'}
              </div>

              {b.specialities.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {b.specialities.map((s) => (
                    <span key={s} className="bav-spec-pill">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {b.bio && (
                <p className="m-0 mb-10 text-[16px] leading-[1.65] text-ink-60">{b.bio}</p>
              )}

              {/* Stats 2×2 */}
              <div className="bav-stats-grid mb-9 border-t border-ink-10">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className="py-5"
                    style={{
                      paddingRight: i % 2 === 0 ? 24 : 0,
                      paddingLeft: i % 2 === 1 ? 24 : 0,
                      borderTop: i >= 2 ? '1px solid var(--ink-10)' : 'none',
                      borderLeft: i % 2 === 1 ? '1px solid var(--ink-10)' : 'none',
                    }}
                  >
                    <div className="mb-1.5 font-mono text-[26px] tracking-[-0.02em]">
                      {s.value}
                    </div>
                    <div className="bav-label text-ink-60">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Favourite build */}
              {b.favouriteBuild && (
                <div className="mb-9">
                  <div className="bav-label mb-3.5 text-ink-60">— Favourite build</div>
                  <blockquote className="m-0 border-l border-ink-10 pl-4">
                    <p className="m-0 font-display text-[17px] font-light italic leading-[1.55] text-ink">
                      &ldquo;{b.favouriteBuild}&rdquo;
                    </p>
                  </blockquote>
                </div>
              )}

              <Link
                href={`/shop?builder=${b.builderCode}`}
                className="bav-underline text-[14px] text-ink no-underline"
              >
                <span>All builds by {firstName}</span>
                <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products rail */}
      {products.length > 0 && (
        <section className="bg-paper-2">
          <div className="bav-page-pad mx-auto max-w-page px-12 py-24">
            <div className="mb-14 flex items-end justify-between">
              <div>
                <div className="bav-label mb-4 text-ink-60">
                  — Products by {firstName}
                </div>
                <h2 className="m-0 font-display text-[clamp(32px,4vw,52px)] font-light leading-[0.98] tracking-[-0.025em]">
                  Available <span className="bav-italic">now</span>.
                </h2>
              </div>
              <Link
                href={`/shop?builder=${b.builderCode}`}
                className="bav-underline text-[14px] text-ink no-underline"
              >
                <span>See all</span>
                <span className="arrow">→</span>
              </Link>
            </div>

            <div className="bav-products-rail">
              {products.map((p) => {
                const buildNumber = buildNumberFromSku(p.sku);
                const price = Number(p.priceGbp);
                const compareAt = p.compareAtGbp ? Number(p.compareAtGbp) : null;
                return (
                  <Link
                    key={p.productId}
                    href={`/product/${p.slug}`}
                    className="bav-tile block text-ink no-underline"
                  >
                    <div
                      className="bav-canvas relative mb-3.5"
                      style={{ aspectRatio: '4 / 5' }}
                    >
                      <div
                        className="bav-tile-num absolute inset-0 flex select-none items-center justify-center font-display text-[clamp(72px,8vw,120px)] font-light italic leading-none tracking-[-0.05em]"
                      >
                        №{buildNumber}
                      </div>
                    </div>
                    <div
                      className="mb-1.5 overflow-hidden text-[13px] font-medium leading-[1.3]"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {p.title}
                    </div>
                    <div className="flex items-baseline gap-2">
                      {compareAt && (
                        <span className="font-mono text-[11px] text-ink-30 line-through">
                          £{compareAt.toLocaleString('en-GB')}
                        </span>
                      )}
                      <span className="font-mono text-[15px]">
                        £{price.toLocaleString('en-GB')}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
