export async function notifyTelegramOwner(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[telegram] not configured; would send:', message);
    return false;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown', disable_web_page_preview: true }),
  });
  if (!res.ok) {
    console.error('[telegram] failed', await res.text());
    return false;
  }
  return true;
}
