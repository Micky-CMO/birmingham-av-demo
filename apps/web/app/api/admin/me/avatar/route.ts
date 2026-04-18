import { headers } from 'next/headers';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { prisma } from '@/lib/db';
import { bad, handleError, ok } from '@/lib/json';
import { requireStaff } from '@/lib/session';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
// Allow multipart/form-data uploads. Next.js 14 App Router handles these natively via Request.formData().

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return bad(400, 'expected multipart/form-data');
    }
    const file = form.get('file');
    if (!(file instanceof File)) return bad(400, 'file field missing');
    if (file.size === 0) return bad(400, 'empty file');
    if (file.size > MAX_BYTES) return bad(413, 'file exceeds 2 MB limit');
    const ext = ALLOWED_MIME[file.type];
    if (!ext) return bad(415, `unsupported image type: ${file.type}`);

    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(dir, { recursive: true });
    const filename = `${staff.userId}.${ext}`;
    await writeFile(join(dir, filename), bytes);

    // Cache-buster ensures stale browser caches refresh after upload.
    const avatarUrl = `/uploads/avatars/${filename}?v=${Date.now()}`;
    await prisma.user.update({ where: { userId: staff.userId }, data: { avatarUrl } });

    const hdrs = headers();
    await writeAudit({
      actorUserId: staff.userId,
      action: 'admin.settings.avatar.update',
      entityType: 'user',
      entityId: staff.userId,
      payload: { size: file.size, mime: file.type },
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    });

    return ok({ avatarUrl });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
