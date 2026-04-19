import { getBuilderSummary } from '@/lib/services/builders';
import { BuilderRoster } from '@/components/admin/BuilderRoster';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Builders · Admin',
  robots: { index: false, follow: false },
};

export default async function BuildersPage() {
  const summary = await getBuilderSummary();
  const builders = summary.items;
  const totalUnits = builders.reduce((a, b) => a + b.unitsSold90d, 0);

  return (
    <div
      className="min-h-screen bg-paper text-ink"
      style={{ padding: '48px 40px 96px' }}
    >
      <div className="mx-auto max-w-[1440px]">
        {/* page heading */}
        <div className="mb-10">
          <div className="bav-label mb-3 text-ink-60">— Builders</div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="m-0 font-display font-light"
              style={{
                fontSize: 'clamp(36px, 4vw, 56px)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                fontVariationSettings: "'opsz' 144",
              }}
            >
              {builders.length === 22 ? 'Twenty-two' : builders.length}{' '}
              <span className="bav-italic">in the workshop</span>.
            </h1>
            <div
              className="font-mono tabular-nums text-ink-30"
              style={{ fontSize: 12 }}
            >
              {builders.length} builders · {totalUnits} units · 90 days
            </div>
          </div>
        </div>

        <BuilderRoster builders={builders} />
      </div>
    </div>
  );
}
