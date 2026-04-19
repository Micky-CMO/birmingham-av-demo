import { z } from 'zod';
import { cookies } from 'next/headers';
import { handleError, ok, parseBody } from '@/lib/json';
import { createQrBatch } from '@/lib/services/inventory';

const Body = z.object({
  prefix: z
    .string()
    .trim()
    .min(1)
    .max(24)
    .regex(/^[A-Z0-9-]+$/, 'prefix must be uppercase alphanumerics and dashes')
    .default('BAV-INV'),
  startNumber: z.coerce.number().int().min(1),
  count: z.coerce.number().int().min(1).max(500),
});

function currentUserId(): string | undefined {
  const session = cookies().get('bav_session')?.value;
  return session?.startsWith('user:') ? session.slice(5) : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Body);
    const { batch, pdfUrl } = await createQrBatch({
      prefix: body.prefix,
      startNumber: body.startNumber,
      count: body.count,
      createdBy: currentUserId(),
    });
    return ok({
      batchId: batch.batchId,
      prefix: batch.prefix,
      startNumber: batch.startNumber,
      count: batch.count,
      pdfUrl,
    });
  } catch (err) {
    return handleError(err);
  }
}
