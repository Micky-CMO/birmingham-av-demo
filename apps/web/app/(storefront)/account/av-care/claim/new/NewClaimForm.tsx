'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReplyBox, type ReplyPhoto } from '@/components/thread/ReplyBox';

export type CoveredProduct = {
  productId: string;
  title: string;
  subtitle: string;
  buildNumber: string | null;
  purchasedAt: string | null;
};

export type NewClaimFormProps = {
  products: CoveredProduct[];
  preSelectedProductId: string | null;
  tier: 'essential' | 'plus';
};

const REASONS: Array<{
  key: 'hardware_fault' | 'performance_degradation' | 'cosmetic_damage' | 'accidental' | 'other';
  label: string;
  blurb: string;
}> = [
  { key: 'hardware_fault', label: 'Hardware fault', blurb: 'Component has failed or is misbehaving.' },
  {
    key: 'performance_degradation',
    label: 'Performance',
    blurb: 'Thermal, noise, crashes, slowdown.',
  },
  { key: 'cosmetic_damage', label: 'Cosmetic damage', blurb: 'Scratches, dents, panel wear.' },
  { key: 'accidental', label: 'Accidental', blurb: 'Drops, spills, power events.' },
  { key: 'other', label: 'Other', blurb: 'Describe it in your own words.' },
];

export function NewClaimForm({ products, preSelectedProductId, tier }: NewClaimFormProps) {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(
    preSelectedProductId && products.some((p) => p.productId === preSelectedProductId)
      ? preSelectedProductId
      : null,
  );
  const [reasonKey, setReasonKey] = useState<typeof REASONS[number]['key'] | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<ReplyPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.productId === productId) ?? null,
    [products, productId],
  );
  const selectedReason = useMemo(
    () => REASONS.find((r) => r.key === reasonKey) ?? null,
    [reasonKey],
  );
  const canSubmit =
    !!selectedProduct && !!selectedReason && description.trim().length >= 20 && !submitting;

  const turnaround = tier === 'plus' ? '3 to 5 working days' : '7 to 10 working days';
  const collection =
    tier === 'plus' ? 'Courier collection included' : 'Post-in to our Birmingham workshop';
  const loan = tier === 'plus' ? 'Loan unit included' : 'No loan unit';

  async function handleSubmit() {
    if (!canSubmit || !selectedProduct || !selectedReason) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/avcare/claims', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.productId,
          reason: selectedReason.key,
          description: description.trim(),
          // TODO: upload `photos` to blob storage and include the resulting URLs.
          // The ReplyBox captures file handles client-side; the upload service
          // isn't wired yet, so we submit without attachments for now.
          photoUrls: [],
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { claimNumber?: string; error?: { message?: string } }
        | null;
      if (!res.ok || !payload?.claimNumber) {
        throw new Error(payload?.error?.message ?? 'Something went wrong');
      }
      router.push(`/account/av-care/claim/${payload.claimNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <div className="bav-claim-layout">
      <div className="flex flex-col" style={{ gap: 64 }}>
        {/* Step 1 — unit picker */}
        <section>
          <StepHeader num="01" title="The unit" done={!!selectedProduct} />
          {products.length === 0 ? (
            <div
              className="border border-ink-10"
              style={{ padding: 40, fontSize: 14, color: 'var(--ink-60)', marginTop: 32 }}
            >
              We could not find any products registered to your account. If this looks wrong, please
              contact support.
            </div>
          ) : (
            <div
              className="border border-ink-10"
              style={{ marginTop: 32, maxHeight: 440, overflowY: 'auto' }}
            >
              {products.map((p, i) => {
                const active = p.productId === productId;
                return (
                  <button
                    key={p.productId}
                    type="button"
                    onClick={() => setProductId(p.productId)}
                    className="grid w-full items-center text-left"
                    style={{
                      gridTemplateColumns: '72px 1fr 20px',
                      gap: 20,
                      padding: '18px 20px',
                      background: active ? 'var(--paper-2)' : 'transparent',
                      border: 'none',
                      borderTop: i === 0 ? 'none' : '1px solid var(--ink-10)',
                      cursor: 'pointer',
                      transition: 'background 200ms',
                    }}
                  >
                    <div
                      className="bav-canvas grid place-items-center"
                      style={{ width: 72, height: 72 }}
                    >
                      <div
                        className="font-display"
                        style={{
                          fontSize: 24,
                          fontWeight: 300,
                          color: 'var(--ink)',
                          lineHeight: 1,
                        }}
                      >
                        <span
                          className="bav-italic"
                          style={{ fontSize: '0.65em', color: 'var(--ink-30)', marginRight: 1 }}
                        >
                          №
                        </span>
                        <span className="bav-italic">{p.buildNumber ?? '—'}</span>
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>
                        {p.title}
                      </div>
                      {p.subtitle && (
                        <div style={{ fontSize: 13, color: 'var(--ink-60)', marginTop: 4 }}>
                          {p.subtitle}
                        </div>
                      )}
                      {p.purchasedAt && (
                        <div
                          className="font-mono"
                          style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 6 }}
                        >
                          Purchased {p.purchasedAt}
                        </div>
                      )}
                    </div>
                    <SquareRadio checked={active} />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2 — reason */}
        <section>
          <StepHeader num="02" title="The reason" done={!!selectedReason} />
          <div style={{ marginTop: 32 }}>
            {REASONS.map((r, i) => {
              const active = r.key === reasonKey;
              const isLast = i === REASONS.length - 1;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setReasonKey(r.key)}
                  className="grid w-full items-start text-left"
                  style={{
                    gridTemplateColumns: '20px 1fr',
                    gap: 20,
                    padding: '20px 0',
                    background: 'transparent',
                    border: 'none',
                    borderTop: '1px solid var(--ink-10)',
                    borderBottom: isLast ? '1px solid var(--ink-10)' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  <SquareRadio checked={active} />
                  <div>
                    <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-60)', marginTop: 4 }}>
                      {r.blurb}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3 — description + photos */}
        <section>
          <StepHeader
            num="03"
            title="What happened"
            done={description.trim().length >= 20}
          />
          <div style={{ marginTop: 32 }}>
            <ReplyBox
              label="Describe the fault in your own words"
              placeholder="When did it start? What does it do? Anything relevant we should know about the setup."
              submitLabel={
                submitting
                  ? 'Submitting…'
                  : canSubmit
                    ? 'Submit claim'
                    : 'Complete steps 1–3 to submit'
              }
              maxPhotos={5}
              value={description}
              onChange={setDescription}
              photos={photos}
              onPhotosChange={setPhotos}
              onSubmit={handleSubmit}
              disabled={!canSubmit}
              helperText="Minimum 20 characters · Up to 5 photos · JPG or PNG"
            />
            {error && (
              <p
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: '#B94040',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginTop: 12,
                  textAlign: 'right',
                }}
              >
                {error}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Sticky summary */}
      <aside className="bav-claim-summary">
        <div>
          <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
            — Summary
          </span>
          <h3
            className="font-display"
            style={{
              fontSize: 24,
              fontWeight: 300,
              margin: '12px 0 0',
              lineHeight: 1.1,
            }}
          >
            Your claim, so far.
          </h3>
        </div>

        <div className="grid border-t border-ink-10" style={{ paddingTop: 20, gap: 16 }}>
          <SummaryRow
            label="Unit"
            value={
              selectedProduct
                ? `№${selectedProduct.buildNumber ?? '—'} · ${selectedProduct.title}`
                : 'Not selected'
            }
            muted={!selectedProduct}
          />
          <SummaryRow
            label="Reason"
            value={selectedReason ? selectedReason.label : 'Not selected'}
            muted={!selectedReason}
          />
          <SummaryRow
            label="Description"
            value={
              description.trim().length >= 20
                ? `${description.trim().slice(0, 48)}${description.trim().length > 48 ? '…' : ''}`
                : 'Not written'
            }
            muted={description.trim().length < 20}
          />
          <SummaryRow
            label="Photos"
            value={photos.length > 0 ? `${photos.length} attached` : 'None attached'}
            muted={photos.length === 0}
          />
        </div>

        <div className="grid border-t border-ink-10" style={{ paddingTop: 20, gap: 16 }}>
          <SummaryRow label="Excess" value="£100.00" mono />
          <SummaryRow label="Turnaround" value={turnaround} />
          <SummaryRow label="Collection" value={collection} />
          <SummaryRow label="Loan unit" value={loan} />
        </div>

        <p
          className="m-0"
          style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--ink-60)' }}
        >
          The £100 excess is charged when we accept the claim, before the unit moves. If the claim
          is rejected, you are not charged. Cover extends to parts and labour.
        </p>
      </aside>
    </div>
  );
}

function StepHeader({ num, title, done }: { num: string; title: string; done: boolean }) {
  return (
    <div
      className="flex flex-wrap items-baseline border-b border-ink-10"
      style={{ gap: 24, paddingBottom: 16 }}
    >
      <div
        className="font-display"
        style={{
          fontSize: 56,
          fontWeight: 300,
          lineHeight: 1,
          color: done ? 'var(--ink)' : 'var(--ink-30)',
          letterSpacing: '-0.03em',
        }}
      >
        <span
          className="bav-italic"
          style={{ fontSize: '0.55em', color: 'var(--ink-30)', marginRight: 2 }}
        >
          №
        </span>
        <span className="bav-italic">{num}</span>
      </div>
      <h2
        className="font-display m-0 flex-1"
        style={{
          fontSize: 28,
          fontWeight: 300,
          lineHeight: 1.1,
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </h2>
      {done && (
        <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
          ✓ Done
        </span>
      )}
    </div>
  );
}

function SquareRadio({ checked }: { checked: boolean }) {
  return (
    <span
      className="relative inline-block shrink-0"
      style={{
        width: 14,
        height: 14,
        border: `1px solid ${checked ? 'var(--ink)' : 'var(--ink-10)'}`,
        marginTop: 3,
      }}
    >
      {checked && (
        <span
          className="absolute"
          style={{ inset: 2, background: 'var(--ink)' }}
        />
      )}
    </span>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className="grid items-baseline"
      style={{ gridTemplateColumns: '1fr auto', gap: 16 }}
    >
      <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
        — {label}
      </span>
      <span
        className={`overflow-hidden${mono ? ' font-mono' : ''}`}
        style={{
          fontSize: 13,
          color: muted ? 'var(--ink-30)' : 'var(--ink)',
          textAlign: 'right',
          maxWidth: 200,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}
