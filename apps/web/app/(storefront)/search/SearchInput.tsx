'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  defaultValue: string;
  defaultSort: string;
};

/**
 * Client-side search input used on /search. Submitting the form navigates to
 * `/search?q=…&sort=…`. The server component reads the query string and runs
 * the real full-text search on the server.
 */
export function SearchInput({ defaultValue, defaultSort }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set('q', value.trim());
    if (defaultSort && defaultSort !== 'relevance') params.set('sort', defaultSort);
    router.push(`/search?${params.toString()}`);
  }

  function handleClear() {
    setValue('');
    router.push('/search');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-6 border-b border-ink pb-1"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle cx="9.5" cy="9.5" r="7" stroke="currentColor" strokeWidth="1" />
        <path d="M15 15L20 20" stroke="currentColor" strokeWidth="1" />
      </svg>
      <input
        name="q"
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        placeholder="Search the catalogue, articles, builders…"
        autoFocus
        className="w-full border-0 bg-transparent py-3 font-display font-light leading-[1.1] tracking-[-0.01em] text-[clamp(36px,4vw,56px)] text-ink outline-none placeholder:text-ink-30"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="bav-hover-opa cursor-pointer border-0 bg-transparent p-2 text-ink-60"
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      )}
    </form>
  );
}
