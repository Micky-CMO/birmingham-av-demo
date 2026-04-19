'use client';

import { useRouter } from 'next/navigation';
import type { ChangeEvent } from 'react';

type Props = {
  query: string;
  value: string;
};

const OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price low to high' },
  { value: 'price-high', label: 'Price high to low' },
  { value: 'bestseller', label: 'Bestseller' },
];

/**
 * Sort picker that pushes a new ?sort= value into the URL and lets the server
 * component re-render with the newly selected order.
 */
export function SortSelect({ query, value }: Props) {
  const router = useRouter();

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const params = new URLSearchParams();
    params.set('q', query);
    if (next && next !== 'relevance') params.set('sort', next);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-[14px]">
      <span className="bav-label text-ink-30">Sort</span>
      <select
        value={value}
        onChange={handleChange}
        className="appearance-none border border-ink-10 bg-transparent py-[10px] pl-[14px] pr-9 font-sans text-[13px] text-ink cursor-pointer"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2317140F' fill='none'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
