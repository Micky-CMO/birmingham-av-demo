import { prisma } from '@/lib/db';
import { connectMongo } from '@/lib/db';
import { handleError, ok } from '@/lib/json';

export async function GET() {
  try {
    const checks: Record<string, 'ok' | 'fail'> = {};
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'fail';
    }
    try {
      await connectMongo();
      checks.mongo = 'ok';
    } catch {
      checks.mongo = 'fail';
    }
    checks.anthropic = process.env.ANTHROPIC_API_KEY ? 'ok' : 'fail';
    checks.stripe = process.env.STRIPE_SECRET_KEY ? 'ok' : 'fail';
    const overall = Object.values(checks).every((v) => v === 'ok') ? 'ok' : 'degraded';
    return ok({ overall, checks });
  } catch (err) {
    return handleError(err);
  }
}
