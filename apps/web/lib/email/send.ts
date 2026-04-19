import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

/**
 * Thin wrapper around Resend for transactional email. Handles:
 * - Template rendering via @react-email/render
 * - Sender fallback to @resend.dev when no verified domain configured yet
 * - Silent noop in dev when RESEND_API_KEY is missing (logs the preview instead)
 *
 * Usage:
 *   import OrderConfirmation from '@/emails/commerce/OrderConfirmation';
 *   await sendEmail({
 *     to: order.customerEmail,
 *     subject: `Order ${order.orderNumber} confirmed`,
 *     template: <OrderConfirmation {...orderProps} />,
 *   });
 */

const resendApiKey = process.env.RESEND_API_KEY;
const senderAddress = process.env.RESEND_FROM_EMAIL ?? 'orders@resend.dev';
const replyToAddress = process.env.RESEND_REPLY_TO ?? 'support@birmingham-av.com';

// Lazy singleton — only instantiate when we actually have a key.
let client: Resend | null = null;
function getClient(): Resend | null {
  if (!resendApiKey) return null;
  if (!client) client = new Resend(resendApiKey);
  return client;
}

export type SendEmailArgs = {
  to: string | string[];
  subject: string;
  template: ReactElement;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendEmailResult =
  | { sent: true; messageId: string }
  | { sent: false; reason: 'no_api_key' | 'resend_error'; detail?: string };

export async function sendEmail({
  to,
  subject,
  template,
  replyTo,
  tags,
}: SendEmailArgs): Promise<SendEmailResult> {
  const html = await render(template);
  const text = await render(template, { plainText: true });

  const rc = getClient();
  if (!rc) {
    // Dev path — no API key configured yet. Log enough to debug but don't throw.
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    console.log(`[email:noop] would send "${subject}" to ${recipients} — RESEND_API_KEY not set`);
    console.log(`[email:noop] html length: ${html.length}, text length: ${text.length}`);
    return { sent: false, reason: 'no_api_key' };
  }

  const result = await rc.emails.send({
    from: `Birmingham AV <${senderAddress}>`,
    to: Array.isArray(to) ? to : [to],
    replyTo: replyTo ?? replyToAddress,
    subject,
    html,
    text,
    tags,
  });

  if (result.error) {
    console.error(`[email:error] ${subject} → ${to}:`, result.error);
    return { sent: false, reason: 'resend_error', detail: String(result.error.message ?? result.error) };
  }

  return { sent: true, messageId: result.data?.id ?? 'unknown' };
}

/**
 * Simple typed helper for each canonical email. Use this in API routes /
 * webhooks / background jobs so call sites stay tidy and the template map is
 * a single place to grep when adding new emails.
 */
import WelcomeEmail, { type WelcomeProps } from '@/emails/auth/Welcome';
import PasswordResetEmail, { type PasswordResetProps } from '@/emails/auth/PasswordReset';
import BusinessApplicationReceivedEmail, {
  type BusinessApplicationReceivedProps,
} from '@/emails/auth/BusinessApplicationReceived';
import OrderConfirmationEmail, { type OrderConfirmationProps } from '@/emails/commerce/OrderConfirmation';
import DispatchedEmail, { type DispatchedProps } from '@/emails/commerce/Dispatched';
import DeliveredEmail, { type DeliveredProps } from '@/emails/commerce/Delivered';
import AbandonedCartEmail, { type AbandonedCartProps } from '@/emails/commerce/AbandonedCart';
import ReturnAuthorisedEmail, { type ReturnAuthorisedProps } from '@/emails/returns/ReturnAuthorised';
import RefundIssuedEmail, { type RefundIssuedProps } from '@/emails/returns/RefundIssued';

export const bavEmail = {
  welcome: (to: string, props: WelcomeProps) =>
    sendEmail({
      to,
      subject: 'Welcome to Birmingham AV — verify your email',
      template: WelcomeEmail(props),
      tags: [{ name: 'category', value: 'auth-welcome' }],
    }),

  passwordReset: (to: string, props: PasswordResetProps) =>
    sendEmail({
      to,
      subject: 'Reset your Birmingham AV password',
      template: PasswordResetEmail(props),
      tags: [{ name: 'category', value: 'auth-password-reset' }],
    }),

  businessApplicationReceived: (to: string, props: BusinessApplicationReceivedProps) =>
    sendEmail({
      to,
      subject: `Trade account application received — ${props.companyName}`,
      template: BusinessApplicationReceivedEmail(props),
      tags: [{ name: 'category', value: 'auth-business-application' }],
    }),

  orderConfirmation: (to: string, props: OrderConfirmationProps) =>
    sendEmail({
      to,
      subject: `Order ${props.orderNumber} confirmed · thank you, ${props.customerFirstName}`,
      template: OrderConfirmationEmail(props),
      tags: [
        { name: 'category', value: 'commerce-order' },
        { name: 'orderNumber', value: props.orderNumber },
      ],
    }),

  dispatched: (to: string, props: DispatchedProps) =>
    sendEmail({
      to,
      subject: `${props.orderNumber} · dispatched via ${props.courier}`,
      template: DispatchedEmail(props),
      tags: [
        { name: 'category', value: 'commerce-dispatched' },
        { name: 'orderNumber', value: props.orderNumber },
      ],
    }),

  abandonedCart: (to: string, props: AbandonedCartProps) =>
    sendEmail({
      to,
      subject: `Still in your cart · ${props.items[0]?.title ?? 'your build'}`,
      template: AbandonedCartEmail(props),
      tags: [
        { name: 'category', value: 'commerce-abandoned-cart' },
      ],
    }),

  delivered: (to: string, props: DeliveredProps) =>
    sendEmail({
      to,
      subject: `${props.productTitle} delivered · order ${props.orderNumber}`,
      template: DeliveredEmail(props),
      tags: [
        { name: 'category', value: 'commerce-delivered' },
        { name: 'orderNumber', value: props.orderNumber },
      ],
    }),

  returnAuthorised: (to: string, props: ReturnAuthorisedProps) =>
    sendEmail({
      to,
      subject: `Return ${props.returnNumber} authorised`,
      template: ReturnAuthorisedEmail(props),
      tags: [
        { name: 'category', value: 'returns-authorised' },
        { name: 'returnNumber', value: props.returnNumber },
      ],
    }),

  refundIssued: (to: string, props: RefundIssuedProps) =>
    sendEmail({
      to,
      subject: `Refund issued · return ${props.returnNumber}`,
      template: RefundIssuedEmail(props),
      tags: [
        { name: 'category', value: 'returns-refunded' },
        { name: 'returnNumber', value: props.returnNumber },
      ],
    }),
};
