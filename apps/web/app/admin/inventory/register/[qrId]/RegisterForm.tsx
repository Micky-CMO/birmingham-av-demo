'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ComponentTypeOption = { code: string; label: string };

const CONDITIONS = ['New', 'Like New', 'Excellent', 'Very Good', 'Good'];

export function RegisterForm({
  qrId,
  componentTypes,
}: {
  qrId: string;
  componentTypes: ComponentTypeOption[];
}) {
  const router = useRouter();
  const [typeCode, setTypeCode] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [condition, setCondition] = useState<string>('New');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [location, setLocation] = useState('');
  const [photoName, setPhotoName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    typeCode && manufacturer.trim() && model.trim() && condition && location.trim();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPhotoName(f.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/inventory/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrId,
          componentType: typeCode,
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          serialNumber: serial.trim() || undefined,
          conditionGrade: condition,
          costGbp: cost ? Number(cost) : undefined,
          supplier: supplier.trim() || undefined,
          currentLocation: location.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'Failed to register component');
      }
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <div
          className="bav-canvas mb-8"
          style={{ border: '1px solid var(--ink-10)', padding: '40px 32px' }}
        >
          <div className="mb-3.5 flex items-center gap-2.5">
            <span className="bav-pulse" aria-hidden />
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              — Registered
            </span>
          </div>
          <div
            className="mb-4 font-display font-light"
            style={{ fontSize: 32, fontVariationSettings: "'opsz' 144", lineHeight: 1.15 }}
          >
            <span
              className="mb-2.5 block font-mono tabular-nums"
              style={{ fontSize: 24, fontWeight: 500 }}
            >
              {qrId}
            </span>
            bound to <span className="bav-italic">{manufacturer} {model}</span>.
          </div>
          <p className="m-0 text-[14px]" style={{ color: 'var(--ink-60)', lineHeight: 1.6 }}>
            Scan the next QR to continue, or view the component record.
          </p>
        </div>

        <Link
          href={`/admin/inventory/${qrId}`}
          className="bav-cta mb-3 no-underline"
        >
          View component
        </Link>
        <Link href="/admin/inventory" className="bav-cta-secondary no-underline">
          Back to inventory
        </Link>

        <div className="mt-7 text-center">
          <span className="bav-label" style={{ color: 'var(--ink-30)' }}>
            Scan next QR to register another
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Component type */}
      <div className="mb-10">
        <label
          className="bav-label mb-3 block"
          style={{ color: 'var(--ink-60)' }}
        >
          Component type
        </label>
        <select
          className="bav-input"
          style={{ fontSize: 16, padding: '12px 0' }}
          value={typeCode}
          onChange={(e) => setTypeCode(e.target.value)}
          required
        >
          <option value="">Select type…</option>
          {componentTypes.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Manufacturer */}
      <div className="mb-10">
        <label className="bav-label mb-3 block" style={{ color: 'var(--ink-60)' }}>
          Manufacturer
        </label>
        <input
          type="text"
          className="bav-input"
          style={{ fontSize: 16, padding: '12px 0' }}
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="NVIDIA, Samsung, Noctua…"
          required
        />
      </div>

      {/* Model */}
      <div className="mb-10">
        <label className="bav-label mb-3 block" style={{ color: 'var(--ink-60)' }}>
          Model
        </label>
        <input
          type="text"
          className="bav-input"
          style={{ fontSize: 16, padding: '12px 0' }}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="RTX 5090 Founders, 990 Pro 2TB…"
          required
        />
      </div>

      {/* Serial */}
      <div className="mb-10">
        <label className="bav-label mb-3 block" style={{ color: 'var(--ink-60)' }}>
          Serial number <span style={{ color: 'var(--ink-30)' }}>· optional</span>
        </label>
        <input
          type="text"
          className="bav-input font-mono tabular-nums"
          style={{ fontSize: 16, padding: '12px 0' }}
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="S/N from label"
        />
      </div>

      {/* Condition pills */}
      <div className="mb-10">
        <label
          className="bav-label mb-3.5 block"
          style={{ color: 'var(--ink-60)' }}
        >
          Condition
        </label>
        <div className="flex flex-wrap gap-2.5">
          {CONDITIONS.map((c) => {
            const selected = condition === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className="cursor-pointer border border-ink-10 text-[13px] transition-colors"
                style={{
                  padding: '10px 18px',
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

      {/* Cost + Supplier row */}
      <div
        className="mb-10 grid gap-6"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      >
        <div>
          <label className="bav-label mb-3 block" style={{ color: 'var(--ink-60)' }}>
            Cost
          </label>
          <div
            className="flex items-baseline border-b border-ink-10"
          >
            <span
              className="font-mono tabular-nums"
              style={{
                fontSize: 16,
                color: 'var(--ink-60)',
                marginRight: 6,
              }}
            >
              £
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent font-mono tabular-nums outline-none"
              style={{
                border: 'none',
                padding: '12px 0',
                fontSize: 16,
                color: 'var(--ink)',
              }}
            />
          </div>
        </div>
        <div>
          <label className="bav-label mb-3 block" style={{ color: 'var(--ink-60)' }}>
            Supplier
          </label>
          <input
            type="text"
            className="bav-input"
            style={{ fontSize: 16, padding: '12px 0' }}
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Scan, Overclockers, eBay…"
          />
        </div>
      </div>

      {/* Location */}
      <div className="mb-10">
        <label className="bav-label mb-3 block" style={{ color: 'var(--ink-60)' }}>
          Initial location
        </label>
        <input
          type="text"
          className="bav-input"
          style={{ fontSize: 16, padding: '12px 0' }}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="bin A3, workbench 2, shelf G-12…"
          required
        />
      </div>

      {/* Photo */}
      <div className="mb-14">
        <label className="bav-label mb-3 block" style={{ color: 'var(--ink-60)' }}>
          Photo <span style={{ color: 'var(--ink-30)' }}>· optional</span>
        </label>
        <label
          className="block cursor-pointer text-center transition-colors"
          style={{
            border: '1px dashed var(--ink-30)',
            padding: 28,
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          {photoName ? (
            <div>
              <div style={{ fontSize: 13 }}>{photoName}</div>
              <div
                className="bav-label mt-1.5"
                style={{ color: 'var(--ink-30)' }}
              >
                Tap to replace
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>
                Tap to attach a photo
              </div>
              <div
                className="bav-label mt-1.5"
                style={{ color: 'var(--ink-30)' }}
              >
                JPEG or PNG · up to 10MB
              </div>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="mb-5 text-[13px]" style={{ color: '#B94040' }} role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="bav-cta"
        disabled={!canSubmit || submitting}
      >
        {submitting ? 'Registering…' : 'Register component'}
      </button>

      <div className="mt-5">
        <Link
          href="/admin/inventory"
          className="bav-underline text-[12px] no-underline"
          style={{ color: 'var(--ink-60)' }}
        >
          Cancel · back to inventory
        </Link>
      </div>
    </form>
  );
}
