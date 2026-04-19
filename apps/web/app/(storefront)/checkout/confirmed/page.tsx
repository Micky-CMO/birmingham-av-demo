import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Thin redirect helper. The old checkout flow landed users on
 * `/checkout/confirmed?order=BAV-260418-739201`; the post-port canonical
 * destination is `/account/orders/{orderNumber}?confirmed=1` which renders
 * the celebration layout (artefact 9) and then strips the param on mount.
 */
export default function CheckoutConfirmedRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams.order ?? searchParams.orderNumber;
  const orderNumber = Array.isArray(raw) ? raw[0] : raw;

  if (!orderNumber) {
    redirect('/account/orders');
  }
  redirect(`/account/orders/${orderNumber}?confirmed=1`);
}
