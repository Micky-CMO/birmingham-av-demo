'use client';

import { useMemo, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { ProductTile, type TileProduct } from './ProductTile';

export type CategoryOption = { slug: string; name: string; count: number };
export type BuilderOption = { builderCode: string; displayName: string; tier: string };

type Sort = 'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'bestseller';

const SORT_OPTIONS: Array<{ value: Sort; label: string }> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'bestseller', label: 'Bestseller' },
];

const CONDITIONS = ['New', 'Like New', 'Excellent', 'Very Good', 'Good'];
const WARRANTY_OPTS: Array<{ val: number; label: string }> = [
  { val: 12, label: '12 mo' },
  { val: 24, label: '24 mo' },
  { val: 36, label: '36 mo' },
];

type Filters = {
  inStock: boolean;
  onSale: boolean;
  newOnly: boolean;
  priceMin: number;
  priceMax: number;
  conditions: string[];
  builderQuery: string;
  builders: string[];
  warranty: number[];
  category: string | null;
};

export type ShopViewProps = {
  products: TileProduct[];
  categories: CategoryOption[];
  builders: BuilderOption[];
  priceCeiling: number;
  defaultCategory?: string;
  pageSize?: number;
};

export function ShopView({
  products,
  categories,
  builders,
  priceCeiling,
  defaultCategory,
  pageSize = 24,
}: ShopViewProps) {
  const [filters, setFilters] = useState<Filters>({
    inStock: false,
    onSale: false,
    newOnly: false,
    priceMin: 0,
    priceMax: priceCeiling,
    conditions: [],
    builderQuery: '',
    builders: [],
    warranty: [],
    category: defaultCategory ?? null,
  });
  const [sort, setSort] = useState<Sort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = <K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };
  const toggleArr = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  const clearAll = () =>
    setFilters({
      inStock: false,
      onSale: false,
      newOnly: false,
      priceMin: 0,
      priceMax: priceCeiling,
      conditions: [],
      builderQuery: '',
      builders: [],
      warranty: [],
      category: defaultCategory ?? null,
    });

  const hasActive =
    filters.inStock ||
    filters.onSale ||
    filters.newOnly ||
    filters.priceMin > 0 ||
    filters.priceMax < priceCeiling ||
    filters.conditions.length > 0 ||
    filters.builders.length > 0 ||
    filters.warranty.length > 0 ||
    (defaultCategory ? false : filters.category !== null);

  const filtered = useMemo(() => {
    const cat = filters.category;
    return products
      .filter((p) => {
        if (cat && p.categorySlug !== cat) return false;
        if (filters.inStock && p.stockQty === 0) return false;
        if (filters.onSale && !p.compareAtGbp) return false;
        if (filters.newOnly && p.conditionGrade !== 'New') return false;
        if (p.priceGbp < filters.priceMin || p.priceGbp > filters.priceMax) return false;
        if (filters.conditions.length && !filters.conditions.includes(p.conditionGrade)) return false;
        if (filters.builders.length && !filters.builders.includes(p.builderCode)) return false;
        if (filters.warranty.length && !filters.warranty.includes(p.warrantyMonths)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === 'price-asc') return a.priceGbp - b.priceGbp;
        if (sort === 'price-desc') return b.priceGbp - a.priceGbp;
        if (sort === 'bestseller') return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        return 0; // 'newest' and 'relevance' preserve incoming order
      });
  }, [products, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const builderSearch = filters.builderQuery.toLowerCase();
  const filteredBuilders = builders.filter(
    (b) =>
      b.displayName.toLowerCase().includes(builderSearch) ||
      b.builderCode.toLowerCase().includes(builderSearch),
  );

  const Sidebar = () => (
    <div>
      {/* Toggles */}
      <div className="pb-5">
        <div className="flex flex-col gap-[14px]">
          <HairlineCheckbox checked={filters.inStock} onChange={() => update('inStock', !filters.inStock)} label="In stock only" />
          <HairlineCheckbox checked={filters.onSale} onChange={() => update('onSale', !filters.onSale)} label="On sale only" />
          <HairlineCheckbox checked={filters.newOnly} onChange={() => update('newOnly', !filters.newOnly)} label="New only" />
        </div>
      </div>

      {/* Category — omitted when defaultCategory is fixed */}
      {!defaultCategory && (
        <FilterGroup label="Category">
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {categories.map((c) => {
              const active = filters.category === c.slug;
              return (
                <li key={c.slug} className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => update('category', active ? null : c.slug)}
                    className={`bav-hover-opa cursor-pointer border-none bg-transparent p-0 text-left text-[13px] ${active ? 'text-ink' : 'text-ink-60'}`}
                  >
                    {c.name}
                  </button>
                  <span className="font-mono text-[10px] tabular-nums text-ink-30">
                    {String(c.count).padStart(2, '0')}
                  </span>
                </li>
              );
            })}
          </ul>
        </FilterGroup>
      )}

      {/* Price */}
      <FilterGroup label="Price">
        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          value={[filters.priceMin, filters.priceMax]}
          min={0}
          max={priceCeiling}
          step={100}
          onValueChange={(v: number[]) => {
            const min = v[0] ?? 0;
            const max = v[1] ?? priceCeiling;
            setFilters((f) => ({ ...f, priceMin: min, priceMax: max }));
            setPage(1);
          }}
          minStepsBetweenThumbs={1}
        >
          <Slider.Track className="relative h-px w-full bg-ink-10">
            <Slider.Range className="absolute h-px bg-ink" />
          </Slider.Track>
          <Slider.Thumb className="block h-3 w-3 bg-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-green" aria-label="Minimum price" />
          <Slider.Thumb className="block h-3 w-3 bg-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-green" aria-label="Maximum price" />
        </Slider.Root>
        <div className="mt-3 flex justify-between">
          <span className="font-mono text-[11px] tabular-nums text-ink-60">
            £{filters.priceMin.toLocaleString('en-GB')}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-ink-60">
            £{filters.priceMax.toLocaleString('en-GB')}
          </span>
        </div>
      </FilterGroup>

      {/* Condition */}
      <FilterGroup label="Condition">
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <HairlinePill
              key={c}
              selected={filters.conditions.includes(c)}
              onClick={() => update('conditions', toggleArr(filters.conditions, c))}
            >
              {c}
            </HairlinePill>
          ))}
        </div>
      </FilterGroup>

      {/* Builder */}
      <FilterGroup label="Builder">
        <input
          type="text"
          placeholder="Filter builders"
          value={filters.builderQuery}
          onChange={(e) => update('builderQuery', e.target.value)}
          className="mb-[10px] w-full border border-ink-10 bg-transparent px-[10px] py-2 text-[12px] text-ink outline-none"
        />
        <div className="flex max-h-[200px] flex-col gap-2 overflow-y-auto">
          {filteredBuilders.map((b) => {
            const checked = filters.builders.includes(b.builderCode);
            return (
              <label key={b.builderCode} className="flex cursor-pointer select-none items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => update('builders', toggleArr(filters.builders, b.builderCode))}
                  />
                  <span
                    aria-hidden
                    className={`h-[14px] w-[14px] flex-shrink-0 border transition-colors ${checked ? 'border-ink bg-ink' : 'border-ink-30 bg-transparent'}`}
                  />
                  <span className="font-mono text-[10px] tabular-nums text-ink-30">{b.builderCode}</span>
                  <span className="text-[13px] text-ink">{b.displayName}</span>
                </div>
                <span className="bav-label text-[9px] text-ink-30">{b.tier}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      {/* Warranty */}
      <FilterGroup label="Warranty">
        <div className="flex gap-2">
          {WARRANTY_OPTS.map((w) => (
            <HairlinePill
              key={w.val}
              selected={filters.warranty.includes(w.val)}
              onClick={() => update('warranty', toggleArr(filters.warranty, w.val))}
            >
              {w.label}
            </HairlinePill>
          ))}
        </div>
      </FilterGroup>

      {/* Clear all */}
      {hasActive && (
        <div className="border-t border-ink-10 pt-5">
          <button
            type="button"
            onClick={clearAll}
            className="bav-underline cursor-pointer border-none bg-transparent p-0 text-[13px] text-ink-60"
          >
            <span>Clear all filters</span>
            <span className="arrow">→</span>
          </button>
        </div>
      )}
    </div>
  );

  const empty = filtered.length === 0;

  return (
    <>
      {/* Header — full title when viewing the full catalogue, thin sort bar
          when on a category page (hero above already has the category name). */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-6 pb-8 pt-14 md:px-12">
          {!defaultCategory && (
            <>
              <div className="bav-label mb-4 text-ink-60">— The catalogue</div>
            </>
          )}
          <div className="flex flex-wrap items-end justify-between gap-5">
            {!defaultCategory ? (
              <div>
                <div className="mb-4 font-display font-light leading-[0.95] tracking-[-0.03em] text-[clamp(32px,4vw,56px)]">
                  Shop.
                </div>
                <div className="bav-label text-ink-60">
                  {products.length} builds · {builders.length} builders · {categories.length} categories
                </div>
              </div>
            ) : (
              <div className="bav-label text-ink-60">
                Showing {filtered.length} of {products.filter((p) => p.categorySlug === defaultCategory).length} builds
              </div>
            )}

            {/* Sort dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-[10px] border-none bg-transparent p-0 text-ink-60"
              >
                <span className="bav-label">
                  Sort / {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                </span>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {sortOpen && (
                <div className="bav-sort-panel">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        setSort(o.value);
                        setSortOpen(false);
                        setPage(1);
                      }}
                      className={`block w-full cursor-pointer border-none px-4 py-3 text-left text-[13px] text-ink ${sort === o.value ? 'bg-ink-10' : 'bg-transparent'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <div className="mx-auto max-w-page px-6 pb-32 md:px-12">
        <div className="pt-12">
          {/* Mobile Filters button */}
          <div className="mb-6 flex gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex cursor-pointer items-center gap-[10px] border border-ink-10 bg-transparent px-5 py-[10px] text-[12px] text-ink"
            >
              Filters{hasActive ? ' (active)' : ''}
            </button>
          </div>

          <div className="flex items-start gap-16">
            <aside className="sticky top-20 hidden w-[280px] flex-shrink-0 max-h-[calc(100vh-100px)] overflow-y-auto md:block">
              <Sidebar />
            </aside>

            <div className="min-w-0 flex-1">
              {empty ? (
                <div className="py-20 text-center">
                  <h2 className="mb-4 font-display font-light tracking-[-0.025em] text-[40px]">
                    Nothing to show.
                  </h2>
                  <p className="mb-8 text-[16px] text-ink-60">
                    Try clearing one or two filters, or browse the full catalogue.
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="bav-underline cursor-pointer border-none bg-transparent p-0 text-[14px] text-ink"
                  >
                    <span>Clear all filters</span>
                    <span className="arrow">→</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
                    {pageItems.map((p) => (
                      <ProductTile key={p.productId} product={p} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-20 flex items-center justify-center gap-8">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                        className={`cursor-pointer border-none bg-transparent p-0 ${page === 1 ? 'cursor-default text-ink-30' : 'text-ink'}`}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M19 12H5" />
                          <path d="m12 19-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="font-mono text-[14px] tabular-nums">
                        {String(page).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Next page"
                        className={`cursor-pointer border-none bg-transparent p-0 ${page === totalPages ? 'cursor-default text-ink-30' : 'text-ink'}`}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[90] bg-[rgba(23,20,15,0.4)]"
          />
          <div className="bav-filter-sheet">
            <div className="sticky top-0 flex items-center justify-between border-b border-ink-10 bg-paper px-6 py-5">
              <span className="font-display text-[24px] tracking-[-0.015em]">Filters</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="cursor-pointer border-none bg-transparent p-1 text-ink"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="max-h-[calc(85vh-80px)] overflow-y-auto px-6 pb-8">
              <Sidebar />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function FilterGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-ink-10 py-5">
      {label && <div className="bav-label mb-[14px] text-ink-60">{label}</div>}
      {children}
    </div>
  );
}

function HairlineCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span
        aria-hidden
        className={`h-[14px] w-[14px] flex-shrink-0 border transition-colors ${checked ? 'border-ink bg-ink' : 'border-ink-30 bg-transparent'}`}
      />
      <span className="bav-label text-ink-60">{label}</span>
    </label>
  );
}

function HairlinePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 cursor-pointer border px-[14px] py-[6px] font-mono text-[11px] uppercase tracking-[0.1em] tabular-nums transition-all ${
        selected
          ? 'border-ink bg-ink text-paper'
          : 'border-ink-10 bg-transparent text-ink-60 hover:border-ink-30'
      }`}
    >
      {children}
    </button>
  );
}
