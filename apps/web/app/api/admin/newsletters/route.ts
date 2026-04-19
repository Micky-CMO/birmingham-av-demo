import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  subject: z.string().trim().min(1).max(240),
  html: z.string().min(1),
  text: z.string().min(1),
  status: z.enum(['draft', 'scheduled', 'sent', 'paused']).optional().default('draft'),
  scheduledFor: z.string().datetime().nullable().optional(),
  recipientSegment: z.string().trim().max(60).optional().default('all'),
});

export async function GET() {
  try {
    await requireStaff();
    const rows = await prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return ok({
      items: rows.map((r) => ({
        campaignId: r.campaignId,
        subject: r.subject,
        html: r.html,
        text: r.text,
        status: r.status,
        scheduledFor: r.scheduledFor?.toISOString() ?? null,
        sentAt: r.sentAt?.toISOString() ?? null,
        recipientSegment: r.recipientSegment,
        sentCount: r.sentCount,
        openCount: r.openCount,
        clickCount: r.clickCount,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return new Response(
        JSON.stringify({ error: { message: 'insufficient privileges' } }),
        { status: 403 }
      );
    }
    const body = await parseBody(request, CreateSchema);

    const created = await prisma.newsletterCampaign.create({
      data: {
        subject: body.subject,
        html: body.html,
        text: body.text,
        status: body.status,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
        recipientSegment: body.recipientSegment,
        createdBy: staff.userId,
      },
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.marketing.newsletter.create',
      entityType: 'newsletter_campaign',
      entityId: created.campaignId,
      payload: { subject: created.subject, status: created.status },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    // TODO: actual send/scheduling (Resend batches via cron).
    return ok({ campaignId: created.campaignId, status: created.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
