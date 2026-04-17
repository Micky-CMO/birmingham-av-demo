import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseBody } from '@/lib/json';

const Schema = z.object({
  action: z.enum(['approve', 'reject', 'escalate']),
  resolutionNotes: z.string().max(2000).optional(),
  refundAmountGbp: z.number().min(0).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await parseBody(request, Schema);
    const status = body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'escalated';
    const r = await prisma.return.update({
      where: { returnId: params.id },
      data: {
        status: status as 'approved',
        resolutionNotes: body.resolutionNotes ?? null,
        approvedAt: status === 'approved' ? new Date() : null,
        ...(body.refundAmountGbp !== undefined ? { refundAmountGbp: body.refundAmountGbp } : {}),
      },
    });
    return ok({ returnId: r.returnId, status: r.status });
  } catch (err) {
    return handleError(err);
  }
}
