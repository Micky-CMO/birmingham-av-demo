'use client';

import { useState } from 'react';

export function HelpSearch() {
  const [query, setQuery] = useState('');
  return (
    <div
      className="mt-12 flex items-center gap-4 border-b border-ink pb-4"
      style={{ maxWidth: 640 }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        className="text-ink"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        className="help-search-input"
        placeholder="Search the help centre"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <span className="bav-label text-ink-30">&#8984; K</span>
    </div>
  );
}

export default HelpSearch;
