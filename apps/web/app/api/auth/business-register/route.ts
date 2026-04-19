import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bavEmail } from '@/lib/email/send';
import { bad, handleError, ok, parseBody } from '@/lib/json';

export const dynamic = 'force-dynamic';

/**
 * Trade account application (Batch 11 / A71).
 *
 * Creates a User (if the email is new) plus a BusinessAccount row flagged
 * pending_review. An admin later approves the application and assigns an
 * account manager; no Stripe or credit decisioning happens here.
 */

const SpendBand = z.enum(['under_1k', '1k_5k', '5k_25k', 'over_25k']);

const Schema = z.object({
  companyName: z.string().min(1).max(200),
  vatNumber: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  companyNumber: z.string().trim().min(1).max(32),
  billingLine1: z.string().min(1).max(200),
  billingLine2: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  billingCity: z.string().min(1).max(120),
  billingPostcode: z.string().min(1).max(16),
  billingCountry: z.string().min(1).max(80),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(4).max(32),
  monthlySpend: SpendBand,
  agree: z.literal(true),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, Schema);
    const email = body.email.trim().toLowerCase();

    const existingAccount = await prisma.businessAccount.findFirst({
      where: { user: { email } },
    });
    if (existingAccount) return bad(409, 'A business account is already on file for this email.');

    // Find or create the owning User. New users get a random password; the
    // approval email will prompt them to set a real one via the usual reset flow.
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const randomPass = randomBytes(18).toString('base64url');
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(randomPass, 12),
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
        },
      });
    }

    const businessAccount = await prisma.businessAccount.create({
      data: {
        userId: user.userId,
        companyName: body.companyName,
        vatNumber: body.vatNumber ?? null,
        companyRegNumber: body.companyNumber,
        billingAddress: {
          line1: body.billingLine1,
          line2: body.billingLine2 ?? null,
          city: body.billingCity,
          postcode: body.billingPostcode.toUpperCase(),
          country: body.billingCountry,
        },
        estimatedMonthlySpendBand: body.monthlySpend,
        status: 'pending_review',
        // TODO: account manager assignment is a manual admin step until we build
        // a round-robin assigner. creditLimitGbp stays at 0 until approved.
      },
    });

    await bavEmail
      .businessApplicationReceived(email, {
        contactFirstName: body.firstName,
        companyName: body.companyName,
      })
      .catch((err) => {
        console.error('[business-register] email send failed', err);
      });

    return ok(
      {
        businessAccountId: businessAccount.businessAccountId,
        status: businessAccount.status,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
