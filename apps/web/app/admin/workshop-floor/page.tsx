import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Workshop floor · Admin',
};

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  queued: 'Queued',
  in_progress: 'On bench',
  qc: 'In QC',
  completed: 'Done',
  failed: 'Failed',
};

const STATUS_ORDER = ['queued', 'in_progress', 'qc', 'completed', 'failed'] as const;

function fmtElapsed(started: Date | null): string {
  if (!started) return '—';
  const mins = Math.floor((Date.now() - started.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function WorkshopFloorPage() {
  const [rows, builders, warehouses] = await Promise.all([
    prisma.buildQueue.findMany({
      where: { status: { in: ['queued', 'in_progress', 'qc'] } },
      include: {
        builder: { select: { builderCode: true, displayName: true, tier: true } },
        order: { select: { orderNumber: true, totalGbp: true } },
        warehouseNode: { select: { nodeCode: true, locationName: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.builder.findMany({
      where: { status: 'active' },
      include: {
        _count: {
          select: {
            buildQueues: {
              where: { status: { in: ['queued', 'in_progress', 'qc'] } },
            },
          },
        },
      },
      orderBy: { displayName: 'asc' },
    }),
    prisma.warehouseNode.findMany({ where: { isActive: true }, orderBy: { nodeCode: 'asc' } }),
  ]);

  const byStatus = STATUS_ORDER.reduce<Record<string, typeof rows>>((acc, s) => {
    acc[s] = rows.filter((r) => r.status === s);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-page px-6 py-16 md:px-12">
      <header className="mb-16 flex items-end justify-between border-b border-ink-10 pb-10">
        <div>
          <div className="bav-label mb-5 text-ink-60">— Admin · Workshop floor</div>
          <h1 className="m-0 font-display text-[56px] font-light leading-[1] tracking-[-0.025em]">
            {rows.length} builds <span className="bav-italic">in flight</span>.
          </h1>
        </div>
        <div className="bav-label text-ink-30">
          Last refresh · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      {/* Status columns */}
      <section className="mb-24 grid grid-cols-1 gap-0 border border-ink-10 md:grid-cols-3">
        {(['queued', 'in_progress', 'qc'] as const).map((status, idx) => (
          <div
            key={status}
            className={`p-6 md:p-8 ${idx < 2 ? 'border-b border-ink-10 md:border-b-0 md:border-r' : ''}`}
          >
            <div className="mb-6 flex items-baseline justify-between">
              <div className="bav-label text-ink-60">— {STATUS_LABEL[status]}</div>
              <div className="font-mono text-[24px] text-ink">
                {byStatus[status]?.length ?? 0}
              </div>
            </div>
            <ul className="m-0 list-none space-y-4 p-0">
              {byStatus[status]?.length === 0 && (
                <li className="text-[13px] text-ink-30">Nothing here.</li>
              )}
              {byStatus[status]?.slice(0, 12).map((r) => (
                <li key={r.buildQueueId} className="border-t border-ink-10 pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="bav-label mb-1 font-mono text-ink-30">
                        {r.order.orderNumber}
                      </div>
                      <div className="mb-1 font-display text-[16px] leading-[1.2] tracking-[-0.01em]">
                        {r.builder.displayName}
                      </div>
                      <div className="bav-label text-ink-60">
                        {r.warehouseNode.nodeCode} · P{r.priority}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bav-label mb-1 font-mono text-ink-60">
                        {fmtElapsed(r.startedAt)}
                      </div>
                      {r.estimatedMinutes && (
                        <div className="bav-label text-ink-30">
                          ETA {r.estimatedMinutes}m
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Builder load */}
      <section className="mb-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="bav-label mb-4 text-ink-60">— Builder load</div>
            <h2 className="m-0 font-display text-[36px] font-light tracking-[-0.025em]">
              {builders.length} active builders
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-ink-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {builders.map((b) => (
            <div
              key={b.builderId}
              className="bg-paper p-5"
            >
              <div className="bav-label mb-2 font-mono text-ink-30">{b.builderCode}</div>
              <div className="mb-3 font-display text-[15px] leading-[1.2] tracking-[-0.01em]">
                {b.displayName}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[24px] text-ink">
                  {b._count.buildQueues}
                </span>
                <span className="bav-label text-ink-60">in flight</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Warehouse nodes */}
      <section>
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="bav-label mb-4 text-ink-60">— Warehouse nodes</div>
            <h2 className="m-0 font-display text-[36px] font-light tracking-[-0.025em]">
              {warehouses.length} hubs
            </h2>
          </div>
        </div>
        <ul className="m-0 list-none divide-y divide-ink-10 border-y border-ink-10 p-0">
          {warehouses.map((w) => {
            const load = rows.filter((r) => r.warehouseNodeId === w.warehouseNodeId).length;
            return (
              <li key={w.warehouseNodeId} className="flex items-center justify-between py-5">
                <div>
                  <div className="bav-label mb-1 font-mono text-ink-30">{w.nodeCode}</div>
                  <div className="font-display text-[18px] tracking-[-0.015em]">
                    {w.locationName}
                  </div>
                </div>
                <div className="font-mono text-[18px] text-ink">{load} active</div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
