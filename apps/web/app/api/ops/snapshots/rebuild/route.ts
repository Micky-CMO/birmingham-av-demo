import { handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { builderSnapshotWorker } from '@/lib/workers/builder-snapshots';

export async function POST() {
  try {
    await requireStaff();
    await builderSnapshotWorker();
    return ok({ rebuilt: true });
  } catch (err) {
    return handleError(err);
  }
}
