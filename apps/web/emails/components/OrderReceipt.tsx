import { Section, Row, Column, Text, Hr, Link } from '@react-email/components';
import { TOKENS } from './EmailShell';

export type OrderLine = {
  productId: string;
  title: string;
  subtitle?: string | null;
  buildNumber?: string;
  qty: number;
  pricePerUnitGbp: number;
  imageUrl?: string | null;
};

export type OrderReceiptProps = {
  orderNumber: string;
  items: OrderLine[];
  subtotalGbp: number;
  shippingGbp: number;
  totalGbp: number;
  trackingUrl?: string | null;
};

function formatGbp(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrderReceipt({
  orderNumber,
  items,
  subtotalGbp,
  shippingGbp,
  totalGbp,
  trackingUrl,
}: OrderReceiptProps) {
  return (
    <Section>
      <Row>
        <Column>
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
            — Order {orderNumber}
          </Text>
        </Column>
      </Row>

      <Hr style={{ borderColor: TOKENS.INK_10, margin: '16px 0 0' }} />

      {items.map((item, idx) => (
        <div key={item.productId}>
          <Row style={{ padding: '20px 0' }}>
            <Column width="60" style={{ verticalAlign: 'top', paddingRight: 16 }}>
              {/* Mini №buildNumber canvas — Fraunces italic */}
              <div
                style={{
                  width: 48,
                  height: 60,
                  background: `linear-gradient(140deg, #EDE9E3 0%, #E3DED6 100%)`,
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  lineHeight: '60px',
                }}
              >
                <span
                  style={{
                    fontFamily: TOKENS.displayFont,
                    fontStyle: 'italic',
                    fontSize: 18,
                    color: 'rgba(23,20,15,0.20)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {item.buildNumber ?? '—'}
                </span>
              </div>
            </Column>
            <Column style={{ verticalAlign: 'top' }}>
              <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: TOKENS.INK, margin: 0 }}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text
                  style={{
                    fontFamily: TOKENS.monoFont,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: TOKENS.INK_60,
                    margin: '6px 0 0',
                  }}
                >
                  {item.subtitle}
                </Text>
              )}
              <Text
                style={{
                  fontFamily: TOKENS.monoFont,
                  fontSize: 12,
                  color: TOKENS.INK_60,
                  margin: '8px 0 0',
                }}
              >
                Qty {item.qty} × {formatGbp(item.pricePerUnitGbp)}
              </Text>
            </Column>
            <Column align="right" style={{ verticalAlign: 'top' }}>
              <Text style={{ fontFamily: TOKENS.monoFont, fontSize: 14, color: TOKENS.INK, margin: 0 }}>
                {formatGbp(item.pricePerUnitGbp * item.qty)}
              </Text>
            </Column>
          </Row>
          {idx < items.length - 1 && <Hr style={{ borderColor: TOKENS.INK_10, margin: 0 }} />}
        </div>
      ))}

      <Hr style={{ borderColor: TOKENS.INK_10, margin: '0 0 20px' }} />

      {/* Totals */}
      <Row>
        <Column>
          <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 13, color: TOKENS.INK_60, margin: 0 }}>
            Subtotal
          </Text>
        </Column>
        <Column align="right">
          <Text style={{ fontFamily: TOKENS.monoFont, fontSize: 13, color: TOKENS.INK, margin: 0 }}>
            {formatGbp(subtotalGbp)}
          </Text>
        </Column>
      </Row>
      <Row style={{ marginTop: 8 }}>
        <Column>
          <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 13, color: TOKENS.INK_60, margin: 0 }}>
            Shipping
          </Text>
        </Column>
        <Column align="right">
          <Text style={{ fontFamily: TOKENS.monoFont, fontSize: 13, color: TOKENS.INK, margin: 0 }}>
            {shippingGbp === 0 ? 'Free' : formatGbp(shippingGbp)}
          </Text>
        </Column>
      </Row>

      <Hr style={{ borderColor: TOKENS.INK_10, margin: '16px 0' }} />

      <Row>
        <Column>
          <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 14, fontWeight: 500, color: TOKENS.INK, margin: 0 }}>
            Total
          </Text>
        </Column>
        <Column align="right">
          <Text style={{ fontFamily: TOKENS.monoFont, fontSize: 18, color: TOKENS.INK, margin: 0 }}>
            {formatGbp(totalGbp)}
          </Text>
        </Column>
      </Row>

      {trackingUrl && (
        <Section style={{ marginTop: 32, textAlign: 'center' }}>
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
            Track your order
          </Link>
        </Section>
      )}
    </Section>
  );
}
