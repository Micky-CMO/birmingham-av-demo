'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  shareUrl: string;
  existingCode: string | null;
}

export function ReferralsInvite({ shareUrl, existingCode }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Some browsers reject clipboard writes; just highlight the link.
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!email) return;
    try {
      const res = await fetch('/api/referrals/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('invite failed');
      setEmail('');
      setMessage('Invite recorded.');
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      setMessage('Invite failed — check the email and try again.');
    }
  };

  return (
    <div
      className="border p-6"
      style={{ borderColor: 'var(--ink-10)', alignSelf: 'start' }}
    >
      <div className="bav-label mb-3.5" style={{ color: 'var(--ink-60)' }}>— Your link</div>
      <div
        className="font-mono"
        style={{
          border: '1px solid var(--ink-10)',
          padding: '14px 16px',
          fontSize: 13,
          color: 'var(--ink)',
          marginBottom: 16,
          background: 'var(--paper-2)',
          userSelect: 'all',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {shareUrl}
      </div>
      <button type="button" className="bav-cta-secondary" onClick={handleCopy} style={{ width: '100%' }}>
        {copied ? 'Copied' : 'Copy link'}
      </button>
      {existingCode && (
        <div className="bav-label mt-4" style={{ color: 'var(--ink-60)' }}>
          — Code {existingCode}
        </div>
      )}

      <form onSubmit={handleInvite} className="mt-6">
        <div className="bav-label mb-2" style={{ color: 'var(--ink-60)' }}>Invite by email</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          required
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid var(--ink-10)',
            padding: '10px 12px',
            fontSize: 13,
            color: 'var(--ink)',
            marginBottom: 10,
          }}
        />
        <button
          type="submit"
          className="bav-cta"
          style={{ width: '100%', padding: '14px 28px' }}
          disabled={isPending || !email}
        >
          {isPending ? 'Sending…' : 'Send invite'}
        </button>
        {message && (
          <div className="bav-label mt-3" style={{ color: 'var(--ink-60)' }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
