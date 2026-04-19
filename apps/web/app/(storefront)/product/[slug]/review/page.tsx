import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { ReviewSubmissionForm } from './ReviewSubmissionForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: `Write a review — ${params.slug}`,
    description: 'Leave a review for your Birmingham AV purchase.',
    robots: { index: false, follow: false },
  };
}

function buildNumberFromSku(sku: string): string {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return '000';
  return m[1].padStart(3, '0').slice(-3);
}

/**
 * /product/[slug]/review?orderItem=…
 *
 * Renders a review submission form for a verified purchase. The page enforces:
 *   1. caller is signed in — otherwise redirect to /auth/login
 *   2. `orderItem` search param is present — otherwise 404
 *   3. the OrderItem belongs to the caller and to a shipped/delivered order
 *   4. the OrderItem's product slug matches the URL slug
 */
export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { orderItem?: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?next=/product/${params.slug}/review?orderItem=${searchParams.orderItem ?? ''}`);
  }

  const orderItemId = searchParams.orderItem;
  if (!orderItemId) notFound();

  const item = await prisma.orderItem.findUnique({
    where: { orderItemId },
    include: {
      order: { select: { userId: true, status: true, orderNumber: true } },
      product: {
        select: {
          productId: true,
          slug: true,
          title: true,
          sku: true,
          builder: { select: { displayName: true, builderCode: true } },
        },
      },
    },
  });

  if (!item) notFound();
  if (item.order.userId !== user.userId) notFound();
  if (item.product.slug !== params.slug) notFound();
  if (!['shipped', 'delivered'].includes(item.order.status)) notFound();

  return (
    <ReviewSubmissionForm
      productId={item.product.productId}
      orderItemId={item.orderItemId}
      product={{
        title: item.product.title,
        slug: item.product.slug,
        sku: item.product.sku,
        buildNumber: buildNumberFromSku(item.product.sku),
      }}
      builder={{
        displayName: item.product.builder.displayName,
        builderCode: item.product.builder.builderCode,
      }}
    />
  );
}
