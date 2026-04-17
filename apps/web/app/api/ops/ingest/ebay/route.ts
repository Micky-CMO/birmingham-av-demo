import { bad, handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

export async function POST() {
  try {
    await requireStaff();
    // Spawn pnpm ingest:ebay in a detached process; caller polls logs.
    exec('pnpm ingest:ebay').catch((err) => console.error('[ops] ingest failed', err));
    return ok({ queued: true });
  } catch (err) {
    return handleError(err);
  }
}
