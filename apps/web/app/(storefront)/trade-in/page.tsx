import type { Metadata } from 'next';
import { TradeInClient } from './TradeInClient';

export const metadata: Metadata = {
  title: 'Trade-in',
  description:
    'Trade in your old computer, laptop, or monitor for a cash offer or Birmingham AV store credit. No obligation. Free collection from anywhere in the United Kingdom.',
};

export const dynamic = 'force-static';

export default function TradeInPage() {
  return <TradeInClient />;
}
