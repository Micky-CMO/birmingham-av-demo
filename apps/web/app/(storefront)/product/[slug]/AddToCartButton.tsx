'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

export type AddToCartButtonProps = {
  productId: string;
  title: string;
  slug: string;
  pricePerUnitGbp: number;
  imageUrl: string | null;
  inStock: boolean;
  priceLabel: string;
  buildNumber?: string;
  conditionGrade?: string;
  builder?: { displayName: string; builderCode: string };
};

export function AddToCartButton(props: AddToCartButtonProps) {
  const add = useCartStore((s) => s.add);
  const openDrawer = useUiStore((s) => s.setCartOpen);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add({
      productId: props.productId,
      title: props.title,
      slug: props.slug,
      pricePerUnitGbp: props.pricePerUnitGbp,
      qty: 1,
      imageUrl: props.imageUrl,
      buildNumber: props.buildNumber,
      conditionGrade: props.conditionGrade,
      builder: props.builder,
    });
    openDrawer(true);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="mb-8 flex flex-col gap-3">
      <button type="button" onClick={onAdd} disabled={!props.inStock} className="bav-cta">
        {!props.inStock ? 'Out of stock' : added ? 'Added to cart' : `Add to cart — ${props.priceLabel}`}
      </button>
      <button type="button" className="bav-cta-secondary">
        Talk to a builder first
      </button>
    </div>
  );
}
