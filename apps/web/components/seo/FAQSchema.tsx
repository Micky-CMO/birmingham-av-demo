import type { ReactElement } from 'react';

/**
 * schema.org/FAQPage JSON-LD.
 *
 * Intended for help articles and policy pages where the body is structured
 * as Q/A pairs. Answers are inserted verbatim as text (not HTML). If callers
 * need HTML in answers they must strip it before passing in; Google's FAQ
 * rich result spec accepts limited inline HTML but we keep this component
 * strict-text to avoid injection / malformed JSON.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSchemaProps {
  faqs: FAQItem[];
}

export function FAQSchema({ faqs }: FAQSchemaProps): ReactElement | null {
  if (faqs.length === 0) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
