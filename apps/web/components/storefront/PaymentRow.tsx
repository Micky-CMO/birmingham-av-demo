/**
 * Payment methods row. Inline SVG marks redrawn in brand voice, correct brand
 * colours but not the exact official trademarks. Safe to render anywhere
 * (footer, checkout, product detail) without hotlinking third-party assets.
 */
export function PaymentRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <VisaMark />
      <MastercardMark />
      <AmexMark />
      <PayPalMark />
      <ApplePayMark />
      <GooglePayMark />
      <KlarnaMark />
      <ClearpayMark />
    </div>
  );
}

function PillBase({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <span
      className="inline-flex h-7 min-w-[44px] items-center justify-center rounded-[5px] border border-black/5 px-2 shadow-sm"
      style={{ backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

function VisaMark() {
  return (
    <PillBase bg="#1A1F71">
      <svg width="32" height="10" viewBox="0 0 36 12" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
        <text x="18" y="9.5" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="10" fontWeight="900" fontStyle="italic" fill="#F7B600" letterSpacing="0.5">VISA</text>
      </svg>
    </PillBase>
  );
}

function MastercardMark() {
  return (
    <PillBase bg="#FFFFFF">
      <svg width="28" height="16" viewBox="0 0 28 16" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
        <circle cx="10" cy="8" r="6.5" fill="#EB001B" />
        <circle cx="18" cy="8" r="6.5" fill="#F79E1B" />
        <path d="M14 2.8a6.5 6.5 0 000 10.4 6.5 6.5 0 000-10.4z" fill="#FF5F00" />
      </svg>
    </PillBase>
  );
}

function AmexMark() {
  return (
    <PillBase bg="#2E77BC">
      <svg width="28" height="10" viewBox="0 0 28 10" xmlns="http://www.w3.org/2000/svg" aria-label="American Express">
        <text x="14" y="8" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="7" fontWeight="900" fill="#FFFFFF" letterSpacing="0.3">AMEX</text>
      </svg>
    </PillBase>
  );
}

function PayPalMark() {
  return (
    <PillBase bg="#FFFFFF">
      <svg width="38" height="11" viewBox="0 0 42 11" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal">
        <text x="0" y="9" fontFamily="Inter, Arial, sans-serif" fontSize="10" fontWeight="900" fill="#003087" letterSpacing="-0.3">Pay</text>
        <text x="20" y="9" fontFamily="Inter, Arial, sans-serif" fontSize="10" fontWeight="900" fill="#009CDE" letterSpacing="-0.3">Pal</text>
      </svg>
    </PillBase>
  );
}

function ApplePayMark() {
  return (
    <PillBase bg="#000000">
      <svg width="34" height="14" viewBox="0 0 34 14" xmlns="http://www.w3.org/2000/svg" aria-label="Apple Pay">
        <path d="M5.2 4.1c-.4.5-1 .9-1.6.8-.1-.6.2-1.3.6-1.7.4-.5 1.1-.8 1.6-.9 0 .7-.2 1.3-.6 1.8zm.6.9c-.9-.1-1.6.5-2 .5-.4 0-1-.5-1.7-.5-.9 0-1.7.5-2.1 1.3-.9 1.6-.2 3.9.7 5.2.4.6.9 1.3 1.6 1.3.7 0 .9-.4 1.7-.4.8 0 1 .4 1.7.4s1.2-.6 1.6-1.3c.4-.5.6-1 .6-1-.1-.1-1.3-.5-1.3-2 0-1.2 1-1.8 1.1-1.8-.6-.9-1.5-1-1.9-1z" fill="#FFFFFF" />
        <text x="10" y="10" fontFamily="Inter, Arial, sans-serif" fontSize="8" fontWeight="600" fill="#FFFFFF" letterSpacing="-0.2">Pay</text>
      </svg>
    </PillBase>
  );
}

function GooglePayMark() {
  return (
    <PillBase bg="#FFFFFF">
      <svg width="42" height="14" viewBox="0 0 50 14" xmlns="http://www.w3.org/2000/svg" aria-label="Google Pay">
        <text x="0" y="10" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="700" fill="#4285F4">G</text>
        <text x="6.5" y="10" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="700" fill="#EA4335">o</text>
        <text x="12" y="10" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="700" fill="#FBBC05">o</text>
        <text x="17.5" y="10" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="700" fill="#4285F4">g</text>
        <text x="23" y="10" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="700" fill="#34A853">l</text>
        <text x="26.5" y="10" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="700" fill="#EA4335">e</text>
        <text x="33" y="10" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="700" fill="#5F6368">Pay</text>
      </svg>
    </PillBase>
  );
}

function KlarnaMark() {
  return (
    <PillBase bg="#FFB3C7">
      <svg width="40" height="10" viewBox="0 0 42 10" xmlns="http://www.w3.org/2000/svg" aria-label="Klarna">
        <text x="21" y="8.5" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="10" fontWeight="700" fill="#17120F" letterSpacing="-0.2">Klarna.</text>
      </svg>
    </PillBase>
  );
}

function ClearpayMark() {
  return (
    <PillBase bg="#B2FCE4">
      <svg width="48" height="10" viewBox="0 0 50 10" xmlns="http://www.w3.org/2000/svg" aria-label="Clearpay">
        <text x="25" y="8.5" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="900" fill="#000000" letterSpacing="-0.1">Clearpay</text>
      </svg>
    </PillBase>
  );
}
