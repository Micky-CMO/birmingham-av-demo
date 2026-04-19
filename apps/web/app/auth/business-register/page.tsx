import type { Metadata } from 'next';
import { BusinessRegisterClient } from './BusinessRegisterClient';

export const metadata: Metadata = {
  title: 'Trade account application',
  description:
    'Apply for a Birmingham AV trade account — net-30 billing, a named account manager, bulk pricing and VAT invoicing on dispatch.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function BusinessRegisterPage() {
  return <BusinessRegisterClient />;
}
