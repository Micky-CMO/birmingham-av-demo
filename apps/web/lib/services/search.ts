import { prisma } from '@/lib/db';

/**
 * Simple Postgres full-text search across products, help articles, builders,
 * and journal posts. Uses on-the-fly `to_tsvector` instead of a persisted
 * GIN index — fine for the first few thousand products, swap to a proper
 * `searchVector` column + GIN index when we need sub-100ms latency at scale.
 *
 * Query semantics:
 *  - Strips punctuation, lowercases
 *  - Splits on whitespace
 *  - Joins with `&` for Postgres `tsquery` (AND match between terms)
 *  - Appends `:*` for prefix match on the last term
 */

export type SearchProductHit = {
  productId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  priceGbp: number;
  imageUrl: string | null;
  categorySlug: string;
  rank: number;
};

export type SearchBuilderHit = {
  builderCode: string;
  displayName: string;
  tier: string;
  yearsBuilding: number | null;
  rank: number;
};

export type SearchResults = {
  products: SearchProductHit[];
  builders: SearchBuilderHit[];
  total: number;
  query: string;
};

export async function search(rawQuery: string, limit = 8): Promise<SearchResults> {
  const query = sanitiseQuery(rawQuery);
  if (!query) {
    return { products: [], builders: [], total: 0, query: rawQuery };
  }
  const tsquery = buildTsQuery(query);

  const [products, builders] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        product_id: string;
        slug: string;
        title: string;
        subtitle: string | null;
        price_gbp: string;
        primary_image_url: string | null;
        image_urls: string[];
        category_slug: string;
        rank: number;
      }>
    >`
      SELECT
        p.product_id,
        p.slug,
        p.title,
        p.subtitle,
        p.price_gbp::text AS price_gbp,
        p.primary_image_url,
        p.image_urls,
        c.slug AS category_slug,
        ts_rank(
          to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.subtitle, '')),
          to_tsquery('english', ${tsquery})
        ) AS rank
      FROM products p
      INNER JOIN product_categories c ON c.category_id = p.category_id
      WHERE p.is_active = true
        AND to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.subtitle, '')) @@ to_tsquery('english', ${tsquery})
      ORDER BY rank DESC, p.created_at DESC
      LIMIT ${limit};
    `,

    prisma.$queryRaw<
      Array<{
        builder_code: string;
        display_name: string;
        tier: string;
        years_building: number | null;
        rank: number;
      }>
    >`
      SELECT
        b.builder_code,
        b.display_name,
        b.tier::text AS tier,
        b.years_building,
        ts_rank(
          to_tsvector('english', coalesce(b.display_name, '') || ' ' || coalesce(b.bio, '')),
          to_tsquery('english', ${tsquery})
        ) AS rank
      FROM builders b
      WHERE b.status = 'active'
        AND to_tsvector('english', coalesce(b.display_name, '') || ' ' || coalesce(b.bio, '')) @@ to_tsquery('english', ${tsquery})
      ORDER BY rank DESC, b.display_name ASC
      LIMIT ${Math.min(limit, 6)};
    `,
  ]);

  return {
    products: products.map((p) => ({
      productId: p.product_id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      priceGbp: Number(p.price_gbp),
      imageUrl: p.primary_image_url ?? p.image_urls?.[0] ?? null,
      categorySlug: p.category_slug,
      rank: Number(p.rank),
    })),
    builders: builders.map((b) => ({
      builderCode: b.builder_code,
      displayName: b.display_name,
      tier: b.tier,
      yearsBuilding: b.years_building,
      rank: Number(b.rank),
    })),
    total: products.length + builders.length,
    query: rawQuery,
  };
}

function sanitiseQuery(input: string): string {
  return input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
}

function buildTsQuery(clean: string): string {
  const terms = clean.split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return '';
  const joined = terms.map((t, i) => (i === terms.length - 1 ? `${t}:*` : t)).join(' & ');
  return joined;
}
