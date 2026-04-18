'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui';

export function BuildActionButtons({
  buildQueueId,
  status,
}: {
  buildQueueId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'start' | 'qc' | 'complete' | 'fail') {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/builds/${buildQueueId}/advance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { error?: { message: string } };
      if (!res.ok) {
        setError(data.error?.message ?? 'Action failed');
        setPending(null);
        return;
      }
      router.refresh();
    } catch (err) {
      setError('Network error');
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {status === 'queued' && (
          <Button size="sm" loading={pending === 'start'} onClick={() => act('start')}>
            Start build
          </Button>
        )}
        {status === 'in_progress' && (
          <Button size="sm" loading={pending === 'qc'} onClick={() => act('qc')}>
            Send to QC
          </Button>
        )}
        {status === 'qc' && (
          <Button size="sm" loading={pending === 'complete'} onClick={() => act('complete')}>
            QC pass · ready to ship
          </Button>
        )}
        {(status === 'in_progress' || status === 'qc' || status === 'queued') && (
          <Button
            size="sm"
            variant="outline"
            loading={pending === 'fail'}
            onClick={() => {
              if (confirm('Mark this build as failed? Order will be flagged for review.')) act('fail');
            }}
          >
            Failure
          </Button>
        )}
      </div>
      {error && <p className="font-mono text-caption text-semantic-critical">{error}</p>}
    </div>
  );
}
