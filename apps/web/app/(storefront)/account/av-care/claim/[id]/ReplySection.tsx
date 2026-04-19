'use client';

import { useState } from 'react';
import { ReplyBox } from '@/components/thread/ReplyBox';

export function ReplySection({ claimNumber }: { claimNumber: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit() {
    // TODO: wire POST /api/avcare/claims/[number]/messages once the
    // message-write route lands. For now we acknowledge the click so the
    // UI doesn't feel broken.
    setStatus('sending');
    setTimeout(() => setStatus('sent'), 400);
  }

  return (
    <>
      <ReplyBox
        label="Add a note for the builder"
        placeholder="Anything helpful to add? New symptom, question about timing, or just a check-in."
        submitLabel={status === 'sending' ? 'Sending…' : 'Send update'}
        maxPhotos={5}
        helperText="Messages are visible to you and the assigned builder · Attach photos if helpful"
        onSubmit={handleSubmit}
        disabled={status === 'sending'}
      />
      {status === 'sent' && (
        <p
          className="font-mono m-0"
          style={{
            fontSize: 11,
            color: 'var(--ink-60)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginTop: 12,
            textAlign: 'right',
          }}
        >
          Noted — message relay coming soon (claim {claimNumber}).
        </p>
      )}
    </>
  );
}
