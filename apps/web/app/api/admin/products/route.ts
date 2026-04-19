import { z } from 'zod';
import { prisma } from '@/lib/db';
import { bad, handleError, ok, parseBody } from '@/lib/json';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const CreateProductSchema = z.object({
  title: z.string().trim().min(3).max(200),
  subtitle: z.string().trim().max(240).nullable().optional(),
  sku: z.string().trim().min(3).max(60),
  categoryId: z.string().uuid(),
  builderId: z.string().uuid(),
  priceGbp: z.number().nonnegative().max(99999),
  compareAtGbp: z.number().nonnegative().max(99999).nullable().optional(),
  conditionGrade: z.string().trim().min(3).max(40),
  warrantyMonths: z.number().int().min(0).max(120),
  stockQty: z.number().int().min(0).max(9999),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

/**
 * POST /api/admin/products — create a product.
 * Requires admin role on the session user.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad(401, 'not signed in');
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return bad(403, 'admin only');
    }

    const body = await parseBody(request, CreateProductSchema);

    const baseSlug = slugify(body.title);
    let slug = baseSlug;
    let n = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }

    const product = await prisma.product.create({
      data: {
        title: body.title,
        subtitle: body.subtitle ?? null,
        sku: body.sku,
        slug,
        categoryId: body.categoryId,
        builderId: body.builderId,
        priceGbp: body.priceGbp,
        compareAtGbp: body.compareAtGbp ?? null,
        conditionGrade: body.conditionGrade,
        warrantyMonths: body.warrantyMonths,
        primaryImageUrl: body.imageUrl ?? null,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        inventory: {
          create: {
            stockQty: body.stockQty,
            reorderThreshold: 1,
          },
        },
      },
    });

    return ok({ productId: product.productId, slug: product.slug });
  } catch (err) {
    return handleError(err);
  }
}
