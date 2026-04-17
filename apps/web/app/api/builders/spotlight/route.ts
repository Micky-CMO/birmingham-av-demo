import { getSpotlightBuilder } from '@/lib/services/builders';
import { bad, handleError, ok } from '@/lib/json';

export async function GET() {
  try {
    const b = await getSpotlightBuilder();
    if (!b) return bad(404, 'no spotlight');
    return ok(b);
  } catch (err) {
    return handleError(err);
  }
}
