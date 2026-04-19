'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export type EligibleOrderItem = {
  orderItemId: string;
  orderNumber: string;
  deliveredAt: string | null;
  windowDaysLeft: number;
  title: string;
  sku: string;
  buildNumber: string | null;
  pricePerUnitGbp: number;
  qty: number;
  builderDisplayName: string | null;
  builderCode: string | null;
};

const REASONS: Array<{ key: string; label: string; detail: string }> = [
  { key: 'dead_on_arrival', label: 'Dead on arrival', detail: 'Unit did not power on or boot.' },
  { key: 'hardware_fault', label: 'Hardware fault', detail: 'A component is failing or has failed.' },
  { key: 'not_as_described', label: 'Not as described', detail: 'Specs do not match the listing.' },
  {
    key: 'damaged_in_transit',
    label: 'Damaged in transit',
    detail: 'Packaging or unit arrived damaged.',
  },
  { key: 'wrong_item', label: 'Wrong item shipped', detail: "I received something I didn't order." },
  { key: 'changed_mind', label: 'Changed my mind', detail: 'I no longer want this unit.' },
  { key: 'other', label: 'Other', detail: 'Something else.' },
];

export function NewReturnForm({
  items,
  preSelectedOrderItemId,
}: {
  items: EligibleOrderItem[];
  preSelectedOrderItemId: string | null;
}) {
  const router = useRouter();
  const [selectedOrderItem, setSelectedOrderItem] = useState<string | null>(
    preSelectedOrderItemId && items.some((it) => it.orderItemId === preSelectedOrderItemId)
      ? preSelectedOrderItemId
      : null,
  );
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => !!selectedOrderItem && !!selectedReason && detail.trim().length >= 12 && !submitting,
    [selectedOrderItem, selectedReason, detail, submitting],
  );

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderItemId: selectedOrderItem,
          reason: selectedReason,
          reasonDetails: detail.trim(),
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { returnNumber?: string; error?: { message?: string } }
        | null;
      if (!res.ok || !payload?.returnNumber) {
        throw new Error(payload?.error?.message ?? 'Something went wrong');
      }
      router.push(`/account/returns/${payload.returnNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Step 1 — Item */}
      <Section
        numeral="01"
        label="— The unit"
        headline={
          <>
            Which item is this <span className="bav-italic">about</span>?
          </>
        }
      >
        {items.length === 0 ? (
          <div style={{ fontSize: 14, color: 'var(--ink-60)', padding: '24px 0' }}>
            No orders are currently eligible for return.
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--ink-10)' }}>
            {items.map((it) => {
              const isSelected = selectedOrderItem === it.orderItemId;
              const outOfWindow = it.windowDaysLeft <= 0;
              return (
                <button
                  key={it.orderItemId}
                  type="button"
                  onClick={() => !outOfWindow && setSelectedOrderItem(it.orderItemId)}
                  disabled={outOfWindow}
                  style={{
                    width: '100%',
                    background: isSelected ? 'rgba(23,20,15,0.04)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--ink-10)',
                    padding: '24px 0',
                    textAlign: 'left',
                    cursor: outOfWindow ? 'not-allowed' : 'pointer',
                    color: outOfWindow ? 'var(--ink-30)' : 'var(--ink)',
                    display: 'grid',
                    gridTemplateColumns: '28px 90px 1fr auto',
                    gap: 20,
                    alignItems: 'center',
                    transition: 'background 200ms',
                    opacity: outOfWindow ? 0.55 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: `1px solid ${isSelected ? 'var(--ink)' : 'var(--ink-30)'}`,
                      background: isSelected ? 'var(--ink)' : 'transparent',
                    }}
                  />
                  <div
                    className="bav-canvas"
                    style={{
                      aspectRatio: '4/5',
                      height: 72,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      className="font-display bav-italic"
                      style={{ fontSize: 24, color: 'var(--ink)', position: 'relative', zIndex: 1 }}
                    >
                      <span style={{ fontSize: 12, verticalAlign: 'super' }}>№</span>
                      {it.buildNumber || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, marginBottom: 6 }}>{it.title}</div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-60)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                      }}
                    >
                      {it.orderNumber} ·{' '}
                      {outOfWindow ? 'Return window closed' : `${it.windowDaysLeft} days left`}
                    </div>
                  </div>
                  <div className="font-mono" style={{ fontSize: 13, textAlign: 'right' }}>
                    £{it.pricePerUnitGbp.toFixed(2)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* Step 2 — Reason */}
      <Section
        numeral="02"
        label="— The reason"
        headline={
          <>
            What <span className="bav-italic">happened</span>?
          </>
        }
      >
        <div style={{ borderTop: '1px solid var(--ink-10)' }}>
          {REASONS.map((r) => {
            const isSelected = selectedReason === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelectedReason(r.key)}
                style={{
                  width: '100%',
                  background: isSelected ? 'rgba(23,20,15,0.04)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--ink-10)',
                  padding: '22px 0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr',
                  gap: 20,
                  alignItems: 'center',
                  transition: 'background 200ms',
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: `1px solid ${isSelected ? 'var(--ink)' : 'var(--ink-30)'}`,
                    background: isSelected ? 'var(--ink)' : 'transparent',
                  }}
                />
                <div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>{r.detail}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Step 3 — Detail */}
      <Section
        numeral="03"
        label="— The detail"
        headline={
          <>
            Tell us <span className="bav-italic">more</span>.
          </>
        }
      >
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-60)',
            margin: 0,
            marginBottom: 20,
            lineHeight: 1.6,
            maxWidth: 540,
          }}
        >
          A short description helps us route this to the right builder. Specifics — what you were doing, what
          went wrong, anything you&apos;ve already tried — speed everything up.
        </p>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="The GPU fans started rattling about a week in, and yesterday the machine locked up under load. I've already reseated the card but it still clicks at idle."
          rows={8}
          className="bav-field"
          style={{
            width: '100%',
            background: 'transparent',
            color: 'var(--ink)',
            border: '1px solid var(--ink-10)',
            borderRadius: 0,
            padding: '20px 22px',
            fontSize: 14,
            lineHeight: 1.6,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: 'var(--ink-60)',
            marginTop: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          {detail.length} characters · {detail.trim().length < 12 ? 'Min 12' : 'OK'}
        </div>
      </Section>

      {/* Submit */}
      <section style={{ marginTop: 96, paddingTop: 48, borderTop: '1px solid var(--ink-10)' }}>
        <div className="bav-return-submit">
          <div>
            <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 12 }}>
              — What happens next
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-60)', margin: 0, lineHeight: 1.6, maxWidth: 360 }}>
              A member of the returns team reviews your request, usually within one working day. You&apos;ll
              receive an email with a pre-paid shipping label if the return is approved.
            </p>
          </div>
          <div>
            <button
              type="button"
              disabled={!canSubmit}
              className="bav-cta"
              onClick={handleSubmit}
              style={{
                opacity: canSubmit ? 1 : 0.4,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit return request'}
            </button>
            {error && (
              <div
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: '#B94040',
                  marginTop: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                color: 'var(--ink-60)',
                marginTop: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                textAlign: 'center',
              }}
            >
              By submitting you accept the{' '}
              <a
                href="/terms#returns"
                className="bav-hover-opa"
                style={{ color: 'var(--ink)', textDecoration: 'underline' }}
              >
                returns policy
              </a>
              .
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({
  numeral,
  label,
  headline,
  children,
}: {
  numeral: string;
  label: string;
  headline: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bav-return-section">
      <div style={{ borderTop: '1px solid var(--ink-10)', paddingTop: 16 }}>
        <div
          className="font-display bav-italic"
          style={{
            fontWeight: 300,
            fontSize: 54,
            lineHeight: 1,
            color: 'var(--ink)',
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: '0.5em', verticalAlign: 'super', marginRight: 2 }}>№</span>
          {numeral}
        </div>
        <div className="bav-label" style={{ color: 'var(--ink-60)' }}>
          {label}
        </div>
      </div>

      <div>
        <h2
          className="font-display"
          style={{
            fontWeight: 300,
            fontSize: 'clamp(22px, 2vw, 30px)',
            lineHeight: 1.2,
            margin: 0,
            marginBottom: 28,
            maxWidth: 520,
          }}
        >
          {headline}
        </h2>
        {children}
      </div>
    </section>
  );
}
