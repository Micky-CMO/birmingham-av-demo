import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button, GlassCard } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Your account',
  description:
    'Sign in to your Birmingham AV account to track orders, manage returns, update addresses, and set notification preferences.',
};
export const dynamic = 'force-dynamic';

export default function AccountPage() {
  // If a staff member is signed in, route them to the admin console instead.
  const isStaff = cookies().get('bav_staff')?.value === '1';
  if (isStaff) redirect('/admin/dashboard');

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-h1 font-display">Your account</h1>
      <p className="mt-2 text-ink-500">Sign in to view orders, returns, addresses, and notification preferences.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-h3 font-display">Orders</h2>
          <p className="mt-2 text-small text-ink-500">Track active orders, view invoices, request returns.</p>
          <Link href="/orders" className="mt-4 inline-block text-brand-green">View orders &rarr;</Link>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-h3 font-display">Addresses</h2>
          <p className="mt-2 text-small text-ink-500">Save shipping and billing addresses for one-click checkout.</p>
          <Link href="/account/addresses" className="mt-4 inline-block text-brand-green">Manage &rarr;</Link>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-h3 font-display">Notifications</h2>
          <p className="mt-2 text-small text-ink-500">Email and Telegram preferences for orders and returns.</p>
          <Link href="/account/notifications" className="mt-4 inline-block text-brand-green">Edit &rarr;</Link>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-h3 font-display">Security</h2>
          <p className="mt-2 text-small text-ink-500">Password, MFA, and active sessions.</p>
          <Link href="/account/security" className="mt-4 inline-block text-brand-green">Manage &rarr;</Link>
        </GlassCard>
      </div>

      <div className="mt-10 flex gap-3">
        <Link href="/auth/login"><Button>Sign in</Button></Link>
        <Link href="/auth/register"><Button variant="outline">Create account</Button></Link>
      </div>
    </div>
  );
}
