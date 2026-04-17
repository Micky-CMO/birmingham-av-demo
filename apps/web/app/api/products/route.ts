import type { NextRequest } from 'next/server';
import { listProducts } from '@/lib/services/products';
import { ProductListQuerySchema } from '@bav/lib/schemas';
import { handleError, ok, parseQuery } from '@/lib/json';

export async function GET(request: NextRequest) {
  try {
    const query = parseQuery(request, ProductListQuerySchema);
    const { items, total } = await listProducts(query);
    return ok({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    });
  } catch (err) {
    return handleError(err);
  }
}
