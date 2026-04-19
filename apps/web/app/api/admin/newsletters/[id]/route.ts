import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  subject: z.string().trim().min(1).max(240).optional(),
  html: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  status: z.enum(['draft', 'scheduled', 'sent', 'paused']).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  recipientSegment: z.string().trim().max(60).optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff();
    const r = await prisma.newsletterCampaign.findUnique({
      where: { campaignId: params.id },
    });
    if (!r) return bad(404, 'campaign not found');
    return ok({
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
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return bad(403, 'insufficient privileges');
    }
    const body = await parseBody(request, PatchSchema);
    const target = await prisma.newsletterCampaign.findUnique({
      where: { campaignId: params.id },
    });
    if (!target) return bad(404, 'campaign not found');

    const data: Record<string, unknown> = {};
    if (body.subject !== undefined) data.subject = body.subject;
    if (body.html !== undefined) data.html = body.html;
    if (body.text !== undefined) data.text = body.text;
    if (body.status !== undefined) data.status = body.status;
    if (body.scheduledFor !== undefined)
      data.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    if (body.recipientSegment !== undefined) data.recipientSegment = body.recipientSegment;

    const updated = await prisma.newsletterCampaign.update({
      where: { campaignId: params.id },
      data,
    });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.marketing.newsletter.update',
      entityType: 'newsletter_campaign',
      entityId: params.id,
      payload: { changes: body },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ campaignId: updated.campaignId, status: updated.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff();
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return bad(403, 'insufficient privileges');
    }
    const target = await prisma.newsletterCampaign.findUnique({
      where: { campaignId: params.id },
    });
    if (!target) return bad(404, 'campaign not found');

    await prisma.newsletterCampaign.delete({ where: { campaignId: params.id } });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.marketing.newsletter.delete',
      entityType: 'newsletter_campaign',
      entityId: params.id,
      payload: { subject: target.subject },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ deleted: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
