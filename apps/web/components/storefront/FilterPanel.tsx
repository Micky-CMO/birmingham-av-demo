'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
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

export function FilterPanel({
  categories,
  conditions = [],
  showCategoryFilter = true,
  cpuFamilies = [],
  gpuFamilies = [],
  ramSizes = [],
  builders = [],
  priceCeiling = 5000,
}: FilterPanelProps) {
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
  }

  const activeCount = [
    current.category,
    current.condition,
    current.cpuFamily,
    current.gpuFamily,
    current.builderCode,
    current.q,
  ].filter(Boolean).length + (current.inStockOnly ? 1 : 0) + (current.minPrice > 0 ? 1 : 0) + (current.maxPrice < priceCeiling ? 1 : 0) + (current.minRamGb > 0 ? 1 : 0);

  return (
    <aside
      className={cn(
        'sticky top-[88px] h-fit space-y-4 transition-opacity duration-240',
        isPending && 'opacity-60',
      )}
    >
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

      <GlassCard className="p-5">
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
          className="mt-2 h-9 w-full rounded-md border border-ink-300 bg-white px-3 text-small placeholder:text-ink-500 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:border-obsidian-500 dark:bg-obsidian-900"
        />
      </GlassCard>

      <GlassCard className="p-5">
        <FieldLabel>Sort by</FieldLabel>
        <select
          value={current.sort}
          onChange={(e) => setParam({ sort: e.target.value })}
          className="mt-2 h-9 w-full rounded-md border border-ink-300 bg-white px-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </GlassCard>

      <GlassCard className="p-5">
        <FieldLabel>Price</FieldLabel>
        <div className="mt-2 flex items-baseline justify-between font-mono text-caption text-ink-500">
          <span>£0</span>
          <span className="text-ink-900 dark:text-ink-50">£{maxPriceLocal.toLocaleString('en-GB')}</span>
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
            min={0}
            placeholder="Min"
            defaultValue={current.minPrice || ''}
            onBlur={(e) => setParam({ minPrice: Number(e.target.value) || 0 })}
            className="h-8 w-full rounded-md border border-ink-300 bg-white px-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
          />
          <span className="text-ink-500">—</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={current.maxPrice < priceCeiling ? current.maxPrice : ''}
            onBlur={(e) => setParam({ maxPrice: Number(e.target.value) || 0 })}
            className="h-8 w-full rounded-md border border-ink-300 bg-white px-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
          />
        </div>
      </GlassCard>

      {showCategoryFilter && (
        <GlassCard className="p-5">
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
        </GlassCard>
      )}

      {conditions.length > 0 && (
        <GlassCard className="p-5">
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
        </GlassCard>
      )}

      {cpuFamilies.length > 0 && (
        <GlassCard className="p-5">
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
        </GlassCard>
      )}

      {gpuFamilies.length > 0 && (
        <GlassCard className="p-5">
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
        </GlassCard>
      )}

      {ramSizes.length > 0 && (
        <GlassCard className="p-5">
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
        </GlassCard>
      )}

      {builders.length > 0 && (
        <GlassCard className="p-5">
          <FieldLabel>Builder</FieldLabel>
          <select
            value={current.builderCode}
            onChange={(e) => setParam({ builderCode: e.target.value || null })}
            className="mt-2 h-9 w-full rounded-md border border-ink-300 bg-white px-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
          >
            <option value="">Any builder</option>
            {builders.map((b) => (
              <option key={b.builderCode} value={b.builderCode}>{b.displayName}</option>
            ))}
          </select>
        </GlassCard>
      )}

      <GlassCard className="p-5">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="font-mono text-caption uppercase tracking-widest text-ink-500">In stock only</span>
          <input
            type="checkbox"
            checked={current.inStockOnly}
            onChange={(e) => setParam({ inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded accent-brand-green"
          />
        </label>
      </GlassCard>
    </aside>
  );
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
        'flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-small transition-colors',
        checked ? 'bg-brand-green-100 text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green-400' : 'hover:bg-ink-100 dark:hover:bg-obsidian-800',
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
        'rounded-sm px-2.5 py-1 font-mono text-caption uppercase tracking-wider transition-all',
        active
          ? 'bg-brand-green text-white shadow-ring-green'
          : 'bg-ink-100 text-ink-700 hover:bg-ink-300/60 dark:bg-obsidian-800 dark:text-ink-300 dark:hover:bg-obsidian-700',
      )}
    >
      {children}
    </button>
  );
}
