import { render } from '@react-email/render';
import { z } from 'zod';
import { handleError, parseQuery } from '@/lib/json';
import { requireStaff } from '@/lib/session';

import WelcomeEmail from '@/emails/auth/Welcome';
import PasswordResetEmail from '@/emails/auth/PasswordReset';
import BusinessApplicationReceivedEmail from '@/emails/auth/BusinessApplicationReceived';
import OrderConfirmationEmail from '@/emails/commerce/OrderConfirmation';
import DispatchedEmail from '@/emails/commerce/Dispatched';
import DeliveredEmail from '@/emails/commerce/Delivered';
import ReturnAuthorisedEmail from '@/emails/returns/ReturnAuthorised';
import RefundIssuedEmail from '@/emails/returns/RefundIssued';

export const dynamic = 'force-dynamic';

const SAMPLE = {
  welcome: {
    customerFirstName: 'Alex',
    verifyUrl: 'https://birmingham-av.com/auth/verify?token=abc123def456',
  },
  'password-reset': {
    resetUrl: 'https://birmingham-av.com/auth/reset?token=xyz789abc123',
    requestedFromIp: '81.143.22.104',
    requestedAtReadable: '19 Apr 2026 at 02:14 BST',
  },
  'business-application-received': {
    contactFirstName: 'Priya',
    companyName: 'Northgate Post-Production Ltd.',
  },
  'order-confirmation': {
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
  },
  dispatched: {
    customerFirstName: 'Alex',
    orderNumber: 'BAV-260419-739201',
    courier: 'DPD',
    trackingNumber: '15501234567890',
    trackingUrl: 'https://track.dpd.co.uk/parcels/15501234567890',
    estimatedDeliveryDate: 'Tuesday, 23 April',
    itemCount: 1,
    builderName: 'Alfie Ashworth',
  },
  delivered: {
    customerFirstName: 'Alex',
    orderNumber: 'BAV-260419-739201',
    productTitle: 'Aegis Ultra RTX 5090 Gaming PC',
    buildNumber: '073',
    builderName: 'Alfie Ashworth',
    reviewUrl:
      'https://birmingham-av.com/product/aegis-ultra-rtx-5090/review?order=BAV-260419-739201',
    returnUrl: 'https://birmingham-av.com/returns/new?order=BAV-260419-739201',
  },
  'return-authorised': {
    customerFirstName: 'Alex',
    returnNumber: 'BAV-RMA-260419-0012',
    productTitle: 'Aegis Ultra RTX 5090 Gaming PC',
    buildNumber: '073',
    returnReason: 'Intermittent boot failures under gaming load.',
    refundAmountGbp: 4499.0,
    returnLabelUrl:
      'https://birmingham-av.com/account/returns/BAV-RMA-260419-0012/label.pdf',
    returnAddressBlock:
      'Birmingham AV Ltd — Returns\nUnit 3, The Jewellery Quarter\nBirmingham B18 6DT\nUnited Kingdom',
    expectedTurnaroundDays: 5,
  },
  'refund-issued': {
    customerFirstName: 'Alex',
    returnNumber: 'BAV-RMA-260419-0012',
    productTitle: 'Aegis Ultra RTX 5090 Gaming PC',
    refundAmountGbp: 4499.0,
    refundMethodLabel: 'Visa ending 6411',
    expectedSettleWorkingDays: 3,
    accountUrl: 'https://birmingham-av.com/account/returns/BAV-RMA-260419-0012',
  },
} as const;

const QuerySchema = z.object({
  slug: z.enum([
    'welcome',
    'password-reset',
    'business-application-received',
    'order-confirmation',
    'dispatched',
    'delivered',
    'return-authorised',
    'refund-issued',
  ]),
});

export async function GET(request: Request) {
  try {
    await requireStaff();
    const { slug } = parseQuery(request, QuerySchema);

    let html: string;
    switch (slug) {
      case 'welcome':
        html = await render(WelcomeEmail(SAMPLE.welcome));
        break;
      case 'password-reset':
        html = await render(PasswordResetEmail(SAMPLE['password-reset']));
        break;
      case 'business-application-received':
        html = await render(
          BusinessApplicationReceivedEmail(SAMPLE['business-application-received'])
        );
        break;
      case 'order-confirmation':
        html = await render(OrderConfirmationEmail(SAMPLE['order-confirmation']));
        break;
      case 'dispatched':
        html = await render(DispatchedEmail(SAMPLE.dispatched));
        break;
      case 'delivered':
        html = await render(DeliveredEmail(SAMPLE.delivered));
        break;
      case 'return-authorised':
        html = await render(ReturnAuthorisedEmail(SAMPLE['return-authorised']));
        break;
      case 'refund-issued':
        html = await render(RefundIssuedEmail(SAMPLE['refund-issued']));
        break;
    }

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleError(err);
  }
}
