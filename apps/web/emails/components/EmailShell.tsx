import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import type { ReactNode } from 'react';

/**
 * Base shell wrapping every Birmingham AV transactional email.
 *
 * Design decisions for email-client compatibility:
 * - Fraunces variable font unsupported in Outlook; we fall back to Georgia.
 * - All colours inlined as hex (no CSS variables — Gmail strips them).
 * - Max width 640px, table-based by virtue of react-email primitives.
 * - Preheader hidden text for inbox preview.
 */
export type EmailShellProps = {
  preheader: string;
  children: ReactNode;
  footerNote?: string;
};

const PAPER = '#F7F5F2';
const INK = '#17140F';
const INK_60 = 'rgba(23, 20, 15, 0.6)';
const INK_30 = 'rgba(23, 20, 15, 0.3)';
const INK_10 = 'rgba(23, 20, 15, 0.1)';

const MAX_WIDTH = 640;

export function EmailShell({ preheader, children, footerNote }: EmailShellProps) {
  return (
    <Html lang="en-GB">
      <Head>
        <Font
          fontFamily="Fraunces"
          fallbackFontFamily={['Georgia', 'serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Instrument Sans"
          fallbackFontFamily={['Arial', 'Helvetica', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/instrumentsans/v1/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-ep5UcqyL-uQUE8WhQ.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preheader}</Preview>
      <Body style={{ backgroundColor: PAPER, fontFamily: 'Instrument Sans, Arial, sans-serif', margin: 0, padding: '32px 16px' }}>
        <Container style={{ backgroundColor: PAPER, maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          {/* Wordmark */}
          <Section style={{ textAlign: 'center', padding: '32px 0 24px' }}>
            <Text
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 26,
                letterSpacing: '-0.015em',
                color: INK,
                margin: 0,
              }}
            >
              Birmingham AV
            </Text>
          </Section>

          <Hr style={{ borderColor: INK_10, borderWidth: 1, margin: 0 }} />

          {/* Body */}
          <Section style={{ padding: '40px 24px' }}>{children}</Section>

          <Hr style={{ borderColor: INK_10, borderWidth: 1, margin: 0 }} />

          {/* Footer */}
          <Section style={{ padding: '32px 24px 48px', textAlign: 'center' }}>
            {footerNote && (
              <Text
                style={{
                  fontFamily: 'Instrument Sans, Arial, sans-serif',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: INK_60,
                  margin: '0 0 24px',
                }}
              >
                {footerNote}
              </Text>
            )}
            <Text
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11,
                letterSpacing: '0.14em',
                color: INK_60,
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}
            >
              Birmingham AV Ltd · Reg. No. 12383651
            </Text>
            <Text
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11,
                letterSpacing: '0.14em',
                color: INK_30,
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Computers, considered.
            </Text>
            <Text
              style={{
                fontFamily: 'Instrument Sans, Arial, sans-serif',
                fontSize: 12,
                color: INK_30,
                margin: '24px 0 0',
              }}
            >
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://birmingham-av.com'}/account/notifications`}
                style={{ color: INK_30, textDecoration: 'underline' }}
              >
                Email preferences
              </Link>
              {'  ·  '}
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://birmingham-av.com'}/unsubscribe`}
                style={{ color: INK_30, textDecoration: 'underline' }}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const TOKENS = {
  PAPER,
  INK,
  INK_60,
  INK_30,
  INK_10,
  MAX_WIDTH,
  displayFont: 'Fraunces, Georgia, serif',
  sansFont: 'Instrument Sans, Arial, sans-serif',
  monoFont: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
