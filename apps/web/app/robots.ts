import type { MetadataRoute } from 'next';

/**
 * /robots.txt — Next.js convention.
 *
 * Allow the entire storefront, block admin consoles, API endpoints,
 * authenticated pages, and the cart/checkout funnel (these produce
 * duplicate content and expose stale session state to crawlers).
 */

function resolveBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  return 'https://birmingham-av.com';
}

export default function robots(): MetadataRoute.Robots {
  const origin = resolveBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/auth/',
          '/checkout',
          '/cart',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
