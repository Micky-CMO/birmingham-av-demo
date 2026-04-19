import { prisma } from '@/lib/db';

/**
 * Returns the live count of units being assembled on the workshop floor.
 * Powers the "Workshop active — N builds in progress" pulse in the nav
 * and footer. Silently returns 0 on DB failure so the shell never breaks.
 */
export async function activeBuildCount(): Promise<number> {
  try {
    return await prisma.buildQueue.count({ where: { status: 'in_progress' } });
  } catch {
    return 0;
  }
}
