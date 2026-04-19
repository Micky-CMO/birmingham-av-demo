import type { Metadata } from 'next';
import { RegisterPageClient } from './RegisterPageClient';

export const metadata: Metadata = {
  title: 'Create an account',
  description:
    'Create a Birmingham AV account. Track every build, keep warranty and returns in one place, and start a return in under sixty seconds.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return <RegisterPageClient />;
}
