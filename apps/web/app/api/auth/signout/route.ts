import { cookies } from 'next/headers';
import { ok } from '@/lib/json';

export async function POST() {
  const store = cookies();
  store.delete('bav_session');
  store.delete('bav_staff');
  return ok({ ok: true });
}
