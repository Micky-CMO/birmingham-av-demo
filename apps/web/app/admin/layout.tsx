import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { AdminNav, AdminFooter } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = cookies();
  const session = store.get('bav_session')?.value;
  let email = 'staff@birminghamav.co.uk';
  let role = 'super_admin';
  let firstName: string | null = null;
  let lastName: string | null = null;
  if (session?.startsWith('user:')) {
    const userId = session.slice(5);
    const u = await prisma.user.findUnique({ where: { userId } }).catch(() => null);
    if (u) {
      email = u.email;
      role = u.role;
      firstName = u.firstName;
      lastName = u.lastName;
    }
  }

  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    email.slice(0, 2).toUpperCase();

  return (
    <div className="bav-admin-shell">
      <AdminNav initials={initials} role={role} />
      <main className="flex-1">{children}</main>
      <AdminFooter />
    </div>
  );
}
