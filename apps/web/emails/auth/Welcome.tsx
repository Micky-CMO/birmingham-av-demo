import { Section, Text, Link } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';

export type WelcomeProps = {
  customerFirstName: string;
  verifyUrl: string;
};

export default function Welcome({ customerFirstName, verifyUrl }: WelcomeProps) {
  const preheader = `Welcome to Birmingham AV. Verify your email to finish setting up.`;

  return (
    <EmailShell preheader={preheader}>
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
        — Account created
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
        Welcome,{' '}
        <span style={{ fontStyle: 'italic' }}>{customerFirstName}</span>.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK, margin: '0 0 16px' }}>
        Your account is set up. One last step — verify your email so we can reach you about orders, returns, and any build you register.
      </Text>

      <Text style={{ fontFamily: TOKENS.sansFont, fontSize: 16, lineHeight: 1.6, color: TOKENS.INK_60, margin: '0 0 32px' }}>
        The link expires in 24 hours. If you didn't create this account, you can ignore this email — nothing happens until the link is clicked.
      </Text>

      <Section style={{ textAlign: 'center', marginBottom: 24 }}>
        <Link
          href={verifyUrl}
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
          Verify email
        </Link>
      </Section>

      <Section style={{ paddingTop: 32, borderTop: `1px solid ${TOKENS.INK_10}`, marginTop: 24 }}>
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
          {verifyUrl}
        </Text>
      </Section>
    </EmailShell>
  );
}

Welcome.PreviewProps = {
  customerFirstName: 'Alex',
  verifyUrl: 'https://birmingham-av.com/auth/verify?token=abc123def456',
} as WelcomeProps;
