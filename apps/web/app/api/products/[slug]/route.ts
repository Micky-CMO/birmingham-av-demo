import { getProductBySlug } from '@/lib/services/products';
import { bad, handleError, ok } from '@/lib/json';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const data = await getProductBySlug(params.slug);
    if (!data) return bad(404, 'not found');
    return ok({
      product: {
        productId: data.product.productId,
        slug: data.product.slug,
        sku: data.product.sku,
        title: data.product.title,
        subtitle: data.product.subtitle,
        conditionGrade: data.product.conditionGrade,
        priceGbp: Number(data.product.priceGbp),
        compareAtGbp: data.product.compareAtGbp ? Number(data.product.compareAtGbp) : null,
        warrantyMonths: data.product.warrantyMonths,
        isActive: data.product.isActive,
        category: { slug: data.product.category.slug, name: data.product.category.name },
        builder: {
          builderCode: data.product.builder.builderCode,
          displayName: data.product.builder.displayName,
          qualityScore: Number(data.product.builder.qualityScore),
          totalUnitsBuilt: data.product.builder.totalUnitsBuilt,
        },
        stockQty: data.product.inventory?.stockQty ?? 0,
      },
      catalog: data.catalog ?? null,
    });
  } catch (err) {
    return handleError(err);
  }
}
