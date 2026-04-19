'use client';

import Link from 'next/link';
import { useState } from 'react';

type ParsedRow = {
  __line: number;
  __error: string | null;
  [col: string]: string | number | null;
};

type ParseResult = {
  filename: string;
  totalRows: number;
  csvColumns: string[];
  rows: ParsedRow[];
};

type Mapping = Record<string, string>;

const TARGET_FIELDS: Array<{
  key: string;
  label: string;
  required: boolean;
  note?: string;
}> = [
  { key: 'qrId', label: 'QR ID', required: false, note: 'Omit for pool allocation' },
  { key: 'componentType', label: 'Type', required: true },
  { key: 'manufacturer', label: 'Manufacturer', required: true },
  { key: 'model', label: 'Model', required: true },
  { key: 'serialNumber', label: 'Serial', required: false },
  { key: 'conditionGrade', label: 'Condition', required: true },
  { key: 'costGbp', label: 'Cost (£)', required: false },
  { key: 'supplier', label: 'Supplier', required: false },
  { key: 'currentLocation', label: 'Location', required: true },
];

const DEFAULT_MAPPING_GUESS: Record<string, string[]> = {
  qrId: ['qr_id', 'qrid', 'sticker'],
  componentType: ['type', 'componenttype', 'category'],
  manufacturer: ['brand', 'manufacturer', 'make'],
  model: ['product', 'model', 'name'],
  serialNumber: ['sn', 'serial', 'serialnumber'],
  conditionGrade: ['grade', 'condition'],
  costGbp: ['price', 'cost', 'costgbp'],
  supplier: ['vendor', 'supplier'],
  currentLocation: ['bin', 'location', 'shelf'],
};

function parseCsv(text: string, filename: string): ParseResult {
  // Simple CSV parser — no support for quoted commas/escapes. Good enough
  // for intake sheets; upgrade to papaparse when it lands in the deps.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { filename, totalRows: 0, csvColumns: [], rows: [] };
  }
  const header = (lines[0] ?? '').split(',').map((c) => c.trim());
  const rows = lines.slice(1).map((line, idx) => {
    const cells = line.split(',').map((c) => c.trim());
    const row: ParsedRow = { __line: idx + 2, __error: null };
    header.forEach((col, i) => {
      row[col] = cells[i] ?? '';
    });
    return row;
  });
  return {
    filename,
    totalRows: rows.length,
    csvColumns: header,
    rows,
  };
}

function guessMapping(columns: string[]): Mapping {
  const lower = columns.map((c) => c.toLowerCase());
  const mapping: Mapping = {};
  for (const field of TARGET_FIELDS) {
    const candidates = DEFAULT_MAPPING_GUESS[field.key] ?? [];
    const hit = candidates.find((c) => lower.includes(c));
    if (hit) {
      const col = columns[lower.indexOf(hit)];
      if (col) mapping[field.key] = col;
    }
  }
  return mapping;
}

function cellString(row: ParsedRow, col: string | undefined): string {
  if (!col) return '';
  const v = row[col];
  return typeof v === 'string' ? v : '';
}

function validateRow(row: ParsedRow, mapping: Mapping, allowedTypes: Set<string>, allocationMode: string): string | null {
  const required: string[] = ['componentType', 'manufacturer', 'model', 'conditionGrade', 'currentLocation'];
  for (const key of required) {
    const col = mapping[key];
    if (!col || !cellString(row, col)) return `${key}: required`;
  }
  const typeVal = cellString(row, mapping['componentType']);
  if (typeVal && !allowedTypes.has(typeVal)) {
    return `type: unknown value "${typeVal}"`;
  }
  if (allocationMode === 'existing') {
    const qrCol = mapping['qrId'];
    if (!qrCol || !cellString(row, qrCol)) return 'qr_id: required in existing-binding mode';
  }
  return null;
}

export function ImportWizard({
  componentTypes,
  csvTemplateHref,
}: {
  componentTypes: { code: string; label: string }[];
  csvTemplateHref: string;
}) {
  const allowedTypeCodes = new Set(componentTypes.map((t) => t.code));

  const [stage, setStage] = useState<'upload' | 'preview' | 'done'>('upload');
  const [allocationMode, setAllocationMode] = useState<'existing' | 'pool'>('existing');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [fileText, setFileText] = useState<string>('');
  const [mapping, setMapping] = useState<Mapping>({});
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errorReportUrl?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorRows = parsed
    ? parsed.rows.filter((r) =>
        validateRow(r, mapping, allowedTypeCodes, allocationMode),
      )
    : [];
  const importableCount = parsed ? parsed.totalRows - errorRows.length : 0;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    const text = await f.text();
    const res = parseCsv(text, f.name);
    const guessed = guessMapping(res.csvColumns);
    // Pre-annotate each row with validation against guessed mapping
    for (const row of res.rows) {
      row.__error = validateRow(row, guessed, allowedTypeCodes, allocationMode);
    }
    setFileText(text);
    setParsed(res);
    setMapping(guessed);
    setStage('preview');
  };

  const handleImport = async () => {
    if (!parsed) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      const blob = new Blob([fileText], { type: 'text/csv' });
      form.append('file', blob, parsed.filename);
      form.append('mapping', JSON.stringify(mapping));
      form.append('allocationMode', allocationMode);
      const res = await fetch('/api/admin/inventory/import', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'Import failed');
      }
      const body = (await res.json()) as {
        imported: number;
        skipped: number;
        errorReportUrl?: string;
      };
      setResult(body);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Step indicator */}
      <div
        className="mb-12 flex"
        style={{ border: '1px solid var(--ink-10)' }}
      >
        {[
          { key: 'upload', label: '№01 · Upload' },
          { key: 'preview', label: '№02 · Map & preview' },
          { key: 'done', label: '№03 · Confirm' },
        ].map((s, i) => (
          <div
            key={s.key}
            className="flex-1"
            style={{
              padding: '16px 20px',
              borderRight: i < 2 ? '1px solid var(--ink-10)' : 'none',
              background: stage === s.key ? 'var(--ink)' : 'transparent',
              color: stage === s.key ? 'var(--paper)' : 'var(--ink-60)',
            }}
          >
            <span className="bav-label">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 text-[13px]" style={{ color: '#B94040' }}>
          {error}
        </div>
      )}

      {stage === 'upload' && (
        <div>
          <label
            className="mb-6 block cursor-pointer text-center transition-colors"
            style={{
              border: '1px dashed var(--ink-30)',
              padding: '72px 32px',
              background: 'var(--paper-2)',
            }}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="hidden"
            />
            <div
              className="mb-2.5 font-display font-light"
              style={{
                fontSize: 24,
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Drop CSV here, or{' '}
              <span
                className="bav-italic"
                style={{
                  textDecoration: 'underline',
                  textUnderlineOffset: 4,
                }}
              >
                browse
              </span>
            </div>
            <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
              UTF-8 · comma-separated · header row required
            </div>
          </label>

          <div className="mb-10">
            <a
              href={csvTemplateHref}
              download
              className="bav-underline text-[13px] no-underline"
              style={{ color: 'var(--ink)' }}
            >
              Download template CSV <span className="arrow">→</span>
            </a>
          </div>

          <div className="border-t border-ink-10 pt-10">
            <div className="bav-label mb-5" style={{ color: 'var(--ink-60)' }}>
              — Allocation mode
            </div>

            <label
              className="flex cursor-pointer gap-4 border-b border-ink-10"
              style={{ padding: '20px 0' }}
            >
              <input
                type="radio"
                name="alloc"
                value="existing"
                checked={allocationMode === 'existing'}
                onChange={() => setAllocationMode('existing')}
                style={{ marginTop: 4, accentColor: 'var(--ink)' }}
              />
              <div>
                <div className="mb-1" style={{ fontSize: 15 }}>
                  CSV contains{' '}
                  <span className="font-mono tabular-nums">qr_id</span> column
                </div>
                <div
                  className="text-[13px]"
                  style={{ color: 'var(--ink-60)', lineHeight: 1.5 }}
                >
                  Each row binds to a pre-printed sticker. Rows where the QR is
                  already claimed are rejected.
                </div>
              </div>
            </label>

            <label
              className="flex cursor-pointer gap-4 border-b border-ink-10"
              style={{ padding: '20px 0' }}
            >
              <input
                type="radio"
                name="alloc"
                value="pool"
                checked={allocationMode === 'pool'}
                onChange={() => setAllocationMode('pool')}
                style={{ marginTop: 4, accentColor: 'var(--ink)' }}
              />
              <div>
                <div className="mb-1" style={{ fontSize: 15 }}>
                  Allocate from unclaimed pool
                </div>
                <div
                  className="text-[13px]"
                  style={{ color: 'var(--ink-60)', lineHeight: 1.5 }}
                >
                  CSV has no QR column. Each row is assigned the next unclaimed
                  sticker in sequence.
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {stage === 'preview' && parsed && (
        <div>
          {/* File header */}
          <div
            className="bav-canvas mb-10"
            style={{
              border: '1px solid var(--ink-10)',
              padding: '20px 24px',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div
                  className="bav-label mb-1.5"
                  style={{ color: 'var(--ink-60)' }}
                >
                  — File
                </div>
                <div
                  className="font-mono tabular-nums"
                  style={{ fontSize: 14 }}
                >
                  {parsed.filename}
                </div>
              </div>
              <div className="flex gap-8">
                <div>
                  <div
                    className="bav-label mb-1"
                    style={{ color: 'var(--ink-60)' }}
                  >
                    Rows
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 18 }}
                  >
                    {parsed.totalRows}
                  </div>
                </div>
                <div>
                  <div
                    className="bav-label mb-1"
                    style={{ color: 'var(--ink-60)' }}
                  >
                    Valid
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 18, color: 'var(--accent)' }}
                  >
                    {importableCount}
                  </div>
                </div>
                <div>
                  <div
                    className="bav-label mb-1"
                    style={{ color: 'var(--ink-60)' }}
                  >
                    Errors
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{
                      fontSize: 18,
                      color: errorRows.length ? '#B94040' : 'var(--ink-30)',
                    }}
                  >
                    {errorRows.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mapping */}
          <section className="mb-14">
            <div className="bav-label mb-6" style={{ color: 'var(--ink-60)' }}>
              — Map CSV columns → Component fields
            </div>
            <div
              className="grid gap-x-12 gap-y-5"
              style={{
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              }}
            >
              {TARGET_FIELDS.map((f) => (
                <div
                  key={f.key}
                  className="grid items-baseline gap-4"
                  style={{
                    gridTemplateColumns: '1fr 1.4fr',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14 }}>{f.label}</div>
                    <div
                      className="bav-label mt-1"
                      style={{
                        color: f.required ? 'var(--ink-60)' : 'var(--ink-30)',
                      }}
                    >
                      {f.required ? 'Required' : f.note ?? 'Optional'}
                    </div>
                  </div>
                  <select
                    className="bav-input font-mono"
                    style={{ padding: '8px 0', fontSize: 13 }}
                    value={mapping[f.key] ?? ''}
                    onChange={(e) => {
                      const next = { ...mapping, [f.key]: e.target.value };
                      setMapping(next);
                      if (parsed) {
                        for (const row of parsed.rows) {
                          row.__error = validateRow(
                            row,
                            next,
                            allowedTypeCodes,
                            allocationMode,
                          );
                        }
                        setParsed({ ...parsed, rows: [...parsed.rows] });
                      }
                    }}
                  >
                    <option value="">— not mapped —</option>
                    {parsed.csvColumns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* Row preview */}
          <section className="mb-14">
            <div className="mb-5 flex items-baseline justify-between">
              <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
                — Preview · first {Math.min(parsed.rows.length, 20)} rows
              </div>
              <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
                errors highlighted
              </span>
            </div>
            <div
              className="overflow-x-auto"
              style={{ border: '1px solid var(--ink-10)' }}
            >
              <table
                className="w-full border-collapse font-mono tabular-nums"
                style={{ fontSize: 12 }}
              >
                <thead>
                  <tr>
                    <th
                      className="bav-label text-left"
                      style={{
                        padding: '12px 10px',
                        borderBottom: '1px solid var(--ink-10)',
                        color: 'var(--ink-30)',
                        width: 40,
                      }}
                    >
                      Row
                    </th>
                    {parsed.csvColumns.map((c) => (
                      <th
                        key={c}
                        className="bav-label text-left"
                        style={{
                          padding: '12px 10px',
                          borderBottom: '1px solid var(--ink-10)',
                          color: 'var(--ink-30)',
                        }}
                      >
                        {c}
                      </th>
                    ))}
                    <th
                      className="bav-label text-left"
                      style={{
                        padding: '12px 10px',
                        borderBottom: '1px solid var(--ink-10)',
                        color: 'var(--ink-30)',
                        minWidth: 180,
                      }}
                    >
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 20).map((r) => (
                    <tr
                      key={r.__line}
                      style={{
                        background: r.__error
                          ? 'rgba(185,64,64,0.04)'
                          : 'transparent',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 10px',
                          borderBottom: '1px solid var(--ink-10)',
                          color: 'var(--ink-30)',
                        }}
                      >
                        {r.__line.toString().padStart(2, '0')}
                      </td>
                      {parsed.csvColumns.map((c) => {
                        const val = cellString(r, c);
                        return (
                          <td
                            key={c}
                            className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap"
                            style={{
                              padding: '12px 10px',
                              borderBottom: '1px solid var(--ink-10)',
                              color: r.__error ? '#B94040' : 'var(--ink)',
                            }}
                          >
                            {val || (
                              <span style={{ color: 'var(--ink-30)' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td
                        className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          padding: '12px 10px',
                          borderBottom: '1px solid var(--ink-10)',
                          color: r.__error ? '#B94040' : 'var(--ink-30)',
                        }}
                      >
                        {r.__error ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleImport}
              className="bav-cta"
              style={{ width: 'auto', padding: '20px 36px' }}
              disabled={submitting || importableCount === 0}
            >
              {submitting
                ? 'Importing…'
                : `Import ${importableCount} components`}
            </button>
            <button
              onClick={() => {
                setStage('upload');
                setParsed(null);
              }}
              className="bav-cta-secondary"
              style={{ width: 'auto', padding: '19px 36px' }}
            >
              Back · change file
            </button>
          </div>
        </div>
      )}

      {stage === 'done' && result && (
        <div style={{ maxWidth: 640 }}>
          <div
            className="bav-canvas mb-8"
            style={{
              border: '1px solid var(--ink-10)',
              padding: '40px 36px',
            }}
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span className="bav-pulse" aria-hidden />
              <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
                — Import complete
              </span>
            </div>
            <div
              className="mb-6 font-display font-light"
              style={{
                fontSize: 32,
                fontVariationSettings: "'opsz' 144",
                lineHeight: 1.15,
              }}
            >
              {result.imported} <span className="bav-italic">imported</span>.{' '}
              {result.skipped > 0 && (
                <span style={{ color: 'var(--ink-60)' }}>
                  {result.skipped} skipped.
                </span>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--ink-10)' }}>
              {[
                ['Imported', result.imported.toString().padStart(3, '0')],
                ['Skipped', result.skipped.toString().padStart(3, '0')],
                [
                  'Mode',
                  allocationMode === 'existing'
                    ? 'Existing QR binding'
                    : 'Pool allocation',
                ],
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
                  <div
                    className="bav-label"
                    style={{ color: 'var(--ink-60)' }}
                  >
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

            {result.skipped > 0 && result.errorReportUrl && (
              <div className="mt-7">
                <a
                  href={result.errorReportUrl}
                  download
                  className="bav-underline text-[13px] no-underline"
                  style={{ color: 'var(--ink)' }}
                >
                  Download error report <span className="arrow">→</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/inventory"
              className="bav-cta no-underline"
              style={{ width: 'auto', padding: '20px 36px' }}
            >
              Back to inventory
            </Link>
            <button
              type="button"
              onClick={() => {
                setStage('upload');
                setParsed(null);
                setResult(null);
              }}
              className="bav-cta-secondary"
              style={{ width: 'auto', padding: '19px 36px' }}
            >
              Import another file
            </button>
          </div>
        </div>
      )}
    </>
  );
}
