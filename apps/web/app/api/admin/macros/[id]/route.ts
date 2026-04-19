import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = await parseBody(request, patchSchema);
    const updated = await prisma.supportMacro.update({
      where: { macroId: params.id },
      data: payload,
    });
    return ok({
      macro: {
        macroId: updated.macroId,
        title: updated.title,
        body: updated.body,
        tags: updated.tags,
        timesUsed: updated.timesUsed,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2025') {
      return bad(404, 'macro not found');
    }
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.supportMacro.delete({ where: { macroId: params.id } });
    return ok({ deleted: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2025') {
      return bad(404, 'macro not found');
    }
    return handleError(err);
  }
}
