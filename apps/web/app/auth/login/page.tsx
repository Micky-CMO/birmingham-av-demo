import type { Metadata } from 'next';
import { LoginPageClient } from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to your Birmingham AV account to track orders, manage returns, and review every build on your workbench.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginPageClient />;
}
