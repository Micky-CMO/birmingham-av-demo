import type { Metadata } from 'next';
import { GiftCardsClient } from './GiftCardsClient';

export const metadata: Metadata = {
  title: 'Gift cards',
  description:
    'Birmingham AV gift cards — redeemable across the entire catalogue, delivered by email, valid for twenty-four months. No expiry tricks, no fine print.',
};
export const dynamic = 'force-dynamic';

export default function GiftCardsPage() {
  return <GiftCardsClient />;
}
