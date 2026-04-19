import { prisma } from '@/lib/db';
import { WebhookLogClient, type WebhookEventRow } from '@/components/admin/WebhookLogClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Webhooks · Admin' };

export default async function AdminWebhooksPage() {
  const [rows, counts] = await Promise.all([
    prisma.webhookEvent.findMany({
      orderBy: { receivedAt: 'desc' },
      take: 200,
    }),
    prisma.webhookEvent.groupBy({ by: ['source'], _count: { _all: true } }),
  ]);

  const events: WebhookEventRow[] = rows.map((r) => ({
    eventId: r.eventId,
    source: r.source,
    eventType: r.eventType,
    signatureValid: r.signatureValid,
    processed: r.processed,
    errorMessage: r.errorMessage,
    receivedAt: r.receivedAt.toISOString(),
    processedAt: r.processedAt ? r.processedAt.toISOString() : null,
    payload: r.payload,
  }));

  const totalBySource: Record<string, number> = {};
  for (const c of counts) totalBySource[c.source] = c._count._all;

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ padding: '48px 48px 32px', borderBottom: '1px solid var(--ink-10)' }}>
        <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>
          — Admin · Developers · Event log
        </div>
        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(40px, 4vw, 56px)',
            letterSpacing: '-0.01em',
            fontVariationSettings: "'opsz' 144",
          }}
        >
          Webhooks.
        </h1>
        <p
          className="mt-4 max-w-[700px] text-[14px] leading-[1.55]"
          style={{ color: 'var(--ink-60)' }}
        >
          Inbound webhook deliveries from Stripe, PayPal, and couriers. Click a row to open the
          signed payload.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 font-mono tabular-nums" style={{ fontSize: 11, color: 'var(--ink-60)' }}>
          <span>{events.length} events shown</span>
          {Object.entries(totalBySource).map(([src, count]) => (
            <span key={src}>
              {src}: {count}
            </span>
          ))}
        </div>
      </div>

      <WebhookLogClient events={events} />
    </main>
  );
}
