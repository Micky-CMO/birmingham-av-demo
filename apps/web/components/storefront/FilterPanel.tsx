'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassCard } from '@/components/ui';
import { cn } from '@/lib/cn';

type Option = { value: string; label: string };

const SORTS: Option[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'bestseller', label: 'Bestseller' },
];

export type FilterPanelProps = {
  categories: Array<{ slug: string; name: string }>;
  conditions?: string[];
  showCategoryFilter?: boolean;
  cpuFamilies?: string[];
  gpuFamilies?: string[];
  ramSizes?: number[];
  builders?: Array<{ builderCode: string; displayName: string }>;
  priceCeiling?: number;
};

export function FilterPanel(props: FilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const search = useSearchParams();

  // Active filter count for the mobile trigger badge — cheap to compute
  // here so the trigger row doesn't need to receive state from the body.
  const priceCeiling = props.priceCeiling ?? 5000;
  const activeCount = useMemo(() => {
    const q = search.get('q') ?? '';
    const cat = search.get('category') ?? '';
    const cond = search.get('condition') ?? '';
    const cpu = search.get('cpuFamily') ?? '';
    const gpu = search.get('gpuFamily') ?? '';
    const builder = search.get('builderCode') ?? '';
    const inStock = search.get('inStockOnly') === 'true';
    const minP = Number(search.get('minPrice') ?? 0) > 0;
    const maxP = Number(search.get('maxPrice') ?? priceCeiling) < priceCeiling;
    const minR = Number(search.get('minRamGb') ?? 0) > 0;
    return (
      [q, cat, cond, cpu, gpu, builder].filter(Boolean).length +
      (inStock ? 1 : 0) +
      (minP ? 1 : 0) +
      (maxP ? 1 : 0) +
      (minR ? 1 : 0)
    );
  }, [search, priceCeiling]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile trigger — visible below lg. Sits at the top of the shop grid. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          className="flex h-11 w-full items-center justify-between gap-3 rounded-md border border-ink-300/60 bg-white/70 px-4 text-small font-medium text-ink-900 shadow-glass-light backdrop-blur-sm transition-colors hover:bg-white dark:border-obsidian-500/60 dark:bg-obsidian-900/70 dark:text-ink-50 dark:hover:bg-obsidian-900"
        >
          <span className="inline-flex items-center gap-2">
            <FilterIcon />
            Filters &amp; sort
          </span>
          {activeCount > 0 && (
            <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-brand-green px-2 py-0.5 text-caption font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block">
        <FilterPanelBody {...props} />
      </aside>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-ink-900/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            role="dialog"
            aria-label="Filters"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-ink-300/60 bg-white shadow-glass-light dark:border-obsidian-500/60 dark:bg-obsidian-900 dark:shadow-glass-dark"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex items-center justify-between border-b border-ink-300/60 px-4 py-3 dark:border-obsidian-500/60">
                <h2 className="font-display text-lg font-semibold">Filters</h2>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-obsidian-800 dark:hover:text-ink-50"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <FilterPanelBody {...props} layout="sheet" onApply={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-ink-300/60 bg-white px-4 py-3 dark:border-obsidian-500/60 dark:bg-obsidian-900">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-md bg-brand-green px-4 text-small font-semibold text-white shadow-ring-green hover:bg-brand-green-600"
                >
                  Show results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FilterPanelBody({
  categories,
  conditions = [],
  showCategoryFilter = true,
  cpuFamilies = [],
  gpuFamilies = [],
  ramSizes = [],
  builders = [],
  priceCeiling = 5000,
  layout = 'sidebar',
  onApply,
}: FilterPanelProps & { layout?: 'sidebar' | 'sheet'; onApply?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = useMemo(
    () => ({
      category: search.get('category') ?? '',
      condition: search.get('condition') ?? '',
      minPrice: Number(search.get('minPrice') ?? 0),
      maxPrice: Number(search.get('maxPrice') ?? priceCeiling),
      cpuFamily: search.get('cpuFamily') ?? '',
      gpuFamily: search.get('gpuFamily') ?? '',
      minRamGb: Number(search.get('minRamGb') ?? 0),
      builderCode: search.get('builderCode') ?? '',
      inStockOnly: search.get('inStockOnly') === 'true',
      sort: search.get('sort') ?? 'relevance',
      q: search.get('q') ?? '',
    }),
    [search, priceCeiling],
  );

  const [maxPriceLocal, setMaxPriceLocal] = useState(current.maxPrice);

  const setParam = useCallback(
    (next: Record<string, string | number | boolean | null>) => {
      const params = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === '' || v === false || v === 0) params.delete(k);
        else params.set(k, String(v));
      }
      params.delete('page'); // reset pagination on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, search],
  );

  function reset() {
    startTransition(() => router.push(pathname));
    onApply?.();
  }

  const activeCount =
    [current.category, current.condition, current.cpuFamily, current.gpuFamily, current.builderCode, current.q].filter(
      Boolean,
    ).length +
    (current.inStockOnly ? 1 : 0) +
    (current.minPrice > 0 ? 1 : 0) +
    (current.maxPrice < priceCeiling ? 1 : 0) +
    (current.minRamGb > 0 ? 1 : 0);

  const isSheet = layout === 'sheet';

  return (
    <div
      className={cn(
        'space-y-3 transition-opacity duration-240 sm:space-y-4',
        !isSheet && 'sticky top-[88px] h-fit',
        isPending && 'opacity-60',
      )}
    >
      {!isSheet && (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-caption uppercase tracking-widest text-ink-500">Filters</h2>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <span className="rounded-sm bg-brand-green-100 px-1.5 py-0.5 font-mono text-caption text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green-400">
                  {activeCount} active
                </span>
              )}
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="font-mono text-caption text-ink-500 underline-offset-2 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {isSheet && activeCount > 0 && (
        <div className="flex items-center justify-between text-caption text-ink-500">
          <span>{activeCount} active</span>
          <button
            type="button"
            onClick={reset}
            className="font-mono uppercase tracking-widest text-brand-green hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <Card sheet={isSheet}>
        <FieldLabel>Search</FieldLabel>
        <input
          type="search"
          defaultValue={current.q}
          placeholder="Search products"
          onChange={(e) => {
            const v = e.target.value;
            const handle = setTimeout(() => setParam({ q: v }), 350);
            return () => clearTimeout(handle);
          }}
          className="mt-2 h-11 w-full rounded-md border border-ink-300 bg-white px-3 text-small placeholder:text-ink-500 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:border-obsidian-500 dark:bg-obsidian-900"
        />
      </Card>

      <Card sheet={isSheet}>
        <FieldLabel>Sort by</FieldLabel>
        <select
          value={current.sort}
          onChange={(e) => setParam({ sort: e.target.value })}
          className="mt-2 h-11 w-full rounded-md border border-ink-300 bg-white px-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Card>

      <Card sheet={isSheet}>
        <FieldLabel>Price</FieldLabel>
        <div className="mt-2 flex items-baseline justify-between font-mono text-caption text-ink-500">
          <span>&pound;0</span>
          <span className="text-ink-900 dark:text-ink-50">&pound;{maxPriceLocal.toLocaleString('en-GB')}</span>
        </div>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={50}
          value={maxPriceLocal}
          onChange={(e) => setMaxPriceLocal(Number(e.target.value))}
          onMouseUp={(e) => setParam({ maxPrice: Number((e.target as HTMLInputElement).value) })}
          onTouchEnd={(e) => setParam({ maxPrice: Number((e.target as HTMLInputElement).value) })}
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-100 accent-brand-green dark:bg-obsidian-800"
        />
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            defaultValue={current.minPrice || ''}
            onBlur={(e) => setParam({ minPrice: Number(e.target.value) || 0 })}
            className="h-10 w-full rounded-md border border-ink-300 bg-white px-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
          />
          <span className="text-ink-500">&ndash;</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            defaultValue={current.maxPrice < priceCeiling ? current.maxPrice : ''}
            onBlur={(e) => setParam({ maxPrice: Number(e.target.value) || 0 })}
            className="h-10 w-full rounded-md border border-ink-300 bg-white px-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
          />
        </div>
      </Card>

      {showCategoryFilter && (
        <Card sheet={isSheet}>
          <FieldLabel>Category</FieldLabel>
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
            <RadioRow
              checked={!current.category}
              onChange={() => setParam({ category: null })}
              label="All categories"
            />
            {categories.map((c) => (
              <RadioRow
                key={c.slug}
                checked={current.category === c.slug}
                onChange={() => setParam({ category: c.slug })}
                label={c.name}
              />
            ))}
          </div>
        </Card>
      )}

      {conditions.length > 0 && (
        <Card sheet={isSheet}>
          <FieldLabel>Condition</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {conditions.map((c) => (
              <Chip
                key={c}
                active={current.condition === c}
                onClick={() => setParam({ condition: current.condition === c ? null : c })}
              >
                {c}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {cpuFamilies.length > 0 && (
        <Card sheet={isSheet}>
          <FieldLabel>CPU family</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cpuFamilies.slice(0, 12).map((cpu) => (
              <Chip
                key={cpu}
                active={current.cpuFamily === cpu}
                onClick={() => setParam({ cpuFamily: current.cpuFamily === cpu ? null : cpu })}
              >
                {cpu}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {gpuFamilies.length > 0 && (
        <Card sheet={isSheet}>
          <FieldLabel>GPU</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {gpuFamilies.slice(0, 12).map((gpu) => (
              <Chip
                key={gpu}
                active={current.gpuFamily === gpu}
                onClick={() => setParam({ gpuFamily: current.gpuFamily === gpu ? null : gpu })}
              >
                {gpu}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {ramSizes.length > 0 && (
        <Card sheet={isSheet}>
          <FieldLabel>RAM minimum</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[8, 16, 32, 64].map((r) => (
              <Chip
                key={r}
                active={current.minRamGb === r}
                onClick={() => setParam({ minRamGb: current.minRamGb === r ? null : r })}
              >
                {r}GB+
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {builders.length > 0 && (
        <Card sheet={isSheet}>
          <FieldLabel>Builder</FieldLabel>
          <select
            value={current.builderCode}
            onChange={(e) => setParam({ builderCode: e.target.value || null })}
            className="mt-2 h-11 w-full rounded-md border border-ink-300 bg-white px-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
          >
            <option value="">Any builder</option>
            {builders.map((b) => (
              <option key={b.builderCode} value={b.builderCode}>
                {b.displayName}
              </option>
            ))}
          </select>
        </Card>
      )}

      <Card sheet={isSheet}>
        <label className="flex min-h-11 cursor-pointer items-center justify-between">
          <span className="font-mono text-caption uppercase tracking-widest text-ink-500">In stock only</span>
          <input
            type="checkbox"
            checked={current.inStockOnly}
            onChange={(e) => setParam({ inStockOnly: e.target.checked })}
            className="h-5 w-5 rounded accent-brand-green"
          />
        </label>
      </Card>
    </div>
  );
}

function Card({ children, sheet }: { children: React.ReactNode; sheet: boolean }) {
  if (sheet) {
    return <div className="rounded-md border border-ink-300/60 bg-white/60 p-4 dark:border-obsidian-500/60 dark:bg-obsidian-900/40">{children}</div>;
  }
  return <GlassCard className="p-5">{children}</GlassCard>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block font-mono text-caption uppercase tracking-widest text-ink-500">{children}</span>;
}

function RadioRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex min-h-10 w-full items-center gap-2 rounded-sm px-2 text-left text-small transition-colors',
        checked
          ? 'bg-brand-green-100 text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green-400'
          : 'hover:bg-ink-100 dark:hover:bg-obsidian-800',
      )}
    >
      <span
        className={cn(
          'inline-block h-3 w-3 rounded-full border',
          checked ? 'border-brand-green bg-brand-green' : 'border-ink-300 dark:border-obsidian-500',
        )}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center rounded-sm px-2.5 py-1 font-mono text-caption uppercase tracking-wider transition-all',
        active
          ? 'bg-brand-green text-white shadow-ring-green'
          : 'bg-ink-100 text-ink-700 hover:bg-ink-300/60 dark:bg-obsidian-800 dark:text-ink-300 dark:hover:bg-obsidian-700',
      )}
    >
      {children}
    </button>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
