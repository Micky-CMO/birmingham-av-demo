'use client';

import { useState } from 'react';

type RangeKey = 'today' | 'week' | 'month' | 'qtr';

const RANGES: { k: RangeKey; label: string }[] = [
  { k: 'today', label: 'Today' },
  { k: 'week', label: '7 days' },
  { k: 'month', label: '30 days' },
  { k: 'qtr', label: '90 days' },
];

/**
 * Pure UI toggle — wires into a querystring once the KPI endpoint accepts
 * a range param. For now it's a visual-only control sitting next to the
 * heading, matching artefact 35.
 */
export function DashboardRangeToggle() {
  const [range, setRange] = useState<RangeKey>('today');
  return (
    <div className="flex border border-ink-10">
      {RANGES.map((r) => (
        <button
          key={r.k}
          type="button"
          onClick={() => setRange(r.k)}
          className={`bav-range-tab ${range === r.k ? 'on' : ''}`.trim()}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
