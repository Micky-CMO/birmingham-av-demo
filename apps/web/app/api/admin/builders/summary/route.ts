import { getBuilderSummary } from '@/lib/services/builders';
import { handleError, ok } from '@/lib/json';

export async function GET() {
  try {
    const data = await getBuilderSummary();
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
