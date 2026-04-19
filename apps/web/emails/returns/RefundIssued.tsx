import { Section, Text, Link } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';

export type RefundIssuedProps = {
  customerFirstName: string;
  returnNumber: string;
  productTitle: string;
  refundAmountGbp: number;
  refundMethodLabel: string;
  expectedSettleWorkingDays: number;
  accountUrl: string;
};

function formatGbp(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RefundIssued({
  customerFirstName,
  returnNumber,
  productTitle,
  refundAmountGbp,
  refundMethodLabel,
  expectedSettleWorkingDays,
  accountUrl,
}: RefundIssuedProps) {
  const preheader = `${formatGbp(refundAmountGbp)} refunded for return ${returnNumber}.`;

  return (
    <EmailShell preheader={preheader}>
      <Text
        style={{
          fontFamily: TOKENS.monoFont,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: TOKENS.INK_60,
          margin: 0,
        }}
      >
        — Refund issued · {returnNumber}
      </Text>

      <Text
        style={{
          fontFamily: TOKENS.displayFont,
          fontSize: 48,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          color: TOKENS.INK,
          margin: '16px 0 24px',
          fontWeight: 300,
        }}
      >
        Refunded{' '}
        <span style={{ fontStyle: 'italic' }}>in full</span>.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK, margin: '0 0 16px' }}>
        <strong>{formatGbp(refundAmountGbp)}</strong> has been refunded for <strong>{productTitle}</strong>. It'll land back on your {refundMethodLabel} in {expectedSettleWorkingDays} working days — the card network's clock, not ours.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK_60, margin: '0 0 32px' }}>
        If it hasn't shown by then, drop us a line and we'll chase it.
      </Text>

      <Section style={{ textAlign: 'center' }}>
        <Link
          href={accountUrl}
          style={{
            display: 'inline-block',
            backgroundColor: 'transparent',
            color: TOKENS.INK,
            fontFamily: TOKENS.sansFont,
            fontSize: 13,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            padding: '16px 40px',
            textDecoration: 'none',
            border: `1px solid ${TOKENS.INK_10}`,
          }}
        >
          View return in account
        </Link>
      </Section>
    </EmailShell>
  );
}

RefundIssued.PreviewProps = {
  customerFirstName: 'Alex',
  returnNumber: 'BAV-RMA-260419-0012',
  productTitle: 'Aegis Ultra RTX 5090 Gaming PC',
  refundAmountGbp: 4499.00,
  refundMethodLabel: 'Visa ending 6411',
  expectedSettleWorkingDays: 3,
  accountUrl: 'https://birmingham-av.com/account/returns/BAV-RMA-260419-0012',
} as RefundIssuedProps;
