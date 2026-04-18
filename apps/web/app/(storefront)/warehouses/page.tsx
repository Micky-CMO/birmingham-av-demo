import type { Metadata } from 'next';
import { PageHero } from '@/components/storefront/PageHero';
import { GlassCard } from '@/components/ui';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Warehouses',
  description:
    'Birmingham AV operates three build and dispatch warehouse hubs inside the B postcode, keeping every PC, new or refurbished, tested and shipped locally.',
};
export const dynamic = 'force-dynamic';

export default async function WarehousesPage() {
  const nodes = await prisma.warehouseNode.findMany({
    where: { isActive: true },
    include: { _count: { select: { builders: true } } },
    orderBy: { nodeCode: 'asc' },
  });

  return (
    <>
      <PageHero
        eyebrow="Operations"
        title="Three hubs. One postcode."
        lead="Every build starts and ends inside the B postcode. No offshore assembly, no drop-shipped middleman."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {nodes.map((n) => {
            const addr = n.address as { line1?: string; city?: string; postcode?: string } | null;
            return (
              <GlassCard key={n.warehouseNodeId} className="p-8">
                <div className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">{n.nodeCode}</div>
                <h2 className="mt-3 font-display text-h2 font-semibold tracking-[-0.02em]">{n.locationName}</h2>
                <div className="mt-5 space-y-1 font-mono text-small text-ink-700 dark:text-ink-300">
                  <div>{addr?.line1}</div>
                  <div>{addr?.city}</div>
                  <div>{addr?.postcode}</div>
                </div>
                <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-ink-300/50 pt-4 font-mono text-caption dark:border-obsidian-500/40">
                  <div>
                    <dt className="text-ink-500">Capacity</dt>
                    <dd className="mt-0.5 text-body font-medium tabular-nums">{n.maxConcurrentBuilds}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Builders</dt>
                    <dd className="mt-0.5 text-body font-medium tabular-nums">{n._count.builders}</dd>
                  </div>
                </dl>
              </GlassCard>
            );
          })}
        </div>
      </section>
    </>
  );
}
