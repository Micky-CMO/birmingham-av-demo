'use client';

import { useEffect, useState } from 'react';

/**
 * Small client-only ticker used in the refurb-week campaign strip.
 * Takes an ISO end-datetime and reports days / hours / minutes remaining.
 */
export function RefurbWeekCountdown({ endsAtIso, startsLabel, endsLabel }: {
  endsAtIso: string;
  startsLabel: string;
  endsLabel: string;
}) {
  const [remaining, setRemaining] = useState<string>(() => compute(endsAtIso));

  useEffect(() => {
    const id = setInterval(() => setRemaining(compute(endsAtIso)), 1000);
    return () => clearInterval(id);
  }, [endsAtIso]);

  return (
    <span className="bav-label text-ink-60">
      — Refurb week · {startsLabel} → {endsLabel} · <span className="text-ink">{remaining}</span>
    </span>
  );
}

function compute(endsAtIso: string): string {
  const end = new Date(endsAtIso).getTime();
  const now = Date.now();
  let ms = Math.max(0, end - now);
  const days = Math.floor(ms / 86_400_000);
  ms -= days * 86_400_000;
  const hrs = Math.floor(ms / 3_600_000);
  ms -= hrs * 3_600_000;
  const mins = Math.floor(ms / 60_000);
  return `${days}d ${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m remaining`;
}

export default RefurbWeekCountdown;
