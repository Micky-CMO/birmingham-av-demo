/**
 * Payment + courier logos rendered as inline SVG.
 * Mark geometry + colours sourced from each brand's public press + logo
 * guidance. Each card is 44x28 with proper brand colour + simplified
 * but recognisable mark.
 */

const card = 'inline-flex h-7 w-11 items-center justify-center overflow-hidden rounded-[4px] border border-ink-10';

function MarkVisa() {
  return (
    <span className={`${card} bg-white`} aria-label="Visa">
      <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
        <text
          x="22"
          y="11"
          textAnchor="middle"
          fill="#1A1F71"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="12"
          letterSpacing="0.5"
        >
          VISA
        </text>
      </svg>
    </span>
  );
}

function MarkMastercard() {
  return (
    <span className={`${card} bg-white`} aria-label="Mastercard">
      <svg viewBox="0 0 32 20" className="h-4" aria-hidden>
        {/* Official dual-circle mark: red + yellow with orange intersection */}
        <circle cx="12" cy="10" r="6.5" fill="#EB001B" />
        <circle cx="20" cy="10" r="6.5" fill="#F79E1B" />
        <path
          d="M16 4.8 A6.5 6.5 0 0 1 16 15.2 A6.5 6.5 0 0 1 16 4.8 Z"
          fill="#FF5F00"
        />
      </svg>
    </span>
  );
}

function MarkAmex() {
  return (
    <span className={`${card} bg-[#006FCF]`} aria-label="American Express">
      <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
        <text
          x="22"
          y="11"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="8"
          letterSpacing="0.5"
        >
          AMEX
        </text>
      </svg>
    </span>
  );
}

function MarkPayPal() {
  return (
    <span className={`${card} bg-white`} aria-label="PayPal">
      <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
        <text
          x="22"
          y="10.5"
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="800"
          fontStyle="italic"
          fontSize="10"
        >
          <tspan fill="#003087">Pay</tspan>
          <tspan fill="#009CDE">Pal</tspan>
        </text>
      </svg>
    </span>
  );
}

function MarkApplePay() {
  return (
    <span className={`${card} bg-black`} aria-label="Apple Pay">
      <svg viewBox="0 0 44 14" className="h-3.5 w-9" aria-hidden>
        {/* Simplified Apple mark + Pay wordmark */}
        <path
          d="M10.4 5.2c-.14-.48-.26-.97-.09-1.46.15-.44.49-.82.89-1.07-.03-.42-.21-.83-.52-1.15-.3-.3-.72-.48-1.13-.49-.52-.05-1.02.22-1.34.55-.27.27-.72.5-1.18.43-.09-.02-.18-.05-.25-.11-.21-.17-.5-.3-.79-.27-.42.04-.82.26-1.08.6-.71.96-.2 2.39.2 3.09.24.44.54.92.97 1.08.25.09.56.04.78-.06.28-.13.52-.22.82-.16.22.04.44.18.61.33.18.16.44.25.68.2.39-.08.7-.36.91-.7.25-.38.38-.85.52-1.31Zm-2.1-1.86c.19-.23.31-.54.31-.85 0-.05-.01-.1-.01-.15-.33.03-.68.2-.91.44-.19.2-.36.49-.34.8.36.03.7-.18.95-.24Z"
          fill="#fff"
        />
        <text
          x="26"
          y="10"
          textAnchor="start"
          fill="#fff"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="500"
          fontSize="8"
        >
          Pay
        </text>
      </svg>
    </span>
  );
}

function MarkGooglePay() {
  return (
    <span className={`${card} bg-white`} aria-label="Google Pay">
      <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
        {/* Multicolour "G" + Pay wordmark */}
        <text
          x="10"
          y="10.5"
          textAnchor="start"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="500"
          fontSize="9"
        >
          <tspan fill="#4285F4">G</tspan>
          <tspan fill="#EA4335"> </tspan>
        </text>
        <text
          x="20"
          y="10.5"
          textAnchor="start"
          fill="#5F6368"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="500"
          fontSize="8.5"
        >
          Pay
        </text>
      </svg>
    </span>
  );
}

function MarkKlarna() {
  return (
    <span className={`${card} bg-[#FFA8CD]`} aria-label="Klarna">
      <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
        <text
          x="22"
          y="11"
          textAnchor="middle"
          fill="#17120F"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="8"
        >
          Klarna
        </text>
      </svg>
    </span>
  );
}

function MarkClearpay() {
  return (
    <span className={`${card} bg-[#B2FCE4]`} aria-label="Clearpay">
      <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
        <text
          x="22"
          y="11"
          textAnchor="middle"
          fill="#17120F"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="7"
        >
          clearpay
        </text>
      </svg>
    </span>
  );
}

export function PaymentMethods() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MarkVisa />
      <MarkMastercard />
      <MarkAmex />
      <MarkPayPal />
      <MarkApplePay />
      <MarkGooglePay />
      <MarkKlarna />
      <MarkClearpay />
    </div>
  );
}

function MarkRoyalMail() {
  return (
    <span className={`${card} bg-[#CC0000]`} aria-label="Royal Mail">
      <svg viewBox="0 0 44 14" className="h-3 w-10" aria-hidden>
        {/* Small crown mark + wordmark */}
        <path
          d="M4 6 L5 4 L6 6 L7 4 L8 6 L9 4 L10 6 L10 8 L4 8 Z"
          fill="#FFCC00"
        />
        <text
          x="25"
          y="10"
          textAnchor="middle"
          fill="#FFCC00"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="6.5"
          letterSpacing="0.3"
        >
          ROYAL MAIL
        </text>
      </svg>
    </span>
  );
}

function MarkDPD() {
  return (
    <span className={`${card} bg-[#DC0032]`} aria-label="DPD">
      <svg viewBox="0 0 44 14" className="h-3.5 w-9" aria-hidden>
        <text
          x="22"
          y="11"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="900"
          fontSize="9"
          letterSpacing="0.5"
        >
          DPD
        </text>
      </svg>
    </span>
  );
}

function MarkEvri() {
  return (
    <span className={`${card} bg-[#26C1B4]`} aria-label="Evri">
      <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
        <text
          x="22"
          y="10.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="8.5"
          fontStyle="italic"
        >
          evri
        </text>
      </svg>
    </span>
  );
}

function MarkUPS() {
  return (
    <span className={`${card} bg-[#351C15]`} aria-label="UPS">
      <svg viewBox="0 0 44 14" className="h-3 w-9" aria-hidden>
        <text
          x="22"
          y="11"
          textAnchor="middle"
          fill="#FFB500"
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight="900"
          fontSize="9"
        >
          UPS
        </text>
      </svg>
    </span>
  );
}

export function DeliveryPartners() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MarkRoyalMail />
      <MarkDPD />
      <MarkEvri />
      <MarkUPS />
    </div>
  );
}
