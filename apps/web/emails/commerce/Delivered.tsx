import { Section, Text, Link } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';

export type DeliveredProps = {
  customerFirstName: string;
  orderNumber: string;
  productTitle: string;
  buildNumber?: string;
  builderName?: string | null;
  reviewUrl: string;
  returnUrl: string;
};

export default function Delivered({
  customerFirstName,
  orderNumber,
  productTitle,
  buildNumber,
  builderName,
  reviewUrl,
  returnUrl,
}: DeliveredProps) {
  const preheader = `${productTitle} delivered. Tell us how it went.`;

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
        — Delivered · {orderNumber}
        {buildNumber && ` · Build ${buildNumber}`}
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
        It's{' '}
        <span style={{ fontStyle: 'italic' }}>there</span>.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK, margin: '0 0 16px' }}>
        <strong>{productTitle}</strong> has been delivered{builderName ? `, signed into the world by ${builderName}` : ''}. Unbox it quietly, plug it in, press the power button and take a moment before you look at the bench report in the box.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK_60, margin: '0 0 32px' }}>
        The 12-month warranty starts today. A copy of this receipt + warranty card is in your account.
      </Text>

      <Section style={{ textAlign: 'center', marginBottom: 24 }}>
        <Link
          href={reviewUrl}
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
            marginBottom: 12,
          }}
        >
          Leave a review
        </Link>
      </Section>

      <Section style={{ textAlign: 'center' }}>
        <Link
          href={returnUrl}
          style={{
            fontFamily: TOKENS.sansFont,
            fontSize: 13,
            color: TOKENS.INK_60,
            textDecoration: 'underline',
          }}
        >
          Something wrong? Start a return →
        </Link>
      </Section>
    </EmailShell>
  );
}

Delivered.PreviewProps = {
  customerFirstName: 'Alex',
  orderNumber: 'BAV-260419-739201',
  productTitle: 'Aegis Ultra RTX 5090 Gaming PC',
  buildNumber: '073',
  builderName: 'Alfie Ashworth',
  reviewUrl: 'https://birmingham-av.com/product/aegis-ultra-rtx-5090/review?order=BAV-260419-739201',
  returnUrl: 'https://birmingham-av.com/returns/new?order=BAV-260419-739201',
} as DeliveredProps;
