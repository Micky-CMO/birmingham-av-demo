import Link from 'next/link';
import { Button, GlassCard } from '@/components/ui';

export const metadata = { title: 'Support' };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-h1 font-display">How can we help?</h1>
      <p className="mt-2 text-ink-500">
        Most things are faster via chat. Hit the button bottom-right to talk to the team.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassCard className="p-6">
          <h2 className="text-h3 font-display">Order help</h2>
          <p className="mt-2 text-small text-ink-500">Missing parcel, wrong item, tracking updates.</p>
          <Link href="/orders" className="mt-4 inline-block text-brand-green">Go to orders &rarr;</Link>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-h3 font-display">Returns</h2>
          <p className="mt-2 text-small text-ink-500">Start an RMA for a fault, damage, or change of mind.</p>
          <Link href="/returns/new" className="mt-4 inline-block text-brand-green">Start return &rarr;</Link>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-h3 font-display">Warranty</h2>
          <p className="mt-2 text-small text-ink-500">Every unit includes 12 months parts + labour cover.</p>
          <Link href="/warranty" className="mt-4 inline-block text-brand-green">Learn more &rarr;</Link>
        </GlassCard>
      </div>

      <div className="mt-12">
        <Button>Start a chat</Button>
      </div>
    </div>
  );
}
