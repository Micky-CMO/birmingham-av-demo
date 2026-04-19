/**
 * Payment + courier badges rendered from SVG files in /public/brand/.
 *
 * Visa, Mastercard, Amex, PayPal SVGs come from the MIT-licensed
 * payment-icons npm package. Apple Pay, Google Pay, Klarna, Clearpay
 * + couriers are simplified inline marks following each brand's
 * standard merchant-display geometry.
 *
 * Cards render at 60x36 (standard payment badge ratio). Use h-7 for
 * compact rows or h-9 for a more prominent footer treatment.
 */

const PAYMENTS = [
  { src: '/brand/payment/visa.svg', alt: 'Visa' },
  { src: '/brand/payment/mastercard.svg', alt: 'Mastercard' },
  { src: '/brand/payment/amex.svg', alt: 'American Express' },
  { src: '/brand/payment/paypal.svg', alt: 'PayPal' },
  { src: '/brand/payment/apple-pay.svg', alt: 'Apple Pay' },
  { src: '/brand/payment/google-pay.svg', alt: 'Google Pay' },
  { src: '/brand/payment/klarna.svg', alt: 'Klarna' },
  { src: '/brand/payment/clearpay.svg', alt: 'Clearpay' },
];

const COURIERS = [
  { src: '/brand/delivery/royal-mail.svg', alt: 'Royal Mail' },
  { src: '/brand/delivery/dpd.svg', alt: 'DPD' },
  { src: '/brand/delivery/evri.svg', alt: 'Evri' },
  { src: '/brand/delivery/ups.svg', alt: 'UPS' },
  { src: '/brand/delivery/fedex.svg', alt: 'FedEx' },
];

const card =
  'inline-flex h-9 items-center justify-center overflow-hidden rounded-[4px]';

export function PaymentMethods() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PAYMENTS.map((p) => (
        <span key={p.alt} className={card} aria-label={p.alt}>
          <img src={p.src} alt={p.alt} className="h-9 w-auto" />
        </span>
      ))}
    </div>
  );
}

export function DeliveryPartners() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {COURIERS.map((c) => (
        <span key={c.alt} className={card} aria-label={c.alt}>
          <img src={c.src} alt={c.alt} className="h-9 w-auto" />
        </span>
      ))}
    </div>
  );
}
