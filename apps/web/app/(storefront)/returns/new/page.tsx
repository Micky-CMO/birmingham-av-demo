'use client';

import { useState } from 'react';
import { Button, GlassCard, Input } from '@/components/ui';

const REASONS = [
  { value: 'dead_on_arrival', label: 'Dead on arrival' },
  { value: 'hardware_fault', label: 'Hardware fault' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'damaged_in_transit', label: 'Damaged in transit' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'other', label: 'Other' },
] as const;

export default function NewReturnPage() {
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('hardware_fault');

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-h1 font-display">Start a return</h1>
      <p className="mt-2 text-ink-500">Have an order number to hand. Returns are normally processed within 48 hours.</p>

      <form className="mt-8 space-y-6">
        <GlassCard className="p-6">
          <label className="block text-caption text-ink-500">Order number</label>
          <Input placeholder="BAV-260417-000123" className="mt-2" required />
        </GlassCard>

        <GlassCard className="p-6">
          <label className="block text-caption text-ink-500">Item</label>
          <select
            className="mt-2 h-10 w-full rounded-md border border-ink-300 bg-white px-3 dark:border-obsidian-500 dark:bg-obsidian-900"
            defaultValue=""
          >
            <option value="" disabled>Select an item</option>
            <option>Aegis Ultra gaming PC (BAV-FEAT-001)</option>
          </select>
        </GlassCard>

        <GlassCard className="p-6">
          <label className="block text-caption text-ink-500">Reason</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={`rounded-sm px-3 py-1 text-caption ${
                  reason === r.value
                    ? 'bg-brand-green text-white'
                    : 'bg-ink-100 text-ink-700 dark:bg-obsidian-800 dark:text-ink-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <label className="block text-caption text-ink-500">Details</label>
          <textarea
            rows={6}
            className="mt-2 w-full rounded-md border border-ink-300 bg-white p-3 text-body dark:border-obsidian-500 dark:bg-obsidian-900"
            placeholder="Tell us what happened. The more detail, the faster we can help."
          />
        </GlassCard>

        <GlassCard className="p-6">
          <label className="block text-caption text-ink-500">Photos (optional)</label>
          <div className="mt-3 rounded-md border border-dashed border-ink-300 p-10 text-center text-small text-ink-500 dark:border-obsidian-500">
            Drop up to 10 images here. Uploaded to S3 on submit.
          </div>
        </GlassCard>

        <Button size="lg">Submit return request</Button>
      </form>
    </div>
  );
}
