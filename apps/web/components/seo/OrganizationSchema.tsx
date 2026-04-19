import type { ReactElement } from 'react';

/**
 * schema.org/Organization JSON-LD for the homepage.
 *
 * Declares Birmingham AV Ltd, its registered address, logo, and contact
 * surface. `sameAs` left empty for now — will be filled once the official
 * social accounts are created. VAT number read from env, falls back to the
 * placeholder format so the JSON remains valid during development.
 */

const REGISTERED_ADDRESS = {
  streetAddress: '13 Stephenson Street',
  addressLocality: 'Birmingham',
  addressRegion: 'West Midlands',
  postalCode: 'B2 4BH',
  addressCountry: 'GB',
} as const;

export interface OrganizationSchemaProps {
  baseUrl?: string;
  sameAs?: string[];
}

function resolveBaseUrl(baseUrl?: string): string {
  if (baseUrl) return baseUrl.replace(/\/$/, '');
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  return 'https://birmingham-av.com';
}

export function OrganizationSchema({
  baseUrl,
  sameAs = [],
}: OrganizationSchemaProps): ReactElement {
  const origin = resolveBaseUrl(baseUrl);
  const vat = process.env.NEXT_PUBLIC_VAT_NUMBER ?? 'GB123456789';

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}#organization`,
    name: 'Birmingham AV',
    legalName: 'Birmingham AV Ltd',
    url: origin,
    logo: {
      '@type': 'ImageObject',
      url: `${origin}/brand/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${origin}/brand/logo.png`,
    description:
      'UK retailer of new and refurbished PCs, laptops, monitors, projectors and network equipment. Every custom machine hand-assembled by an in-house builder.',
    address: {
      '@type': 'PostalAddress',
      ...REGISTERED_ADDRESS,
    },
    vatID: vat,
    taxID: vat,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        areaServed: 'GB',
        availableLanguage: ['en-GB'],
        url: `${origin}/support`,
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        areaServed: 'GB',
        availableLanguage: ['en-GB'],
        url: `${origin}/contact`,
      },
    ],
    sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
