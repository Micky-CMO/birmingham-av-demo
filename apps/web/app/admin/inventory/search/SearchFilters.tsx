'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type FacetOption = { code: string; label: string; count: number };

export function SearchFilters({
  componentTypes,
  locations,
  conditions,
}: {
  componentTypes: FacetOption[];
  locations: FacetOption[];
  conditions: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const initialQuery = params.get('q') ?? '';
  const initialTypes = (params.get('types') ?? '').split(',').filter(Boolean);
  const initialLocs = (params.get('locs') ?? '').split(',').filter(Boolean);
  const initialConds = (params.get('conds') ?? '').split(',').filter(Boolean);
  const initialStockStatus = params.get('status') ?? 'all';

  const [query, setQuery] = useState(initialQuery);
  const [selectedTypes, setTypes] = useState<string[]>(initialTypes);
  const [selectedLocs, setLocs] = useState<string[]>(initialLocs);
  const [selectedCond, setCond] = useState<string[]>(initialConds);
  const [stockStatus, setStockStatus] = useState(initialStockStatus);

  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) =>
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  // Debounce URL push as filters change
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const setOrDelete = (k: string, v: string) => {
        if (v) next.set(k, v);
        else next.delete(k);
      };
      setOrDelete('q', query);
      setOrDelete('types', selectedTypes.join(','));
      setOrDelete('locs', selectedLocs.join(','));
      setOrDelete('conds', selectedCond.join(','));
      setOrDelete('status', stockStatus === 'all' ? '' : stockStatus);
      next.delete('page');
      startTransition(() => {
        router.replace(`?${next.toString()}`, { scroll: false });
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedTypes, selectedLocs, selectedCond, stockStatus]);

  const activeFilterCount =
    (query ? 1 : 0) +
    selectedTypes.length +
    selectedLocs.length +
    selectedCond.length +
    (stockStatus !== 'all' ? 1 : 0);

  const reset = () => {
    setQuery('');
    setTypes([]);
    setLocs([]);
    setCond([]);
    setStockStatus('all');
  };

  return (
    <>
      {/* Search input */}
      <div className="mb-12">
        <div
          className="flex items-center gap-3.5 pb-3"
          style={{ borderBottom: '1px solid var(--ink)' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            style={{ flexShrink: 0 }}
            aria-hidden
          >
            <circle cx="9" cy="9" r="6.5" stroke="var(--ink)" strokeWidth="1" />
            <path
              d="M14 14L18 18"
              stroke="var(--ink)"
              strokeWidth="1"
              strokeLinecap="square"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by QR ID, manufacturer, model or serial…"
            className="flex-1 border-none bg-transparent outline-none"
            style={{
              fontSize: 17,
              color: 'var(--ink)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="bav-label bav-hover-opa cursor-pointer border-none bg-transparent"
              style={{ color: 'var(--ink-60)' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <aside
        className="sticky"
        style={{ top: 96, alignSelf: 'flex-start' }}
      >
        <div className="mb-6 flex items-baseline justify-between">
          <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — Filters
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={reset}
              className="bav-label bav-hover-opa cursor-pointer border-none bg-transparent p-0"
              style={{ color: 'var(--ink-30)' }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Stock status */}
        <div className="mb-8">
          <div
            className="bav-label mb-3.5"
            style={{ color: 'var(--ink-60)' }}
          >
            Stock status
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'in_stock', label: 'In stock' },
              { key: 'at_workbench', label: 'At bench' },
              { key: 'bound', label: 'Bound' },
            ].map((s) => {
              const selected = stockStatus === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStockStatus(s.key)}
                  className="cursor-pointer border text-[12px]"
                  style={{
                    padding: '8px 14px',
                    background: selected ? 'var(--ink)' : 'transparent',
                    color: selected ? 'var(--paper)' : 'var(--ink)',
                    borderColor: selected ? 'var(--ink)' : 'var(--ink-10)',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Component type */}
        <div className="mb-8">
          <div
            className="bav-label mb-3.5"
            style={{ color: 'var(--ink-60)' }}
          >
            Component type
          </div>
          <div>
            {componentTypes.map((t) => {
              const checked = selectedTypes.includes(t.code);
              return (
                <label
                  key={t.code}
                  className="flex cursor-pointer items-center gap-2.5 text-[13px]"
                  style={{ padding: '6px 0' }}
                >
                  <input
                    type="checkbox"
                    className="bav-checkbox"
                    checked={checked}
                    onChange={() => toggle(selectedTypes, t.code, setTypes)}
                  />
                  <span>{t.label}</span>
                  <span
                    className="ml-auto font-mono tabular-nums"
                    style={{ color: 'var(--ink-30)', fontSize: 11 }}
                  >
                    {t.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div className="mb-8">
          <div
            className="bav-label mb-3.5"
            style={{ color: 'var(--ink-60)' }}
          >
            Location
          </div>
          <div>
            {locations.map((l) => {
              const checked = selectedLocs.includes(l.code);
              return (
                <label
                  key={l.code}
                  className="flex cursor-pointer items-center gap-2.5 text-[13px]"
                  style={{ padding: '6px 0' }}
                >
                  <input
                    type="checkbox"
                    className="bav-checkbox"
                    checked={checked}
                    onChange={() => toggle(selectedLocs, l.code, setLocs)}
                  />
                  <span>{l.code}</span>
                  <span
                    className="ml-auto font-mono tabular-nums"
                    style={{ color: 'var(--ink-30)', fontSize: 11 }}
                  >
                    {l.count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Condition */}
        <div className="mb-8">
          <div
            className="bav-label mb-3.5"
            style={{ color: 'var(--ink-60)' }}
          >
            Condition
          </div>
          <div className="flex flex-wrap gap-1.5">
            {conditions.map((c) => {
              const selected = selectedCond.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(selectedCond, c, setCond)}
                  className="cursor-pointer border text-[12px]"
                  style={{
                    padding: '8px 14px',
                    background: selected ? 'var(--ink)' : 'transparent',
                    color: selected ? 'var(--paper)' : 'var(--ink)',
                    borderColor: selected ? 'var(--ink)' : 'var(--ink-10)',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
