import type { Metadata } from 'next';
import { ResetPageClient } from './ResetPageClient';

export const metadata: Metadata = {
  title: 'Set a new password',
  description:
    'Set a new password for your Birmingham AV account. The reset link is single-use and expires in one hour.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function ResetPage() {
  return <ResetPageClient />;
}
