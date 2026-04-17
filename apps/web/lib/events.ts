/**
 * Event dispatcher. In production, publishes to AWS EventBridge bus `bav-main`.
 * In local dev, logs to console and enqueues BullMQ workers for the listed events.
 *
 * Events enumerated in SPEC.md section 11.
 */

export type BavEvent =
  | 'bav.orders.created'
  | 'bav.orders.paid'
  | 'bav.orders.shipped'
  | 'bav.orders.delivered'
  | 'bav.orders.refunded'
  | 'bav.builds.completed'
  | 'bav.returns.created'
  | 'bav.returns.ai_flagged'
  | 'bav.support.ticket_opened'
  | 'bav.support.escalated'
  | 'bav.catalog.product_synced'
  | 'bav.builders.snapshot_due';

export async function publishEvent(event: BavEvent, payload: Record<string, unknown>): Promise<void> {
  const entry = {
    Source: 'bav.web',
    DetailType: event,
    EventBusName: 'bav-main',
    Detail: JSON.stringify(payload),
    Time: new Date(),
  };

  if (!process.env.AWS_ACCESS_KEY_ID) {
    // Local dev — log + trigger local worker
    console.log('[events]', event, payload);
    const { dispatchLocalWorker } = await import('./workers/dispatcher');
    await dispatchLocalWorker(event, payload);
    return;
  }

  try {
    const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
    const client = new EventBridgeClient({ region: process.env.AWS_REGION ?? 'eu-west-2' });
    await client.send(new PutEventsCommand({ Entries: [entry] }));
  } catch (err) {
    console.error('[events] EventBridge failed, falling back to local worker', err);
    const { dispatchLocalWorker } = await import('./workers/dispatcher');
    await dispatchLocalWorker(event, payload);
  }
}
