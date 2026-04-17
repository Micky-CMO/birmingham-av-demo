export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[email] not configured; would send to', to, '-', subject);
    return false;
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(key);
    await resend.emails.send({
      from: 'Birmingham AV <no-reply@birmingham-av.com>',
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[email] failed', err);
    return false;
  }
}
