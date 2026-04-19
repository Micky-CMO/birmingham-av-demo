'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useCartStore } from '@/stores/cart';

const FREE_SHIPPING_THRESHOLD = 500;

type PromoState = { code: string; pct: number; label: string } | null;
type ShipOption = { service: string; priceGbp: number; leadTime: string };
type SelectedShip = { service: string; priceGbp: number } | null;

export default function CartPage() {
  const lines = useCartStore((s) => s.lines);
  const update = useCartStore((s) => s.update);
  const remove = useCartStore((s) => s.remove);
  const subtotal = useCartStore((s) => s.subtotal());

  // Promo
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoState, setPromoState] = useState<PromoState>(null);
  const [promoError, setPromoError] = useState('');

  // Shipping estimate
  const [shipOpen, setShipOpen] = useState(false);
  const [postcodeInput, setPostcodeInput] = useState('');
  const [shipOptions, setShipOptions] = useState<ShipOption[] | null>(null);
  const [selectedShip, setSelectedShip] = useState<SelectedShip>(null);

  const discount = promoState ? Math.round(subtotal * promoState.pct) : 0;
  const shippingPrice = selectedShip ? selectedShip.priceGbp : null;
  const qualifiesFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const displayTotal = subtotal - discount + (shippingPrice ?? 0);
  const itemCount = useMemo(() => lines.reduce((acc, l) => acc + l.qty, 0), [lines]);

  const applyPromo = () => {
    setPromoError('');
    // Demo only — real validation lives at POST /api/cart/promo per briefing.
    if (promoInput.trim().toUpperCase() === 'BAV10') {
      setPromoState({ code: 'BAV10', pct: 0.1, label: 'BAV10 (−10%)' });
      setPromoOpen(false);
    } else {
      setPromoError("That code isn't valid. Check the spelling and try again.");
    }
  };

  const estimateShipping = () => {
    // Demo only — real calculation at POST /api/checkout/shipping-estimate.
    const options: ShipOption[] = qualifiesFreeShipping
      ? [
          { service: 'Royal Mail Tracked 48', priceGbp: 0, leadTime: '2–3 working days' },
          { service: 'DPD Next Day', priceGbp: 9.99, leadTime: 'Next working day' },
        ]
      : [
          { service: 'Royal Mail Tracked 48', priceGbp: 4.99, leadTime: '2–3 working days' },
          { service: 'Royal Mail Tracked 24', priceGbp: 6.99, leadTime: '1–2 working days' },
          { service: 'DPD Next Day', priceGbp: 9.99, leadTime: 'Next working day' },
        ];
    setShipOptions(options);
    if (!selectedShip && options[0]) {
      setSelectedShip({ service: options[0].service, priceGbp: options[0].priceGbp });
    }
  };

  return (
    <div>
      {/* Page header */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-12 pb-8 pt-14">
          <div className="bav-label mb-4 text-ink-60">— The cart</div>
          <div className="flex items-baseline gap-6">
            <h1 className="m-0 font-display font-light leading-[0.98] tracking-[-0.03em] text-[clamp(40px,5.5vw,72px)]">
              Your <span className="bav-italic">cart</span>.
            </h1>
            {lines.length > 0 && (
              <div className="bav-label text-ink-60">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-page px-12 pb-32 pt-16">
        {lines.length === 0 && (
          <div className="py-20 text-center">
            <div className="bav-canvas relative mx-auto mb-8 h-[120px] w-[96px]">
              <div className="absolute inset-0 flex select-none items-center justify-center font-display text-[48px] italic text-[rgba(23,20,15,0.12)]">
                —
              </div>
            </div>
            <h2 className="mb-4 font-display text-[40px] font-light tracking-[-0.025em]">
              Nothing here <span className="bav-italic">yet</span>.
            </h2>
            <p className="mb-8 text-[16px] leading-[1.5] text-ink-60">
              Browse the catalogue to find your next build.
            </p>
            <Link href="/shop" className="bav-underline text-[14px] text-ink no-underline">
              <span>Browse the catalogue</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        )}

        {lines.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[1fr_380px] xl:gap-20">
            {/* LEFT: lines */}
            <div>
              {/* Free-shipping notice */}
              {qualifiesFreeShipping ? (
                <div className="mb-2 flex items-center gap-3 py-[14px]">
                  <span className="bav-pulse" />
                  <span className="bav-label text-ink-60">Free UK shipping applied to your order</span>
                </div>
              ) : (
                <div className="mb-2 py-[14px]">
                  <span className="bav-label text-ink-60">
                    Add £{(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(0)} more for free UK shipping
                  </span>
                </div>
              )}

              {/* Lines */}
              {lines.map((line) => (
                <div
                  key={line.productId}
                  className="flex items-start gap-6 border-t border-ink-10 py-8"
                >
                  <Link href={`/product/${line.slug}`} className="flex-shrink-0 no-underline">
                    <div className="bav-canvas relative h-[120px] w-[96px]">
                      {line.buildNumber && (
                        <div className="bav-tile-num absolute inset-0 flex select-none items-center justify-center font-display text-[42px] font-light italic tracking-[-0.04em]">
                          {line.buildNumber}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.slug}`}
                      className="mb-[6px] block text-[16px] font-medium leading-[1.3] text-ink no-underline"
                    >
                      {line.title}
                    </Link>
                    {line.conditionGrade && (
                      <div className="bav-label mb-1 text-ink-60">{line.conditionGrade}</div>
                    )}
                    {line.builder && (
                      <div className="bav-label mb-6 text-ink-30">
                        Built by{' '}
                        <Link
                          href={`/builders/${line.builder.builderCode}`}
                          className="bav-hover-opa text-ink-60 no-underline"
                        >
                          {line.builder.displayName}
                        </Link>
                      </div>
                    )}

                    {/* Bottom row: qty + price */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="inline-flex items-center border border-ink-10">
                        <QtyButton
                          label="Decrease"
                          onClick={() => update(line.productId, line.qty - 1)}
                          disabled={line.qty <= 1}
                        />
                        <div className="flex h-9 w-10 items-center justify-center border-x border-ink-10 font-mono text-[14px] tabular-nums">
                          {line.qty}
                        </div>
                        <QtyButton
                          label="Increase"
                          onClick={() => update(line.productId, line.qty + 1)}
                          disabled={false}
                        />
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-[20px] tabular-nums tracking-[-0.01em]">
                          £{(line.pricePerUnitGbp * line.qty).toLocaleString('en-GB')}
                        </div>
                        {line.qty > 1 && (
                          <div className="mt-[2px] font-mono text-[11px] tabular-nums text-ink-60">
                            £{line.pricePerUnitGbp.toLocaleString('en-GB')} each
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => remove(line.productId)}
                        className="bav-label cursor-pointer border-none bg-transparent p-0 text-[9px] text-ink-30 transition-colors hover:text-ink-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Bottom: continue shopping */}
              <div className="flex items-center justify-between border-t border-ink-10 pt-6">
                <Link href="/shop" className="bav-underline text-[13px] text-ink-60 no-underline">
                  <span>Continue shopping</span>
                  <span className="arrow">→</span>
                </Link>
                <div className="bav-label text-ink-30">
                  {lines.length} item{lines.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* RIGHT: summary (sticky on desktop) */}
            <div className="static xl:sticky xl:top-20">
              <div className="mb-7 font-display text-[26px] tracking-[-0.015em]">
                Order summary
              </div>

              <div>
                <SummaryRow
                  label={
                    <>
                      Subtotal{' '}
                      <span className="bav-label text-[9px] text-ink-30">inc. VAT</span>
                    </>
                  }
                  value={`£${subtotal.toLocaleString('en-GB')}`}
                />
                {promoState && (
                  <SummaryRow
                    label={promoState.label}
                    value={`−£${discount.toLocaleString('en-GB')}`}
                    positive
                  />
                )}
                <SummaryRow
                  label="Shipping"
                  value={
                    selectedShip
                      ? selectedShip.priceGbp === 0
                        ? 'Free'
                        : `£${selectedShip.priceGbp.toFixed(2)}`
                      : 'Calculated at checkout'
                  }
                />
                <SummaryRow
                  label="Total"
                  value={`£${displayTotal.toLocaleString('en-GB')}${!selectedShip ? '*' : ''}`}
                  bold
                />
                {!selectedShip && (
                  <div className="bav-label mb-1 pt-[6px] text-right text-[9px] text-ink-30">
                    * Shipping added at checkout
                  </div>
                )}
              </div>

              {/* Promo code accordion */}
              <div className="mt-1 border-t border-ink-10 pt-5">
                {!promoState ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPromoOpen(!promoOpen)}
                      className="bav-underline cursor-pointer border-none bg-transparent p-0 text-[13px] text-ink-60"
                    >
                      <span>{promoOpen ? 'Hide' : '+ Add promo code'}</span>
                    </button>
                    {promoOpen && (
                      <div className="mt-4">
                        <div className="flex gap-0">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            placeholder="Enter code"
                            onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                            className="flex-1 border border-r-0 border-ink-10 bg-transparent px-[14px] py-[10px] text-[13px] text-ink outline-none"
                          />
                          <button
                            type="button"
                            onClick={applyPromo}
                            className="bav-label cursor-pointer border border-ink-10 bg-ink px-[18px] py-[10px] text-paper"
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && (
                          <div className="mt-2 text-[12px] text-[#B94040]">{promoError}</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="bav-label text-ink-60">{promoState.label} applied</span>
                    <button
                      type="button"
                      onClick={() => setPromoState(null)}
                      className="bav-label cursor-pointer border-none bg-transparent p-0 text-[9px] text-ink-30"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Shipping estimate accordion */}
              <div className="mt-1 border-t border-ink-10 pt-5">
                <button
                  type="button"
                  onClick={() => setShipOpen(!shipOpen)}
                  className="bav-underline cursor-pointer border-none bg-transparent p-0 text-[13px] text-ink-60"
                >
                  <span>{shipOpen ? 'Hide shipping' : 'Estimate shipping'}</span>
                </button>
                {shipOpen && (
                  <div className="mt-4">
                    <div className="mb-3 flex gap-0">
                      <input
                        type="text"
                        value={postcodeInput}
                        onChange={(e) => setPostcodeInput(e.target.value)}
                        placeholder="UK postcode"
                        className="flex-1 border border-r-0 border-ink-10 bg-transparent px-[14px] py-[10px] text-[13px] uppercase text-ink outline-none"
                      />
                      <button
                        type="button"
                        onClick={estimateShipping}
                        className="bav-label cursor-pointer border border-ink-10 bg-ink px-[14px] py-[10px] text-paper"
                      >
                        Estimate
                      </button>
                    </div>
                    {shipOptions &&
                      shipOptions.map((opt) => (
                        <label
                          key={opt.service}
                          className="flex cursor-pointer items-center justify-between border-t border-ink-10 py-3"
                          onClick={() =>
                            setSelectedShip({ service: opt.service, priceGbp: opt.priceGbp })
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-[14px] w-[14px] flex-shrink-0 border"
                              style={{
                                borderColor:
                                  selectedShip?.service === opt.service
                                    ? 'var(--ink)'
                                    : 'var(--ink-30)',
                                background:
                                  selectedShip?.service === opt.service
                                    ? 'var(--ink)'
                                    : 'transparent',
                              }}
                            />
                            <div>
                              <div className="text-[13px]">{opt.service}</div>
                              <div className="bav-label text-ink-60">{opt.leadTime}</div>
                            </div>
                          </div>
                          <span className="font-mono text-[13px] tabular-nums">
                            {opt.priceGbp === 0 ? 'Free' : `£${opt.priceGbp.toFixed(2)}`}
                          </span>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              {/* Checkout CTA */}
              <div className="mt-7">
                <Link
                  href="/checkout"
                  className="bav-cta block text-center no-underline"
                >
                  Proceed to checkout
                </Link>
              </div>

              {/* Trust row */}
              <div className="mt-6 grid grid-cols-3 border-t border-ink-10">
                {[
                  { label: '12 months', sub: 'Parts & labour' },
                  { label: '30 days', sub: 'Returns' },
                  { label: 'Free', sub: 'UK delivery over £500' },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className={`py-[14px] ${i > 0 ? 'border-l border-ink-10 pl-3' : ''}`}
                  >
                    <div className="mb-[2px] text-[13px] font-medium">{item.label}</div>
                    <div className="bav-label text-[9px] text-ink-60">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QtyButton({
  label,
  onClick,
  disabled,
}: {
  label: 'Increase' | 'Decrease';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-[18px] leading-none text-ink disabled:cursor-default disabled:text-ink-30"
    >
      {label === 'Decrease' ? '−' : '+'}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  positive,
}: {
  label: ReactNode;
  value: ReactNode;
  bold?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-t border-ink-10 py-[14px]">
      <span className={`text-ink ${bold ? 'text-[15px] font-medium' : 'text-[14px]'}`}>
        {label}
      </span>
      <span
        className={`font-mono tabular-nums ${bold ? 'text-[20px] tracking-[-0.01em]' : 'text-[14px]'} ${
          positive ? 'text-brand-green' : 'text-ink'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
