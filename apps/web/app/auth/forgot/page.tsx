import type { Metadata } from 'next';
import { ForgotPageClient } from './ForgotPageClient';

export const metadata: Metadata = {
  title: 'Forgotten password',
  description:
    'Reset your Birmingham AV password. Enter your email and we will send a one-time link that expires in an hour.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function ForgotPage() {
  return <ForgotPageClient />;
}
