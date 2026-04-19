import { z } from 'zod';
import { prisma } from '@/lib/db';
import { handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
});

export async function GET() {
  try {
    const rows = await prisma.supportMacro.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok({
      macros: rows.map((m) => ({
        macroId: m.macroId,
        title: m.title,
        body: m.body,
        tags: m.tags,
        createdBy: m.createdBy,
        timesUsed: m.timesUsed,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseBody(request, createSchema);
    const created = await prisma.supportMacro.create({
      data: {
        title: payload.title,
        body: payload.body,
        tags: payload.tags,
      },
    });
    return ok(
      {
        macro: {
          macroId: created.macroId,
          title: created.title,
          body: created.body,
          tags: created.tags,
          timesUsed: created.timesUsed,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
