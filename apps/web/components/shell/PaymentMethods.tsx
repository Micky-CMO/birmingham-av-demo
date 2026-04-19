/**
 * Payment method badges rendered as inline SVG so they stay crisp,
 * scale with container, and carry no runtime dependency.
 * Each card is 44x28 with brand-faithful colour + simplified mark.
 */

const card = 'inline-flex h-7 w-11 items-center justify-center rounded-[3px] border border-ink-10';

export function PaymentMethods() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`${card} bg-[#1A1F71]`} aria-label="Visa">
        <svg viewBox="0 0 44 12" className="h-3 w-9" aria-hidden>
          <text x="22" y="10" textAnchor="middle" fill="#ffffff" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="11">VISA</text>
        </svg>
      </span>
      <span className={`${card} bg-white`} aria-label="Mastercard">
        <svg viewBox="0 0 24 16" className="h-4" aria-hidden>
          <circle cx="9" cy="8" r="6" fill="#EB001B" />
          <circle cx="15" cy="8" r="6" fill="#F79E1B" fillOpacity="0.9" />
          <path d="M12 3.6c1.4 1.1 2.3 2.7 2.3 4.4 0 1.7-.9 3.3-2.3 4.4-1.4-1.1-2.3-2.7-2.3-4.4 0-1.7.9-3.3 2.3-4.4Z" fill="#FF5F00" />
        </svg>
      </span>
      <span className={`${card} bg-[#006FCF]`} aria-label="American Express">
        <svg viewBox="0 0 44 16" className="h-3.5 w-9" aria-hidden>
          <text x="22" y="11" textAnchor="middle" fill="#ffffff" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8">AMEX</text>
        </svg>
      </span>
      <span className={`${card} bg-white`} aria-label="PayPal">
        <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
          <text x="22" y="11" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontStyle="italic" fontSize="10">
            <tspan fill="#003087">Pay</tspan>
            <tspan fill="#009CDE">Pal</tspan>
          </text>
        </svg>
      </span>
      <span className={`${card} bg-black`} aria-label="Apple Pay">
        <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
          <path d="M7.2 5c-.3-.4-.8-.6-1.3-.6-.2 0-.5 0-.7.2-.3.1-.5.4-.7.4-.2 0-.4-.2-.7-.4-.2-.1-.5-.2-.8-.2-.6 0-1.1.3-1.5.9-.6.9-.2 2.2.5 2.9.3.4.7.7 1.1.7.3 0 .5-.1.7-.3.2-.2.4-.2.6-.2.2 0 .4 0 .6.2.2.2.4.3.7.3.4 0 .8-.3 1.1-.7.4-.4.5-.9.5-.9-.9-.3-1.2-1.4-.1-2.3Zm-1.6-.9c.3-.4.5-.9.5-1.4-.5 0-.9.3-1.2.6-.3.3-.5.8-.5 1.3.5 0 .9-.2 1.2-.5Z" fill="#fff" />
          <text x="28" y="10" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="7">Pay</text>
        </svg>
      </span>
      <span className={`${card} bg-white`} aria-label="Google Pay">
        <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
          <text x="22" y="11" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="500" fontSize="9">
            <tspan fill="#4285F4">G </tspan>
            <tspan fill="#202124">Pay</tspan>
          </text>
        </svg>
      </span>
      <span className={`${card} bg-[#FFB3C7]`} aria-label="Klarna">
        <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
          <text x="22" y="11" textAnchor="middle" fill="#17120F" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8">Klarna</text>
        </svg>
      </span>
      <span className={`${card} bg-[#B2FCE4]`} aria-label="Clearpay">
        <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
          <text x="22" y="11" textAnchor="middle" fill="#17120F" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="7">Clearpay</text>
        </svg>
      </span>
    </div>
  );
}

export function DeliveryPartners() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`${card} bg-[#DC2020]`} aria-label="Royal Mail">
        <svg viewBox="0 0 44 12" className="h-3 w-9" aria-hidden>
          <text x="22" y="9" textAnchor="middle" fill="#FFD700" fontFamily="Georgia, serif" fontWeight="700" fontSize="7">Royal Mail</text>
        </svg>
      </span>
      <span className={`${card} bg-[#DC0032]`} aria-label="DPD">
        <svg viewBox="0 0 44 12" className="h-3 w-9" aria-hidden>
          <text x="22" y="9" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="8">DPD</text>
        </svg>
      </span>
      <span className={`${card} bg-[#3EC1B6]`} aria-label="Evri">
        <svg viewBox="0 0 44 12" className="h-3 w-9" aria-hidden>
          <text x="22" y="9" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8">Evri</text>
        </svg>
      </span>
    </div>
  );
}
