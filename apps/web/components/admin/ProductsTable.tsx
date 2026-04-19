'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type AdminProduct = {
  productId: string;
  sku: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'out_of_stock' | 'archived';
  updated: string; // ISO
};

const STATUS_STYLE: Record<
  AdminProduct['status'],
  { label: string; dot: string }
> = {
  active: { label: 'Active', dot: 'var(--accent)' },
  out_of_stock: { label: 'Out of stock', dot: '#C17817' },
  archived: { label: 'Archived', dot: 'var(--ink-30)' },
};

function gbp(n: number) {
  return `£${n.toFixed(2)}`;
}

export function ProductsTable({
  products,
  categories,
  lastSyncAt,
}: {
  products: AdminProduct[];
  categories: string[];
  lastSyncAt: string | null;
}) {
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated_desc');
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  const perPage = 10;

  const filtered = useMemo(() => {
    let list = [...products];
    if (categoryFilter !== 'All') list = list.filter((p) => p.category === categoryFilter);
    if (statusFilter !== 'All') {
      const key = statusFilter.toLowerCase().replace(/ /g, '_');
      list = list.filter((p) => p.status === key);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (sort === 'updated_desc') list.sort((a, b) => b.updated.localeCompare(a.updated));
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'stock_asc') list.sort((a, b) => a.stock - b.stock);
    return list;
  }, [products, categoryFilter, statusFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selectedSkus.has(p.sku));

  function toggleAllVisible() {
    const next = new Set(selectedSkus);
    if (allVisibleSelected) visible.forEach((p) => next.delete(p.sku));
    else visible.forEach((p) => next.add(p.sku));
    setSelectedSkus(next);
  }
  function toggleSku(sku: string) {
    const next = new Set(selectedSkus);
    if (next.has(sku)) next.delete(sku);
    else next.add(sku);
    setSelectedSkus(next);
  }
  async function bulk(action: string) {
    // TODO: wire bulk actions to /api/admin/products/bulk
    setFlashMsg(`${action} · ${selectedSkus.size} product${selectedSkus.size === 1 ? '' : 's'}`);
    setSelectedSkus(new Set());
    setTimeout(() => setFlashMsg(null), 2400);
  }
  async function resyncEbay() {
    setSyncing(true);
    try {
      // TODO: wire eBay re-sync to /api/admin/products/sync-ebay
      await new Promise((r) => setTimeout(r, 1200));
      setFlashMsg('eBay resync complete');
    } finally {
      setSyncing(false);
      setTimeout(() => setFlashMsg(null), 2400);
    }
  }

  const activeCount = products.filter((p) => p.status === 'active').length;
  const oosCount = products.filter((p) => p.status === 'out_of_stock').length;

  return (
    <>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 48px 16px' }}>
        <div className="mb-7 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="bav-label mb-3" style={{ color: 'var(--ink-30)' }}>
              / products
            </div>
            <h1
              className="m-0 font-light"
              style={{
                fontFamily: 'var(--font-fraunces), Georgia, serif',
                fontSize: 52,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Product <span className="bav-italic">catalogue</span>
            </h1>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={resyncEbay}
              disabled={syncing}
              className="bav-cta-secondary"
              style={{ width: 'auto', padding: '12px 22px', fontSize: 11 }}
            >
              {syncing ? 'Resyncing…' : 'Re-sync from eBay'}
            </button>
            <button
              type="button"
              className="bav-cta"
              style={{ width: 'auto', padding: '13px 24px', fontSize: 11 }}
            >
              New product
            </button>
          </div>
        </div>

        <div
          className="grid grid-cols-4"
          style={{
            borderTop: '1px solid var(--ink-10)',
            borderBottom: '1px solid var(--ink-10)',
          }}
        >
          {[
            ['Total SKUs', String(products.length).padStart(2, '0')],
            ['Active', String(activeCount).padStart(2, '0')],
            ['Out of stock', String(oosCount).padStart(2, '0')],
            ['Last eBay sync', lastSyncAt ? new Date(lastSyncAt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'],
          ].map(([k, v], i) => (
            <div
              key={k}
              style={{
                padding: '20px 24px',
                borderRight: i < 3 ? '1px solid var(--ink-10)' : 'none',
              }}
            >
              <div className="bav-label mb-2" style={{ color: 'var(--ink-30)' }}>
                {k}
              </div>
              <div className="font-mono" style={{ fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 48px 0' }}>
        <div
          className="flex items-center gap-6 pb-5 flex-wrap"
          style={{ borderBottom: '1px solid var(--ink-10)' }}
        >
          <div
            style={{
              flex: '1 1 260px',
              minWidth: 220,
              borderBottom: '1px solid var(--ink-10)',
              paddingBottom: 4,
            }}
          >
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search SKU or title…"
              className="w-full"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                padding: '8px 0',
                fontSize: 14,
                fontFamily: 'var(--font-instrument-sans), system-ui, sans-serif',
              }}
            />
          </div>
          <FilterSelect
            label="Category"
            value={categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}
            options={['All', ...categories]}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={['All', 'Active', 'Out of stock', 'Archived']}
          />
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'updated_desc', label: 'Recently updated' },
              { value: 'price_desc', label: 'Price, high → low' },
              { value: 'price_asc', label: 'Price, low → high' },
              { value: 'stock_asc', label: 'Stock, low → high' },
            ]}
          />
        </div>
      </div>

      {selectedSkus.size > 0 && (
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 48px' }}>
          <div
            className="flex justify-between items-center mt-4"
            style={{ padding: '14px 20px', background: 'var(--ink)', color: 'var(--paper)' }}
          >
            <span className="bav-label" style={{ color: 'var(--paper)' }}>
              {selectedSkus.size} selected
            </span>
            <div className="flex gap-5">
              {['Activate', 'Deactivate', 'Archive'].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => bulk(a + 'd')}
                  className="bav-label"
                  style={{ color: 'var(--paper)' }}
                >
                  {a}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedSkus(new Set())}
                className="bav-label"
                style={{ color: 'rgba(247,245,242,0.6)' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {flashMsg && (
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 48px' }}>
          <div
            className="mt-3"
            style={{
              padding: '12px 20px',
              background: 'var(--paper-2)',
              borderLeft: '2px solid var(--accent)',
            }}
          >
            <span className="bav-label" style={{ color: 'var(--ink)' }}>
              {flashMsg}
            </span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 48px' }}>
        <table style={{ fontSize: 13, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--ink-10)' }}>
              <th style={{ textAlign: 'left', padding: '14px 16px 14px 0', width: 40 }}>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  style={{ accentColor: 'var(--ink)' }}
                />
              </th>
              {['SKU', 'Title', 'Category', 'Price', 'Stock', 'Status', 'Updated', ''].map((h, i) => (
                <th
                  key={i}
                  className="bav-label"
                  style={{
                    textAlign: i === 3 || i === 4 ? 'right' : 'left',
                    padding: '14px 16px',
                    color: 'var(--ink-60)',
                    fontWeight: 400,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const s = STATUS_STYLE[p.status];
              const checked = selectedSkus.has(p.sku);
              return (
                <tr
                  key={p.productId}
                  className="bav-admin-row"
                  style={{
                    borderBottom: '1px solid var(--ink-10)',
                    background: checked ? 'var(--paper-2)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '18px 16px 18px 0' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSku(p.sku)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ accentColor: 'var(--ink)' }}
                    />
                  </td>
                  <td
                    className="font-mono text-[12px]"
                    style={{ padding: '18px 16px', color: 'var(--ink-60)' }}
                  >
                    {p.sku}
                  </td>
                  <td style={{ padding: '18px 16px', color: 'var(--ink)' }}>{p.title}</td>
                  <td style={{ padding: '18px 16px', color: 'var(--ink-60)' }}>{p.category}</td>
                  <td
                    className="font-mono"
                    style={{
                      padding: '18px 16px',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {gbp(p.price)}
                  </td>
                  <td
                    className="font-mono"
                    style={{
                      padding: '18px 16px',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      color: p.stock === 0 ? '#C17817' : p.stock < 5 ? 'var(--ink)' : 'var(--ink-60)',
                    }}
                  >
                    {String(p.stock).padStart(2, '0')}
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                      <span className="bav-status-dot" style={{ background: s.dot }} />
                      {s.label}
                    </span>
                  </td>
                  <td
                    className="font-mono text-[12px]"
                    style={{ padding: '18px 16px', color: 'var(--ink-60)' }}
                  >
                    {new Date(p.updated).toLocaleDateString('en-GB')}
                  </td>
                  <td style={{ padding: '18px 0 18px 16px', textAlign: 'right' }}>
                    <Link
                      href={`/admin/products/${p.sku}`}
                      className="bav-underline text-[12px]"
                    >
                      Edit <span className="arrow">→</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 64, textAlign: 'center', color: 'var(--ink-30)', fontSize: 13 }}>
                  No products match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-6">
          <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
            Showing{' '}
            {String(Math.min((page - 1) * perPage + 1, Math.max(filtered.length, 1))).padStart(2, '0')} –{' '}
            {String(Math.min(page * perPage, filtered.length)).padStart(2, '0')} of{' '}
            {String(filtered.length).padStart(2, '0')}
          </span>
          <div className="flex gap-4 items-center">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bav-label"
              style={{
                color: page === 1 ? 'var(--ink-30)' : 'var(--ink-60)',
                cursor: page === 1 ? 'default' : 'pointer',
              }}
            >
              ← Prev
            </button>
            <span className="bav-label" style={{ color: 'var(--ink)' }}>
              {String(page).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="bav-label"
              style={{
                color: page === totalPages ? 'var(--ink-30)' : 'var(--ink-60)',
                cursor: page === totalPages ? 'default' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <div className="flex gap-2.5 items-center">
      <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: '1px solid var(--ink-10)',
          background: 'transparent',
          padding: '8px 12px',
          fontSize: 13,
          fontFamily: 'var(--font-instrument-sans), system-ui, sans-serif',
          outline: 'none',
          color: 'var(--ink)',
        }}
      >
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}
