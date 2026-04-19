import { Section, Text, Link } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';

export type PasswordResetProps = {
  resetUrl: string;
  requestedFromIp?: string | null;
  requestedAtReadable: string;
};

export default function PasswordReset({
  resetUrl,
  requestedFromIp,
  requestedAtReadable,
}: PasswordResetProps) {
  const preheader = `Reset your Birmingham AV password. Link expires in 60 minutes.`;

  return (
    <EmailShell
      preheader={preheader}
      footerNote="If you didn't request this, ignore it. Your password hasn't changed."
    >
      <Text
        style={{
          fontFamily: TOKENS.monoFont,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: TOKENS.INK_60,
          margin: 0,
        }}
      >
        — Password reset
      </Text>

      <Text
        style={{
          fontFamily: TOKENS.displayFont,
          fontSize: 48,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          color: TOKENS.INK,
          margin: '16px 0 24px',
          fontWeight: 300,
        }}
      >
        Reset your{' '}
        <span style={{ fontStyle: 'italic' }}>password</span>.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK, margin: '0 0 16px' }}>
        Click the link below to set a new password. It expires in 60 minutes.
      </Text>

      <Section style={{ textAlign: 'center', marginBottom: 32, marginTop: 32 }}>
        <Link
          href={resetUrl}
          style={{
            display: 'inline-block',
            backgroundColor: TOKENS.INK,
            color: TOKENS.PAPER,
            fontFamily: TOKENS.sansFont,
            fontSize: 13,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            padding: '18px 40px',
            textDecoration: 'none',
            border: `1px solid ${TOKENS.INK}`,
          }}
        >
          Set new password
        </Link>
      </Section>

      <Section style={{ paddingTop: 24, borderTop: `1px solid ${TOKENS.INK_10}` }}>
        <Text
          style={{
            fontFamily: TOKENS.monoFont,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: TOKENS.INK_60,
            margin: '0 0 12px',
          }}
        >
          — Request details
        </Text>
        <Text
          style={{
            fontFamily: TOKENS.monoFont,
            fontSize: 12,
            color: TOKENS.INK_60,
            margin: '0 0 6px',
          }}
        >
          When: {requestedAtReadable}
        </Text>
        {requestedFromIp && (
          <Text
            style={{
              fontFamily: TOKENS.monoFont,
              fontSize: 12,
              color: TOKENS.INK_60,
              margin: 0,
            }}
          >
            From: {requestedFromIp}
          </Text>
        )}
      </Section>

      <Section style={{ marginTop: 32 }}>
        <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 13, lineHeight: 1.6, color: TOKENS.INK_60, margin: 0 }}>
          Can't click the button? Paste this into your browser:
        </Text>
        <Text
          style={{
            fontFamily: TOKENS.monoFont,
            fontSize: 12,
            color: TOKENS.INK_60,
            margin: '8px 0 0',
            wordBreak: 'break-all',
          }}
        >
          {resetUrl}
        </Text>
      </Section>
    </EmailShell>
  );
}

PasswordReset.PreviewProps = {
  resetUrl: 'https://birmingham-av.com/auth/reset?token=xyz789abc123',
  requestedFromIp: '81.143.22.104',
  requestedAtReadable: '19 Apr 2026 at 02:14 BST',
} as PasswordResetProps;
