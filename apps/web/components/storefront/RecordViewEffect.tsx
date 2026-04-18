'use client';

import { useEffect } from 'react';
import { recordView } from './RecentlyViewed';

/**
 * Tiny client component that records a product view on mount.
 * Rendered on product pages to populate the Recently Viewed list.
 */
export function RecordViewEffect({
  productId,
  slug,
  title,
  priceGbp,
  imageUrl,
}: {
  productId: string;
  slug: string;
  title: string;
  priceGbp: number;
  imageUrl: string | null;
}) {
  useEffect(() => {
    recordView({ productId, slug, title, priceGbp, imageUrl });
  }, [productId, slug, title, priceGbp, imageUrl]);
  return null;
}
