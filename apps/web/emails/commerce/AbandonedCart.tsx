import { Section, Text, Link, Row, Column, Img } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';

export type AbandonedCartItem = {
  buildNumber: string;
  title: string;
  priceGbp: number;
  imageUrl?: string;
};

export type AbandonedCartProps = {
  customerFirstName: string;
  items: AbandonedCartItem[];
  cartRecoveryUrl: string;
  totalGbp: number;
  stockRemaining?: number | null;
};

function formatGbp(n: number): string {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AbandonedCart({
  customerFirstName,
  items,
  cartRecoveryUrl,
  totalGbp,
  stockRemaining,
}: AbandonedCartProps) {
  const firstTitle = items[0]?.title ?? 'your build';
  const preheader = `${firstTitle} is still waiting. Pick up where you left off.`;
  const showLowStock = typeof stockRemaining === 'number' && stockRemaining > 0 && stockRemaining <= 3;

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
        — Still in your cart
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
        Held,{' '}
        <span style={{ fontStyle: 'italic' }}>{customerFirstName}</span>.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK, margin: '0 0 16px' }}>
        {items.length === 1
          ? 'Your build is still on the bench, reserved for the next twenty-four hours.'
          : `All ${items.length} items in your cart are still held for you — reserved for the next twenty-four hours.`}
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK_60, margin: '0 0 32px' }}>
        No pressure — pick up where you left off when it suits you.
        {showLowStock && (
          <>
            {' '}
            Heads up: only <strong style={{ color: TOKENS.INK }}>{stockRemaining} left</strong> at this spec.
          </>
        )}
      </Text>

      {/* Cart items table */}
      <Section style={{ borderTop: `1px solid ${TOKENS.INK_10}`, marginBottom: 24 }}>
        {items.map((item, idx) => (
          <Row
            key={`${item.buildNumber}-${idx}`}
            style={{ borderBottom: `1px solid ${TOKENS.INK_10}`, padding: '20px 0' }}
          >
            <Column style={{ width: 72, verticalAlign: 'top', paddingRight: 16 }}>
              {item.imageUrl ? (
                <Img
                  src={item.imageUrl}
                  alt={item.title}
                  width="72"
                  height="72"
                  style={{ display: 'block', borderRadius: 2 }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    background: 'linear-gradient(140deg, #EDE9E3 0%, #E3DED6 100%)',
                    borderRadius: 2,
                  }}
                />
              )}
            </Column>
            <Column style={{ verticalAlign: 'top' }}>
              <Text
                style={{
                  fontFamily: TOKENS.monoFont,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  color: TOKENS.INK_60,
                  margin: '0 0 4px',
                  textTransform: 'uppercase',
                }}
              >
                №{item.buildNumber}
              </Text>
              <Text
                style={{
                  fontFamily: TOKENS.displayFont,
                  fontSize: 16,
                  lineHeight: 1.3,
                  color: TOKENS.INK,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {item.title}
              </Text>
            </Column>
            <Column style={{ verticalAlign: 'top', textAlign: 'right', width: 80 }}>
              <Text
                style={{
                  fontFamily: TOKENS.monoFont,
                  fontSize: 14,
                  color: TOKENS.INK,
                  margin: 0,
                }}
              >
                {formatGbp(item.priceGbp)}
              </Text>
            </Column>
          </Row>
        ))}
        <Row style={{ padding: '16px 0 0' }}>
          <Column>
            <Text
              style={{
                fontFamily: TOKENS.monoFont,
                fontSize: 11,
                letterSpacing: '0.14em',
                color: TOKENS.INK_60,
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              Subtotal
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text
              style={{
                fontFamily: TOKENS.monoFont,
                fontSize: 16,
                color: TOKENS.INK,
                margin: 0,
              }}
            >
              {formatGbp(totalGbp)}
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px' }}>
        <Link
          href={cartRecoveryUrl}
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
          Return to your cart
        </Link>
      </Section>

      <Text
        style={{
          fontFamily: TOKENS.sansFont,
          fontSize: 13,
          lineHeight: 1.5,
          color: TOKENS.INK_60,
          margin: '24px 0 0',
          textAlign: 'center',
        }}
      >
        Questions before you check out?{' '}
        <Link href="mailto:support@birmingham-av.com" style={{ color: TOKENS.INK }}>
          support@birmingham-av.com
        </Link>
        .
      </Text>
    </EmailShell>
  );
}

AbandonedCart.PreviewProps = {
  customerFirstName: 'Alex',
  items: [
    {
      buildNumber: '4120',
      title: 'Ryzen 7 / RTX 4070 gaming build',
      priceGbp: 1849,
      imageUrl: undefined,
    },
  ],
  cartRecoveryUrl: 'https://birmingham-av.com/cart?token=abc',
  totalGbp: 1849,
  stockRemaining: 2,
} as AbandonedCartProps;
