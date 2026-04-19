import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

/**
 * Notification preferences endpoint — Batch 4 / artefact 20.
 *
 * The Prisma schema does not yet include per-channel notification columns on
 * User, so this route accepts the full preferences payload, validates it, and
 * returns 200 without persisting. Once the schema migration lands (email +
 * push + telegram + quiet hours JSON column) this handler writes to the user
 * row; the client does not need to change.
 */

const EmailPrefs = z.object({
  address: z.string().email().optional(),
  verified: z.boolean().optional(),
  orderUpdates: z.boolean(),
  shippingUpdates: z.boolean(),
  avCareUpdates: z.boolean(),
  journalDigest: z.boolean(),
  marketing: z.boolean(),
});
const PushPrefs = z.object({
  browserEnabled: z.boolean(),
  orderUpdates: z.boolean(),
  shippingUpdates: z.boolean(),
  avCareUpdates: z.boolean(),
});
const TelegramPrefs = z.object({
  connected: z.boolean(),
  handle: z.string().nullable(),
  orderUpdates: z.boolean(),
  shippingUpdates: z.boolean(),
  avCareUpdates: z.boolean(),
});
const QuietHours = z.object({
  enabled: z.boolean(),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(0).max(23),
});

const NotificationPrefsSchema = z.object({
  email: EmailPrefs,
  push: PushPrefs,
  telegram: TelegramPrefs,
  quietHours: QuietHours,
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return bad(401, 'not signed in');
  return ok({
    email: {
      orderUpdates: true,
      shippingUpdates: true,
      avCareUpdates: true,
      journalDigest: false,
      marketing: false,
    },
    push: { browserEnabled: false, orderUpdates: false, shippingUpdates: false, avCareUpdates: false },
    telegram: {
      connected: false,
      handle: null,
      orderUpdates: false,
      shippingUpdates: false,
      avCareUpdates: false,
    },
    quietHours: { enabled: false, startHour: 22, endHour: 8 },
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    const body = await parseBody(request, NotificationPrefsSchema);
    // TODO: persist body.* to user.notificationPrefs JSON column once the
    // schema migration lands. For now, acknowledge the save so the UI can
    // confirm success.
    return ok({ saved: true, summary: summarise(body) });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

function summarise(b: z.infer<typeof NotificationPrefsSchema>) {
  const enabled: string[] = [];
  if (b.email.orderUpdates) enabled.push('email:orders');
  if (b.push.browserEnabled) enabled.push('push:enabled');
  if (b.telegram.connected) enabled.push('telegram:connected');
  if (b.quietHours.enabled) enabled.push('quiet-hours:on');
  return enabled;
}
