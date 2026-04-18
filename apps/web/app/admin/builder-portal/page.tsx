import { prisma } from '@/lib/db';
import { Badge, GlassCard } from '@/components/ui';
import { BuildActionButtons } from '@/components/admin/BuildActionButtons';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Builder portal' };

const STATUS_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'positive' | 'critical'> = {
  queued: 'info',
  in_progress: 'warning',
  qc: 'warning',
  completed: 'positive',
  failed: 'critical',
};

export default async function BuilderPortalPage() {
  const active = await prisma.buildQueue.findMany({
    where: { status: { in: ['queued', 'in_progress', 'qc'] } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    include: {
      builder: true,
      warehouseNode: true,
      order: { include: { user: true, items: { include: { product: true } } } },
    },
    take: 40,
  });

  const byBuilder = new Map<string, typeof active>();
  for (const a of active) {
    const k = a.builderId;
    if (!byBuilder.has(k)) byBuilder.set(k, []);
    byBuilder.get(k)!.push(a);
  }

  return (
    <div>
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-caption uppercase tracking-[0.3em] text-ink-500">Factory floor</p>
          <h1 className="mt-1 font-display text-h2 font-semibold tracking-[-0.02em]">Builder portal</h1>
          <p className="mt-1 text-small text-ink-500">
            {active.length} active build{active.length === 1 ? '' : 's'} across {byBuilder.size} builder
            {byBuilder.size === 1 ? '' : 's'}.
          </p>
        </div>
      </header>

      {active.length === 0 ? (
        <GlassCard className="mt-8 p-16 text-center">
          <p className="font-display text-h3 font-semibold">Queue empty.</p>
          <p className="mt-2 text-small text-ink-500">
            No outstanding builds. New orders get assigned automatically as customers check out.
          </p>
        </GlassCard>
      ) : (
        <div className="mt-6 space-y-6">
          {[...byBuilder.entries()].map(([builderId, items]) => {
            const b = items[0]!.builder;
            return (
              <GlassCard key={builderId} className="overflow-hidden p-0">
                <header className="flex items-center justify-between border-b border-ink-300/50 px-6 py-4 dark:border-obsidian-500/40">
                  <div>
                    <div className="font-display text-h3 font-semibold">{b.displayName}</div>
                    <div className="font-mono text-caption text-ink-500">
                      {b.builderCode} · {items[0]!.warehouseNode.nodeCode} · Quality {Number(b.qualityScore).toFixed(2)}
                    </div>
                  </div>
                  <span className="font-mono text-caption uppercase tracking-[0.2em] text-ink-500">
                    {items.length} build{items.length === 1 ? '' : 's'}
                  </span>
                </header>
                <ul className="divide-y divide-ink-300/40 dark:divide-obsidian-500/30">
                  {items.map((q) => {
                    const orderItems = q.order.items;
                    const customer =
                      [q.order.user.firstName, q.order.user.lastName].filter(Boolean).join(' ') || q.order.user.email;
                    return (
                      <li key={q.buildQueueId} className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-small font-medium">{q.order.orderNumber}</span>
                              <Badge tone={STATUS_TONE[q.status] ?? 'neutral'}>{q.status.replace('_', ' ')}</Badge>
                              <span className="font-mono text-caption text-ink-500">
                                {q.estimatedMinutes ?? 0} min est · priority {q.priority}
                              </span>
                            </div>
                            <p className="mt-1 text-small text-ink-500">{customer}</p>
                            <ul className="mt-3 space-y-1">
                              {orderItems.map((i) => (
                                <li key={i.orderItemId} className="flex items-baseline gap-3 text-small">
                                  <span className="font-mono text-caption text-ink-500">×{i.qty}</span>
                                  <span className="font-medium">{i.product.title}</span>
                                  <span className="font-mono text-caption text-ink-500">
                                    {formatGbp(Number(i.pricePerUnitGbp))}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <BuildActionButtons buildQueueId={q.buildQueueId} status={q.status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
