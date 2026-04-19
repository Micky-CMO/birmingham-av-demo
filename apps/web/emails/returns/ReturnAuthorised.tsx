import { Section, Text, Link } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';

export type ReturnAuthorisedProps = {
  customerFirstName: string;
  returnNumber: string;
  productTitle: string;
  buildNumber?: string;
  returnReason: string;
  refundAmountGbp: number;
  returnLabelUrl: string;
  returnAddressBlock: string;
  expectedTurnaroundDays: number;
};

function formatGbp(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReturnAuthorised({
  customerFirstName,
  returnNumber,
  productTitle,
  buildNumber,
  returnReason,
  refundAmountGbp,
  returnLabelUrl,
  returnAddressBlock,
  expectedTurnaroundDays,
}: ReturnAuthorisedProps) {
  const preheader = `Return ${returnNumber} approved. Download the label and send it back.`;

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
        — Return authorised · {returnNumber}
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
        Approved,{' '}
        <span style={{ fontStyle: 'italic' }}>{customerFirstName}</span>.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK, margin: '0 0 16px' }}>
        Your return for <strong>{productTitle}</strong>
        {buildNumber && <> (build {buildNumber})</>} has been authorised. Print the label, pack the unit back in its original box, and hand it to any courier drop-off.
      </Text>

      <Section
        style={{
          padding: 24,
          backgroundColor: '#EDE9E3',
          marginBottom: 32,
        }}
      >
        <Text
          style={{
            fontFamily: TOKENS.monoFont,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: TOKENS.INK_60,
            margin: '0 0 8px',
          }}
        >
          Reason
        </Text>
        <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 15, color: TOKENS.INK, margin: '0 0 20px' }}>
          {returnReason}
        </Text>
        <Text
          style={{
            fontFamily: TOKENS.monoFont,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: TOKENS.INK_60,
            margin: '0 0 8px',
          }}
        >
          Refund
        </Text>
        <Text style={{ fontFamily: TOKENS.monoFont, fontSize: 18, color: TOKENS.INK, margin: '0 0 20px' }}>
          {formatGbp(refundAmountGbp)}
        </Text>
        <Text
          style={{
            fontFamily: TOKENS.monoFont,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: TOKENS.INK_60,
            margin: '0 0 8px',
          }}
        >
          Turnaround
        </Text>
        <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 15, color: TOKENS.INK, margin: 0 }}>
          {expectedTurnaroundDays} working days from receipt
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link
          href={returnLabelUrl}
          style={{
            display: 'inline-block',
            backgroundColor: TOKENS.INK,
            color: TOKENS.PAPER,
            fontFamily: TOKENS.sansFont,
            fontSize: 13,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            padding: '18px 40px',
            textDecoration: 'none',
            border: `1px solid ${TOKENS.INK}`,
          }}
        >
          Download return label
        </Link>
      </Section>

      <Section style={{ paddingTop: 32, borderTop: `1px solid ${TOKENS.INK_10}` }}>
        <Text
          style={{
            fontFamily: TOKENS.monoFont,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: TOKENS.INK_60,
            margin: '0 0 12px',
          }}
        >
          — Return address
        </Text>
        <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 14, lineHeight: 1.7, color: TOKENS.INK, margin: 0, whiteSpace: 'pre-line' }}>
          {returnAddressBlock}
        </Text>
      </Section>
    </EmailShell>
  );
}

ReturnAuthorised.PreviewProps = {
  customerFirstName: 'Alex',
  returnNumber: 'BAV-RMA-260419-0012',
  productTitle: 'Aegis Ultra RTX 5090 Gaming PC',
  buildNumber: '073',
  returnReason: 'Intermittent boot failures under gaming load.',
  refundAmountGbp: 4499.00,
  returnLabelUrl: 'https://birmingham-av.com/account/returns/BAV-RMA-260419-0012/label.pdf',
  returnAddressBlock: 'Birmingham AV Ltd — Returns\nUnit 3, The Jewellery Quarter\nBirmingham B18 6DT\nUnited Kingdom',
  expectedTurnaroundDays: 5,
} as ReturnAuthorisedProps;
