export type ThreadMessage = {
  id: string;
  authorRole: 'customer' | 'ai' | 'builder' | 'support' | 'human';
  authorName?: string;
  body: string;
  createdAt: string;
  confidence?: number;
  attachments?: Array<{ label: string; url?: string }>;
};

function formatRole(message: ThreadMessage): string {
  const name = message.authorName ?? '';
  switch (message.authorRole) {
    case 'customer':
      return 'You';
    case 'ai':
      return 'AV Care · Triage';
    case 'builder':
      return `${name} · Builder`.trim();
    case 'support':
    case 'human':
      return `${name} · Support`.trim();
    default:
      return name;
  }
}

/**
 * One message turn in a thread. Shared by the AV Care claim detail page
 * (A52), the return detail page, and the support widget (A24). Authors are
 * keyed by role so the same component renders customer, AI triage, builder,
 * and support turns consistently.
 */
export function MessageBlock({ message }: { message: ThreadMessage }) {
  const isCustomer = message.authorRole === 'customer';

  return (
    <article
      className="grid gap-8 border-t border-ink-10"
      style={{ gridTemplateColumns: '180px 1fr', padding: '28px 0' }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: isCustomer ? 'var(--ink)' : 'var(--ink-60)',
          }}
        >
          {formatRole(message)}
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 6 }}
        >
          {message.createdAt}
        </div>
        {typeof message.confidence === 'number' && (
          <div
            className="bav-label"
            style={{ color: 'var(--ink-60)', marginTop: 10 }}
          >
            Confidence {(message.confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>
      <div>
        <p
          className="m-0 whitespace-pre-wrap"
          style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink)' }}
        >
          {message.body}
        </p>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.attachments.map((a, i) => (
              <a
                key={`${a.label}-${i}`}
                href={a.url ?? '#'}
                className="bav-hover-opa border border-ink-10 no-underline"
                style={{ fontSize: 12, color: 'var(--ink-60)', padding: '6px 12px' }}
              >
                {a.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default MessageBlock;
