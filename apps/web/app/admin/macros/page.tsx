import { prisma } from '@/lib/db';
import { MacrosClient, type MacroRow, type MacroCategory } from '@/components/admin/MacrosClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Macros · Admin' };

export default async function AdminMacrosPage() {
  const rows = await prisma.supportMacro.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const macros: MacroRow[] = rows.map((m) => ({
    macroId: m.macroId,
    title: m.title,
    body: m.body,
    tags: m.tags,
    timesUsed: m.timesUsed,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  // Categories derived from tag frequency across macros.
  const tagCounts = new Map<string, number>();
  for (const m of macros) {
    for (const t of m.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const categories: MacroCategory[] = [
    { slug: 'all', label: 'All', count: macros.length },
    ...Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([slug, count]) => ({ slug, label: slug, count })),
  ];

  const totalUses = macros.reduce((acc, m) => acc + m.timesUsed, 0);

  return (
    <main className="min-h-screen bg-paper text-ink" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '48px 48px 32px',
          borderBottom: '1px solid var(--ink-10)',
        }}
      >
        <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>— Admin · Support · Canned responses</div>
        <div className="flex items-baseline justify-between gap-10">
          <div>
            <h1
              className="m-0 font-display font-light"
              style={{
                fontSize: 'clamp(40px, 4vw, 56px)',
                letterSpacing: '-0.01em',
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Macros.
            </h1>
            <p
              className="mt-4 max-w-[640px] text-[14px] leading-[1.55]"
              style={{ color: 'var(--ink-60)' }}
            >
              Shortcut phrases for common tickets. Variables in{' '}
              <span className="font-mono" style={{ background: 'var(--paper-2)', padding: '2px 6px' }}>
                {'{{ }}'}
              </span>{' '}
              get replaced at send.
            </p>
          </div>
        </div>
        <div
          className="mt-6 font-mono tabular-nums"
          style={{ fontSize: 11, color: 'var(--ink-60)' }}
        >
          {macros.length} macros · {categories.length - 1} tags · {totalUses} total uses
        </div>
      </div>

      <MacrosClient initialMacros={macros} categories={categories} />
    </main>
  );
}
