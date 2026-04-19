import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your profile · Admin' };

export default async function AdminProfilePage() {
  const sess = await getCurrentUser();
  if (!sess) redirect('/auth/login?next=/admin/profile');

  const user = await prisma.user.findUnique({
    where: { userId: sess.userId },
    select: {
      userId: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) redirect('/auth/login?next=/admin/profile');

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'H';
  const joined = user.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const lastLogin = user.lastLoginAt
    ? user.lastLoginAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <main className="mx-auto max-w-[960px] px-6 py-16 md:px-12">
      <header className="mb-12 border-b border-ink-10 pb-8">
        <Link href="/admin/dashboard" className="bav-label bav-hover-opa text-ink-60 no-underline">
          ← Admin
        </Link>
        <div className="bav-label mt-8 text-ink-60">— Admin · Your profile</div>
        <h1 className="m-0 mt-4 font-display text-[48px] font-light leading-[1] tracking-[-0.025em]">
          {user.firstName ?? 'Your'} <span className="bav-italic">profile</span>.
        </h1>
      </header>

      <section className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-[120px_1fr]">
        <div
          className="flex h-[120px] w-[120px] items-center justify-center bg-paper-2 font-mono text-[32px] text-ink"
          style={{ borderRadius: '50%' }}
          aria-hidden
        >
          {initials}
        </div>
        <div>
          <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <dt className="bav-label mb-2 text-ink-60">Name</dt>
              <dd className="font-display text-[18px] tracking-[-0.01em]">
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="bav-label mb-2 text-ink-60">Email</dt>
              <dd className="font-mono text-[14px]">{user.email}</dd>
            </div>
            <div>
              <dt className="bav-label mb-2 text-ink-60">Phone</dt>
              <dd className="font-mono text-[14px]">{user.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="bav-label mb-2 text-ink-60">Role</dt>
              <dd className="font-mono text-[14px] capitalize">
                {user.role.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="bav-label mb-2 text-ink-60">Joined</dt>
              <dd className="font-mono text-[14px]">{joined}</dd>
            </div>
            <div>
              <dt className="bav-label mb-2 text-ink-60">Last sign-in</dt>
              <dd className="font-mono text-[14px]">{lastLogin}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-t border-ink-10 pt-10">
        <div className="bav-label mb-8 text-ink-60">— Account actions</div>
        <ul className="list-none space-y-0 border-y border-ink-10 p-0">
          <li className="flex items-center justify-between border-b border-ink-10 py-5 last:border-0">
            <div>
              <div className="font-display text-[18px] tracking-[-0.01em]">
                Edit account details
              </div>
              <div className="bav-label mt-1 text-ink-60">
                Name · email · phone
              </div>
            </div>
            <Link
              href="/account/settings"
              className="bav-underline text-[14px] text-ink no-underline"
            >
              Open <span className="arrow font-mono">→</span>
            </Link>
          </li>
          <li className="flex items-center justify-between border-b border-ink-10 py-5 last:border-0">
            <div>
              <div className="font-display text-[18px] tracking-[-0.01em]">
                Security — passwords and passkeys
              </div>
              <div className="bav-label mt-1 text-ink-60">
                Manage authentication devices
              </div>
            </div>
            <Link
              href="/account/security"
              className="bav-underline text-[14px] text-ink no-underline"
            >
              Open <span className="arrow font-mono">→</span>
            </Link>
          </li>
          <li className="flex items-center justify-between border-b border-ink-10 py-5 last:border-0">
            <div>
              <div className="font-display text-[18px] tracking-[-0.01em]">
                Admin settings
              </div>
              <div className="bav-label mt-1 text-ink-60">
                System-level preferences for the staff console
              </div>
            </div>
            <Link
              href="/admin/settings"
              className="bav-underline text-[14px] text-ink no-underline"
            >
              Open <span className="arrow font-mono">→</span>
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
