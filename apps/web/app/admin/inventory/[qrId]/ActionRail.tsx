'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ActionRail({
  qrId,
  currentLocation,
  isBound,
}: {
  qrId: string;
  currentLocation: string | null;
  isBound: boolean;
}) {
  const router = useRouter();
  const [moveOpen, setMoveOpen] = useState(false);
  const [bindOpen, setBindOpen] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [unitRef, setUnitRef] = useState('');
  const [submitting, setSubmitting] = useState<'move' | 'bind' | 'write-off' | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleMove = async () => {
    if (!newLocation.trim()) return;
    setError(null);
    setSubmitting('move');
    try {
      const res = await fetch('/api/admin/inventory/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId, toLocation: newLocation.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'Failed to move component');
      }
      setMoveOpen(false);
      setNewLocation('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(null);
    }
  };

  const handleWriteOff = async () => {
    const reason = window.prompt('Reason for write-off:');
    if (!reason) return;
    setError(null);
    setSubmitting('write-off');
    try {
      const res = await fetch('/api/admin/inventory/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId, action: 'written_off', reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'Failed to write off');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div>
      {/* Move / Bind */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          className="bav-cta-secondary"
          onClick={() => {
            setMoveOpen((v) => !v);
            setBindOpen(false);
          }}
          disabled={submitting !== null}
        >
          Move location
        </button>
        {moveOpen && (
          <div
            className="mb-1"
            style={{ border: '1px solid var(--ink-10)', padding: '20px' }}
          >
            <label
              className="bav-label mb-2.5 block"
              style={{ color: 'var(--ink-60)' }}
            >
              New location
            </label>
            <input
              type="text"
              className="bav-input"
              style={{ fontSize: 15 }}
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder={currentLocation ?? 'bin A3, workbench 2…'}
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="bav-cta"
                style={{ flex: 1, padding: '12px 20px' }}
                onClick={handleMove}
                disabled={submitting !== null || !newLocation.trim()}
              >
                {submitting === 'move' ? 'Saving…' : 'Confirm'}
              </button>
              <button
                type="button"
                className="bav-cta-secondary"
                style={{ flex: 1, padding: '11px 20px' }}
                onClick={() => setMoveOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <a
          href={`/admin/inventory/bind/${encodeURIComponent(qrId)}`}
          className="bav-cta-secondary no-underline"
          onClick={(e) => {
            e.preventDefault();
            setBindOpen((v) => !v);
            setMoveOpen(false);
          }}
        >
          Bind to build
        </a>
        {bindOpen && (
          <div
            className="mb-1"
            style={{ border: '1px solid var(--ink-10)', padding: '20px' }}
          >
            <label
              className="bav-label mb-2.5 block"
              style={{ color: 'var(--ink-60)' }}
            >
              Unit / build number
            </label>
            <input
              type="text"
              className="bav-input"
              style={{ fontSize: 15 }}
              value={unitRef}
              onChange={(e) => setUnitRef(e.target.value)}
              placeholder="№073 or UNT-…"
            />
            <div
              className="mt-2 font-mono tabular-nums"
              style={{ fontSize: 11, color: 'var(--ink-30)' }}
            >
              Removes from stock, enters build queue.
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={`/admin/inventory/bind/${encodeURIComponent(qrId)}?unit=${encodeURIComponent(unitRef)}`}
                className="bav-cta no-underline"
                style={{ flex: 1, padding: '12px 20px' }}
              >
                Confirm bind
              </a>
              <button
                type="button"
                className="bav-cta-secondary"
                style={{ flex: 1, padding: '11px 20px' }}
                onClick={() => setBindOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="mt-3 text-[12px]"
          style={{ color: '#B94040' }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-10">
        <button
          type="button"
          onClick={handleWriteOff}
          disabled={submitting !== null || isBound}
          className="bav-label bav-hover-opa cursor-pointer border-0 bg-transparent p-0"
          style={{ color: 'var(--ink-30)' }}
        >
          {submitting === 'write-off' ? 'Writing off…' : 'Write off component'}
        </button>
      </div>
    </div>
  );
}
