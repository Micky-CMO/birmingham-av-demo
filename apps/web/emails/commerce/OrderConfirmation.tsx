import { Section, Text, Link, Row, Column } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';
import { OrderReceipt, type OrderLine } from '../components/OrderReceipt';

export type OrderConfirmationProps = {
  customerFirstName: string;
  orderNumber: string;
  items: OrderLine[];
  subtotalGbp: number;
  shippingGbp: number;
  totalGbp: number;
  builderNames: string[];
  estimatedDispatchDate: string;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    postcode: string;
    countryIso2: string;
  };
  orderTrackingUrl: string;
};

export default function OrderConfirmation({
  customerFirstName,
  orderNumber,
  items,
  subtotalGbp,
  shippingGbp,
  totalGbp,
  builderNames,
  estimatedDispatchDate,
  shippingAddress,
  orderTrackingUrl,
}: OrderConfirmationProps) {
  const preheader = `Order ${orderNumber} confirmed · ${items.length} item${items.length === 1 ? '' : 's'} · ${builderNames.length === 1 ? `Built by ${builderNames[0]}` : `Built by ${builderNames.length} builders`}`;

  const builderLine =
    builderNames.length === 0
      ? 'Your build will be assigned and begin within the hour.'
      : builderNames.length === 1
        ? `${builderNames[0]} has been assigned and will begin picking components within the hour.`
        : `${builderNames.join(', ')} have been assigned to your order and will begin within the hour.`;

  return (
    <EmailShell
      preheader={preheader}
      footerNote="Questions? Reply to this email and a human will answer."
    >
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
        — Thank you, {customerFirstName}
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
        Your order is in{' '}
        <span style={{ fontStyle: 'italic' }}>hand</span>.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK, margin: '0 0 16px' }}>
        {builderLine}
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK_60, margin: '0 0 40px' }}>
        Expected dispatch: <strong style={{ color: TOKENS.INK }}>{estimatedDispatchDate}</strong>. You'll get another email when your build ships.
      </Text>

      <OrderReceipt
        orderNumber={orderNumber}
        items={items}
        subtotalGbp={subtotalGbp}
        shippingGbp={shippingGbp}
        totalGbp={totalGbp}
        trackingUrl={orderTrackingUrl}
      />

      <Section style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${TOKENS.INK_10}` }}>
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
          — Shipping to
        </Text>
        <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 14, lineHeight: 1.7, color: TOKENS.INK, margin: 0 }}>
          {shippingAddress.line1}
          {shippingAddress.line2 && <><br />{shippingAddress.line2}</>}
          <br />
          {shippingAddress.city}
          <br />
          {shippingAddress.postcode}
          <br />
          {shippingAddress.countryIso2 === 'GB' ? 'United Kingdom' : shippingAddress.countryIso2}
        </Text>
      </Section>
    </EmailShell>
  );
}

OrderConfirmation.PreviewProps = {
  customerFirstName: 'Alex',
  orderNumber: 'BAV-260419-739201',
  items: [
    {
      productId: 'p001',
      title: 'Aegis Ultra RTX 5090 Gaming PC',
      subtitle: 'i9-14900KS · RTX 5090 · 64GB DDR5 · 4TB NVMe',
      buildNumber: '073',
      qty: 1,
      pricePerUnitGbp: 4499,
    },
  ],
  subtotalGbp: 4499,
  shippingGbp: 0,
  totalGbp: 4499,
  builderNames: ['Alfie Ashworth'],
  estimatedDispatchDate: 'Monday, 22 April',
  shippingAddress: {
    line1: '14 Broad Street',
    city: 'Birmingham',
    postcode: 'B1 1BB',
    countryIso2: 'GB',
  },
  orderTrackingUrl: 'https://birmingham-av.com/account/orders/BAV-260419-739201',
} as OrderConfirmationProps;
