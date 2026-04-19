import type { Metadata } from 'next';
import { QuoteRequestClient } from './QuoteRequestClient';

export const metadata: Metadata = {
  title: 'Request a quote',
  description:
    'For orders above five units, bespoke builds, bulk refurbs, fleet rollouts. An account manager reads every enquiry personally.',
};
export const dynamic = 'force-dynamic';

export default function QuotePage() {
  return <QuoteRequestClient />;
}
