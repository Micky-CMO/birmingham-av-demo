import { Section, Text } from '@react-email/components';
import { EmailShell, TOKENS } from '../components/EmailShell';

export type BusinessApplicationReceivedProps = {
  contactFirstName: string;
  companyName: string;
};

/**
 * Confirmation email sent when a trade account application is submitted.
 * The account sits at status = 'pending_review' until an admin approves it
 * and assigns an account manager.
 */
export default function BusinessApplicationReceived({
  contactFirstName,
  companyName,
}: BusinessApplicationReceivedProps) {
  const preheader = `We've received ${companyName}'s trade account application.`;

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
        — Application received
      </Text>

      <Text
        style={{
          fontFamily: TOKENS.displayFont,
          fontSize: 44,
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
          color: TOKENS.INK,
          margin: '16px 0 24px',
          fontWeight: 300,
        }}
      >
        Thank you,{' '}
        <span style={{ fontStyle: 'italic' }}>{contactFirstName}</span>.
      </Text>

      <Text
        style={{
          fontFamily: TOKENS.sansFont,
          fontSize: 16,
          lineHeight: 1.6,
          color: TOKENS.INK,
          margin: '0 0 16px',
        }}
      >
        We've logged the application for <strong>{companyName}</strong>. A member of our trade team will review
        within one working day and reply with your approval, account manager introduction and credit limit.
      </Text>

      <Text
        style={{
          fontFamily: TOKENS.sansFont,
          fontSize: 16,
          lineHeight: 1.6,
          color: TOKENS.INK_60,
          margin: '0 0 32px',
        }}
      >
        No action needed in the meantime — but if anything's urgent you can reply directly to this email and it
        will route straight to the team.
      </Text>

      <Section
        style={{
          paddingTop: 24,
          borderTop: `1px solid ${TOKENS.INK_10}`,
          marginTop: 16,
        }}
      >
        <Text
          style={{
            fontFamily: TOKENS.sansFont,
            fontSize: 13,
            lineHeight: 1.6,
            color: TOKENS.INK_60,
            margin: 0,
          }}
        >
          Birmingham AV Ltd · Reg. No. 12383651
        </Text>
      </Section>
    </EmailShell>
  );
}

BusinessApplicationReceived.PreviewProps = {
  contactFirstName: 'Priya',
  companyName: 'Northgate Post-Production Ltd.',
} as BusinessApplicationReceivedProps;
