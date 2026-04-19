import type { Metadata } from 'next';
import { AdminLoginPageClient } from './AdminLoginPageClient';

export const metadata: Metadata = {
  title: 'Staff sign in · Birmingham AV',
  description: 'Staff-only sign-in gate for the Birmingham AV admin console.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const buildHash =
    process.env.NEXT_PUBLIC_BUILD_SHA?.slice(0, 7) ?? 'a4c8f12';
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';
  const region = process.env.VERCEL_REGION ?? 'eu-west-2';

  return (
    <AdminLoginPageClient
      buildHash={buildHash}
      environment={environment}
      region={region}
    />
  );
}
