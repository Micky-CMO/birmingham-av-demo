import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

/**
 * XML sitemap, served at /sitemap.xml by Next.js convention.
 *
 * Static pages carry descending priority by business intent: the home page
 * is the anchor, product & category routes drive discovery, content pages
 * are supportive, legal pages are indexable but low-priority.
 *
 * Dynamic entries are pulled from Prisma: every active product, every
 * category, and every active (non-offboarded) builder. Inactive products
 * are excluded so crawlers don't index dead listings when we rotate stock.
 */

export const dynamic = 'force-dynamic';
// Revalidate at most once per hour — product catalogue shifts frequently.
export const revalidate = 3600;

interface StaticEntry {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}

// Static routes grouped by their SEO weight.
const STATIC_ENTRIES: StaticEntry[] = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/builders', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/journal', priority: 0.6, changeFrequency: 'weekly' },
  // Editorial / content pages — monthly churn, medium priority.
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/warehouses', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/careers', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/help', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/warranty', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/shipping', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/av-care', priority: 0.6, changeFrequency: 'monthly' },
  // Policies — indexable but low-priority.
  { path: '/returns-policy', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/cookies', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/modern-slavery', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/accessibility', priority: 0.3, changeFrequency: 'monthly' },
];

function resolveBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  return 'https://birmingham-av.com';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = resolveBaseUrl();
  const now = new Date();

  // Fetch dynamic content in parallel. If the DB is down we still return the
  // static skeleton — a partial sitemap is better than a 500.
  let products: Array<{ slug: string; updatedAt: Date }> = [];
  let categories: Array<{ slug: string; updatedAt: Date }> = [];
  let builders: Array<{ builderCode: string; updatedAt: Date }> = [];

  try {
    [products, categories, builders] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.productCategory.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.builder.findMany({
        where: { status: { in: ['active', 'review'] } },
        select: { builderCode: true, updatedAt: true },
      }),
    ]);
  } catch {
    // Database unreachable at build/request time. Fall back to static-only.
  }

  const staticSitemap: MetadataRoute.Sitemap = STATIC_ENTRIES.map((e) => ({
    url: `${origin}${e.path}`,
    lastModified: now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));

  const productSitemap: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${origin}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  const categorySitemap: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${origin}/shop/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const builderSitemap: MetadataRoute.Sitemap = builders.map((b) => ({
    url: `${origin}/builders/${b.builderCode}`,
    lastModified: b.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticSitemap, ...categorySitemap, ...productSitemap, ...builderSitemap];
}
