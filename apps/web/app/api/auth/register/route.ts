import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return bad(409, 'email already registered');
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, 12),
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
      },
    });
    return ok({ userId: user.userId, email: user.email }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
