import type { ReactElement } from 'react';

/**
 * schema.org/BreadcrumbList JSON-LD.
 *
 * Accepts an ordered list of crumbs; the component handles absolute URL
 * resolution so callers can pass relative paths like "/shop".
 */

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
  baseUrl?: string;
}

function resolveBaseUrl(baseUrl?: string): string {
  if (baseUrl) return baseUrl.replace(/\/$/, '');
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  return 'https://birmingham-av.com';
}

function absolute(origin: string, url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function BreadcrumbSchema({ items, baseUrl }: BreadcrumbSchemaProps): ReactElement | null {
  if (items.length === 0) return null;
  const origin = resolveBaseUrl(baseUrl);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(origin, item.url),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
