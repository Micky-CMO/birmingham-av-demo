import { Section, Text, Link } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';

export type DispatchedProps = {
  customerFirstName: string;
  orderNumber: string;
  courier: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDeliveryDate: string;
  itemCount: number;
  builderName?: string | null;
};

export default function Dispatched({
  customerFirstName,
  orderNumber,
  courier,
  trackingNumber,
  trackingUrl,
  estimatedDeliveryDate,
  itemCount,
  builderName,
}: DispatchedProps) {
  const preheader = `${orderNumber} is on its way. Track via ${courier}.`;

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
        — Dispatched · {orderNumber}
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
        Shipped,{' '}
        <span style={{ fontStyle: 'italic' }}>{customerFirstName}</span>.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK, margin: '0 0 16px' }}>
        {itemCount === 1 ? 'Your build has' : `All ${itemCount} items have`} left the workshop.
        {builderName && <> {builderName} signed the birth certificate before it went into the box.</>}
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK_60, margin: '0 0 32px' }}>
        Estimated delivery: <strong style={{ color: TOKENS.INK }}>{estimatedDeliveryDate}</strong>.
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
          Courier · {courier}
        </Text>
        <Text
          style={{
            fontFamily: TOKENS.monoFont,
            fontSize: 16,
            color: TOKENS.INK,
            margin: 0,
            letterSpacing: '0.04em',
          }}
        >
          {trackingNumber}
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', marginBottom: 16 }}>
        <Link
          href={trackingUrl}
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
          Track delivery
        </Link>
      </Section>
    </EmailShell>
  );
}

Dispatched.PreviewProps = {
  customerFirstName: 'Alex',
  orderNumber: 'BAV-260419-739201',
  courier: 'DPD',
  trackingNumber: '15501234567890',
  trackingUrl: 'https://track.dpd.co.uk/parcels/15501234567890',
  estimatedDeliveryDate: 'Tuesday, 23 April',
  itemCount: 1,
  builderName: 'Alfie Ashworth',
} as DispatchedProps;
