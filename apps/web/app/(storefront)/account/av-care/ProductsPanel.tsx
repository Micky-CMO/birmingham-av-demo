'use client';

import { useState } from 'react';
import Link from 'next/link';

export type CoveredProduct = {
  productId: string;
  title: string;
  buildNumber: string | null;
  purchasedAt: string | null;
};

export function ProductsPanel({ products }: { products: CoveredProduct[] }) {
  const [open, setOpen] = useState(true);

  return (
    <section style={{ marginBottom: 96 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        style={{
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid var(--ink-10)',
          borderBottom: open ? 'none' : '1px solid var(--ink-10)',
          padding: '24px 0',
          cursor: 'pointer',
        }}
      >
        <div className="flex items-baseline gap-4">
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — Products covered
          </span>
          <span className="font-mono" style={{ fontSize: 14, color: 'var(--ink-30)' }}>
            {products.length}
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 13, color: 'var(--ink-60)' }}>
          {open ? '— Collapse' : '+ Expand'}
        </span>
      </button>

      {open && (
        <div>
          {products.map((p) => (
            <div
              key={p.productId}
              className="grid items-center border-b border-ink-10"
              style={{
                gridTemplateColumns: '64px 1fr 140px 24px',
                gap: 20,
                padding: '20px 0',
              }}
            >
              <div
                className="bav-canvas grid place-items-center"
                style={{ width: 64, height: 64 }}
              >
                <div
                  className="font-display"
                  style={{ fontSize: 22, fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}
                >
                  <span
                    className="bav-italic"
                    style={{ fontSize: '0.7em', color: 'var(--ink-30)', marginRight: 1 }}
                  >
                    №
                  </span>
                  <span className="bav-italic">{p.buildNumber ?? '—'}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>{p.title}</div>
                {p.purchasedAt && (
                  <div
                    className="font-mono"
                    style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 4 }}
                  >
                    Purchased {p.purchasedAt}
                  </div>
                )}
              </div>
              <Link
                href={`/account/av-care/claim/new?product=${p.productId}`}
                className="bav-underline"
                style={{ fontSize: 12, color: 'var(--ink-60)', textDecoration: 'none' }}
              >
                Start a claim
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
              <span style={{ color: 'var(--ink-30)' }} aria-hidden="true">→</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
