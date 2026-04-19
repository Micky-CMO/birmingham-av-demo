import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'The builders',
  description:
    'Every machine that leaves the Birmingham AV workshop has one of their names on it. Meet the builders.',
};
export const dynamic = 'force-dynamic';

const TIER_LABEL: Record<string, string> = {
  elite: 'Elite',
  preferred: 'Preferred',
  standard: 'Standard',
  probation: 'Probation',
};

export default async function BuildersPage() {
  const builders = await prisma.builder.findMany({
    where: { status: 'active' },
    orderBy: { displayName: 'asc' },
  });

  return (
    <main>
      {/* Page header */}
      <section className="border-b border-ink-10">
        <div className="bav-page-pad mx-auto max-w-page px-12 py-20 md:py-24">
          <div className="bav-fade">
            <div className="bav-label mb-7 text-ink-60">— The people behind the builds</div>

            <h1 className="m-0 mb-9 font-display text-[clamp(56px,8vw,120px)] font-light leading-[0.94] tracking-[-0.035em]">
              The <span className="bav-italic">builders</span>.
            </h1>

            <p className="m-0 mb-7 max-w-[640px] text-[19px] leading-[1.55] text-ink-60">
              Every machine that leaves the workshop has one of their names on it. Not a
              department, not a ticket number — a person with a builder code, a list of
              specialities, and a particular way of running cable.
            </p>

            <div className="bav-label text-ink-30">
              {builders.length} builders · Birmingham, United Kingdom
            </div>
          </div>
        </div>
      </section>

      {/* Roster grid */}
      <section>
        <div className="bav-page-pad mx-auto max-w-page px-12 py-24 md:py-32">
          {builders.length === 0 ? (
            <p className="text-center text-[15px] text-ink-60">
              The bench is warming up. Roster drops weekly — check back soon.
            </p>
          ) : (
            <div className="bav-roster-grid">
              {builders.map((b) => {
                const estYear = new Date(b.joinedAt).getFullYear();
                const years = b.yearsBuilding;
                const isFeaturedTier = b.tier === 'elite' || b.tier === 'preferred';
                return (
                  <Link
                    key={b.builderId}
                    href={`/builders/${b.builderCode}`}
                    className="bav-builder-card"
                  >
                    {/* Portrait — ink canvas 4:5 */}
                    <div
                      className="bav-ink-canvas bav-builder-portrait relative mb-6"
                      style={{ aspectRatio: '4 / 5' }}
                    >
                      <div className="bav-label absolute left-3.5 top-3.5 text-[rgba(247,245,242,0.40)]">
                        {b.builderCode}
                      </div>
                      <div className="bav-label absolute bottom-3.5 right-3.5 text-[rgba(247,245,242,0.40)]">
                        Est. {estYear}
                      </div>
                      {isFeaturedTier && (
                        <div className="bav-label absolute bottom-3.5 left-3.5 text-[rgba(247,245,242,0.40)]">
                          {TIER_LABEL[b.tier] ?? b.tier}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="mb-1.5 font-display text-[22px] leading-[1.15] tracking-[-0.015em]">
                      {b.displayName}
                    </div>

                    {/* Role line */}
                    <div className="bav-label mb-2.5 text-ink-60">
                      Builder · {years} {years === 1 ? 'year' : 'years'}
                    </div>

                    {/* Bio — two-line clamp */}
                    {b.bio && (
                      <div
                        className="mb-2.5 overflow-hidden text-[13px] leading-[1.5] text-ink-60"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {b.bio}
                      </div>
                    )}

                    {/* Specialities */}
                    {b.specialities.length > 0 && (
                      <div className="bav-label text-ink-30">
                        Builds: {b.specialities.join(' · ')}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
