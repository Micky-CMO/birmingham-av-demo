'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Generated = {
  batchId: string;
  pdfUrl: string;
  count: number;
  prefix: string;
  startNumber: number;
};

const pad = (n: number) => n.toString().padStart(6, '0');

export function QrGenerateForm({
  defaultPrefix,
  nextAvailableStartNumber,
}: {
  defaultPrefix: string;
  nextAvailableStartNumber: number;
}) {
  const [prefix, setPrefix] = useState(defaultPrefix);
  const [startNumber, setStartNumber] = useState(nextAvailableStartNumber);
  const [count, setCount] = useState(50);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewIds = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => `${prefix}-${pad(startNumber + i)}`),
    [prefix, startNumber],
  );

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, startNumber, count }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'Failed to generate batch');
      }
      const body = (await res.json()) as {
        batchId: string;
        pdfUrl: string;
        prefix: string;
        startNumber: number;
        count: number;
      };
      setGenerated(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (generated) setStartNumber(generated.startNumber + generated.count);
    setGenerated(null);
  };

  if (generated) {
    return (
      <div style={{ maxWidth: 600 }}>
        <div
          className="bav-canvas"
          style={{ border: '1px solid var(--ink-10)', padding: '40px 36px' }}
        >
          <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>
            — Batch ready
          </div>
          <div
            className="mb-6 font-display font-light"
            style={{
              fontSize: 28,
              fontVariationSettings: "'opsz' 144",
            }}
          >
            {generated.count} stickers, <span className="bav-italic">queued</span> for print.
          </div>

          <div style={{ borderTop: '1px solid var(--ink-10)' }}>
            {[
              ['Batch ID', generated.batchId],
              ['Prefix', generated.prefix],
              [
                'Range',
                `${generated.prefix}-${pad(generated.startNumber)} → ${generated.prefix}-${pad(generated.startNumber + generated.count - 1)}`,
              ],
              ['Count', generated.count.toString().padStart(3, '0')],
              ['Sheet layout', 'A4 · Avery L7159 · 40 per sheet'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="grid border-b border-ink-10"
                style={{
                  gridTemplateColumns: '1fr 2fr',
                  gap: 16,
                  padding: '14px 0',
                }}
              >
                <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
                  {k}
                </div>
                <div
                  className="font-mono tabular-nums"
                  style={{ fontSize: 13 }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <a
              href={generated.pdfUrl}
              download
              className="bav-cta"
              style={{ flex: 1, textDecoration: 'none' }}
            >
              Download PDF
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="bav-cta-secondary"
              style={{ flex: 1 }}
            >
              Start another batch
            </button>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <Link
            href="/admin/inventory"
            className="bav-underline text-[13px] no-underline"
            style={{ color: 'var(--ink)' }}
          >
            Back to inventory <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    );
  }

  const countNum = Number(count);
  const startNum = Number(startNumber);
  const disabled = submitting || !countNum || countNum < 1 || countNum > 500;

  return (
    <form
      onSubmit={handleGenerate}
      className="grid gap-16 md:gap-24"
      style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
    >
      {/* Left */}
      <div>
        <div className="bav-label mb-7" style={{ color: 'var(--ink-60)' }}>
          — Parameters
        </div>

        <label className="mb-8 block">
          <span
            className="bav-label mb-2 block"
            style={{ color: 'var(--ink-60)' }}
          >
            Prefix
          </span>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            className="bav-input font-mono tabular-nums"
            style={{ padding: '12px 0', fontSize: 16 }}
          />
          <span
            className="mt-2 block text-[12px]"
            style={{ color: 'var(--ink-30)' }}
          >
            Standard: BAV-INV
          </span>
        </label>

        <label className="mb-8 block">
          <span
            className="bav-label mb-2 block"
            style={{ color: 'var(--ink-60)' }}
          >
            Start number
          </span>
          <input
            type="number"
            min={1}
            value={startNumber}
            onChange={(e) => setStartNumber(Number(e.target.value))}
            className="bav-input font-mono tabular-nums"
            style={{ padding: '12px 0', fontSize: 16 }}
          />
          <span
            className="mt-2 block text-[12px]"
            style={{ color: 'var(--ink-30)' }}
          >
            Next available:{' '}
            <span className="font-mono tabular-nums">
              {pad(nextAvailableStartNumber)}
            </span>
          </span>
        </label>

        <label className="mb-12 block">
          <span
            className="bav-label mb-2 block"
            style={{ color: 'var(--ink-60)' }}
          >
            Count
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="bav-input font-mono tabular-nums"
            style={{ padding: '12px 0', fontSize: 16 }}
          />
          <span
            className="mt-2 block text-[12px]"
            style={{ color: 'var(--ink-30)' }}
          >
            Min 1, max 500 per batch.
          </span>
        </label>

        <div
          className="mb-12 border-b border-t border-ink-10"
          style={{ padding: '20px 0' }}
        >
          <div className="flex items-baseline justify-between">
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              Range
            </span>
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 14 }}
            >
              {prefix}-{pad(startNum)} → {prefix}-{pad(startNum + countNum - 1)}
            </span>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 text-[13px]"
            style={{ color: '#B94040' }}
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="bav-cta"
          disabled={disabled}
          style={{ width: '100%' }}
        >
          {submitting ? 'Generating…' : 'Generate and download PDF'}
        </button>
      </div>

      {/* Right — preview */}
      <div>
        <div className="bav-label mb-7" style={{ color: 'var(--ink-60)' }}>
          — Preview · first 9
        </div>

        <div
          className="grid border border-ink-10"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: 'var(--paper-2)',
          }}
        >
          {previewIds.map((id, i) => (
            <div
              key={id}
              className="flex flex-col items-center gap-2.5 bg-paper"
              style={{
                padding: '20px 14px',
                borderRight: i % 3 !== 2 ? '1px solid var(--ink-10)' : 'none',
                borderBottom: i < 6 ? '1px solid var(--ink-10)' : 'none',
              }}
            >
              <svg
                viewBox="0 0 29 29"
                width="72"
                height="72"
                aria-hidden
                style={{ display: 'block' }}
              >
                <rect width="29" height="29" fill="var(--paper)" />
                <rect x="0" y="0" width="7" height="7" fill="var(--ink)" />
                <rect x="1" y="1" width="5" height="5" fill="var(--paper)" />
                <rect x="2" y="2" width="3" height="3" fill="var(--ink)" />
                <rect x="22" y="0" width="7" height="7" fill="var(--ink)" />
                <rect x="23" y="1" width="5" height="5" fill="var(--paper)" />
                <rect x="24" y="2" width="3" height="3" fill="var(--ink)" />
                <rect x="0" y="22" width="7" height="7" fill="var(--ink)" />
                <rect x="1" y="23" width="5" height="5" fill="var(--paper)" />
                <rect x="2" y="24" width="3" height="3" fill="var(--ink)" />
                {Array.from({ length: 110 }).map((_, k) => {
                  const x = (k * 7 + i * 13) % 29;
                  const y = Math.floor((k * 11 + i * 17) / 3) % 29;
                  const inFinder =
                    (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20);
                  if (inFinder) return null;
                  return (
                    <rect
                      key={k}
                      x={x}
                      y={y}
                      width="1"
                      height="1"
                      fill="var(--ink)"
                    />
                  );
                })}
              </svg>
              <div
                className="font-mono tabular-nums text-center"
                style={{ fontSize: 9, letterSpacing: '0.02em' }}
              >
                {id}
              </div>
            </div>
          ))}
        </div>

        <p
          className="mt-4 text-[12px]"
          style={{ color: 'var(--ink-30)', lineHeight: 1.6 }}
        >
          Stickers print at 40 × 25mm on a standard A4 Avery L7159 sheet — 40
          per sheet. QR encodes the full ID string.
        </p>
      </div>
    </form>
  );
}
