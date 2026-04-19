'use client';

import { useState } from 'react';

type Feedback = 'useful' | 'not-useful' | null;

export function HelpArticleFeedback() {
  const [feedback, setFeedback] = useState<Feedback>(null);

  return (
    <div className="mt-24 border-t border-ink-10 pt-12" style={{ maxWidth: '68ch' }}>
      <div className="bav-label text-ink-60">— Was this article useful</div>
      {feedback === null ? (
        <div className="mt-6 flex gap-3">
          <button
            className="bav-cta-secondary"
            onClick={() => setFeedback('useful')}
            style={{
              width: 'auto',
              padding: '14px 28px',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            Yes, it helped
          </button>
          <button
            className="bav-cta-secondary"
            onClick={() => setFeedback('not-useful')}
            style={{
              width: 'auto',
              padding: '14px 28px',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            Not really
          </button>
        </div>
      ) : (
        <p
          className="mt-6 text-ink-60"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          {feedback === 'useful'
            ? 'Thanks — noted. If anything else comes up, the chat widget is the fastest route to a human.'
            : 'Noted. Tell us what was missing in the chat widget and we\u2019ll rewrite the article; articles are reviewed monthly against that feedback.'}
        </p>
      )}
    </div>
  );
}

export default HelpArticleFeedback;
