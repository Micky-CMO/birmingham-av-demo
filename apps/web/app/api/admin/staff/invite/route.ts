import { headers } from 'next/headers';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { sendEmail } from '@/lib/email';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  email: z.string().email().max(254),
  role: z.enum(['support_staff', 'admin', 'super_admin']),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
});

function randomTempPassword(): string {
  // URL-safe, no 'i/l/o/0/1' ambiguity. 14 chars gives ~80 bits from base64url.
  return crypto.randomBytes(12).toString('base64url').replace(/[_-]/g, 'A').slice(0, 14);
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    // Only admins and super-admins may invite new staff.
    if (!['admin', 'super_admin'].includes(staff.role)) {
      return bad(403, 'insufficient privileges to invite staff');
    }

    const body = await parseBody(request, Schema);

    // Only super-admins may promote to super_admin.
    if (body.role === 'super_admin' && staff.role !== 'super_admin') {
      return bad(403, 'only super-admin can create another super-admin');
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return bad(409, 'user with this email already exists');

    const tempPassword = randomTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const created = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: body.role,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
      },
      select: { userId: true, email: true, role: true },
    });

    const inviteHtml = `
      <p>Hi${body.firstName ? ` ${body.firstName}` : ''},</p>
      <p>You have been invited to join the Birmingham AV admin console as <strong>${body.role.replace('_', ' ')}</strong>.</p>
      <p>Temporary password: <code>${tempPassword}</code></p>
      <p>Sign in at <a href="https://birmingham-av.com/auth/login">birmingham-av.com/auth/login</a> and change your password immediately.</p>
    `;
    const emailSent = await sendEmail(body.email, 'Birmingham AV admin invite', inviteHtml);

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.staff.invite',
      entityType: 'user',
      entityId: created.userId,
      payload: { email: body.email, role: body.role, emailSent },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({
      user: created,
      emailSent,
      // When Resend is not configured (dev), return the temp password so the admin
      // can share it manually. In prod with RESEND_API_KEY set, this is always null.
      tempPassword: emailSent ? null : tempPassword,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
