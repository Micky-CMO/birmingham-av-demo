import type { ReactElement } from 'react';

/**
 * schema.org/Product JSON-LD.
 *
 * Emits a well-formed Product graph including Offer, brand, itemCondition,
 * warranty as additionalProperty, and optional aggregateRating. Intended for
 * product detail pages. Server component — no hydration cost.
 */

export interface ProductSchemaProduct {
  title: string;
  description: string;
  sku: string;
  slug: string;
  priceGbp: number;
  compareAtGbp?: number | null;
  conditionGrade: string;
  imageUrls: string[];
  warrantyMonths: number;
  inStock: boolean;
  builderName: string;
  rating?: {
    value: number;
    count: number;
  } | null;
}

export interface ProductSchemaProps {
  product: ProductSchemaProduct;
  baseUrl?: string;
}

/**
 * Map an internal condition grade ("New", "Grade A", "Refurbished",
 * "Grade B", "Grade C") to the schema.org condition URL vocabulary.
 */
function mapCondition(grade: string): string {
  const g = grade.trim().toLowerCase();
  if (/^(brand\s*)?new$/.test(g)) return 'https://schema.org/NewCondition';
  if (g.includes('refurb') || g.startsWith('grade a') || g === 'grade-a') {
    return 'https://schema.org/RefurbishedCondition';
  }
  if (g.startsWith('grade b') || g === 'grade-b') return 'https://schema.org/UsedCondition';
  if (g.startsWith('grade c') || g === 'grade-c') return 'https://schema.org/UsedCondition';
  if (g.includes('used')) return 'https://schema.org/UsedCondition';
  return 'https://schema.org/RefurbishedCondition';
}

/**
 * Build a yyyy-MM-dd date ~90 days in the future for priceValidUntil.
 * schema.org strongly recommends the offer carry a validity window; GMB /
 * Merchant Center reject offers without it.
 */
function priceValidUntil(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 90);
  const iso = d.toISOString();
  return iso.slice(0, 10);
}

function resolveBaseUrl(baseUrl?: string): string {
  if (baseUrl) return baseUrl.replace(/\/$/, '');
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  return 'https://birmingham-av.com';
}

export function ProductSchema({ product, baseUrl }: ProductSchemaProps): ReactElement {
  const origin = resolveBaseUrl(baseUrl);
  const productUrl = `${origin}/product/${product.slug}`;
  const images = product.imageUrls
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .map((u) => (u.startsWith('http') ? u : `${origin}${u.startsWith('/') ? '' : '/'}${u}`));

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.title,
    description: product.description,
    sku: product.sku,
    url: productUrl,
    brand: {
      '@type': 'Brand',
      name: 'Birmingham AV',
    },
    image: images.length > 0 ? images : undefined,
    itemCondition: mapCondition(product.conditionGrade),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      price: product.priceGbp.toFixed(2),
      priceCurrency: 'GBP',
      priceValidUntil: priceValidUntil(),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: mapCondition(product.conditionGrade),
      seller: {
        '@type': 'Organization',
        name: 'Birmingham AV',
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Warranty',
        value: `${product.warrantyMonths} months parts and labour`,
      },
      {
        '@type': 'PropertyValue',
        name: 'Built by',
        value: product.builderName,
      },
      {
        '@type': 'PropertyValue',
        name: 'Condition',
        value: product.conditionGrade,
      },
    ],
  };

  if (product.compareAtGbp && product.compareAtGbp > product.priceGbp) {
    const offers = data['offers'] as Record<string, unknown>;
    offers['priceSpecification'] = {
      '@type': 'UnitPriceSpecification',
      price: product.priceGbp.toFixed(2),
      priceCurrency: 'GBP',
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: 1,
      },
    };
  }

  if (product.rating && product.rating.count > 0) {
    data['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.value.toFixed(2),
      reviewCount: product.rating.count,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify with a replacer to drop undefined keys
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
