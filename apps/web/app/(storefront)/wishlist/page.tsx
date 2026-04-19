import type { Metadata } from 'next';
import { WishlistClient } from './WishlistClient';

export const metadata: Metadata = {
  title: 'Wishlist',
  description:
    'Saved-for-later products on your Birmingham AV account. Move an item to cart, or keep it parked here until the moment is right.',
};
export const dynamic = 'force-dynamic';

export default function WishlistPage() {
  return <WishlistClient />;
}
