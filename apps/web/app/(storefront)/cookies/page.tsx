import type { Metadata } from 'next';
import { PageHero } from '@/components/storefront/PageHero';
import { GlassCard } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Cookie policy',
  description:
    'Cookie policy for Birmingham AV: essential session, cart, and theme cookies we use, what they do, and how long they last.',
};

export default function CookiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Cookie policy"
        lead="We use the minimum cookies needed to run the shop and measure what works."
      />
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="overflow-hidden rounded-xl border border-ink-300/50 dark:border-obsidian-500/40">
          <table className="w-full font-mono text-small">
            <thead className="bg-ink-100 dark:bg-obsidian-800">
              <tr>
                <th className="px-6 py-4 text-left">Cookie</th>
                <th className="px-6 py-4 text-left">Purpose</th>
                <th className="px-6 py-4 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['bav_session', 'Keeps you signed in and preserves your cart', '14 days'],
                ['bav_staff', 'Grants staff access to the admin console', '14 days'],
                ['bav-theme', 'Remembers light / dark preference', 'Persistent'],
                ['bav-cart', 'Local cart storage (localStorage)', 'Persistent'],
                ['_vercel_jwt', 'Vercel authentication for preview deploys', 'Session'],
              ].map(([name, purpose, dur]) => (
                <tr key={name} className="border-t border-ink-300/40 dark:border-obsidian-500/30">
                  <td className="px-6 py-4 font-medium">{name}</td>
                  <td className="px-6 py-4 text-ink-500">{purpose}</td>
                  <td className="px-6 py-4 text-ink-500">{dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <GlassCard className="mt-8 p-8">
          <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">Managing cookies</h2>
          <p className="mt-3 text-body text-ink-700 dark:text-ink-300">
            You can clear cookies in your browser settings at any time. Clearing {' '}
            <code className="rounded-sm bg-ink-100 px-1 py-0.5 font-mono text-caption dark:bg-obsidian-800">bav_session</code>{' '}
            will sign you out. Clearing{' '}
            <code className="rounded-sm bg-ink-100 px-1 py-0.5 font-mono text-caption dark:bg-obsidian-800">bav-cart</code>{' '}
            will empty your cart.
          </p>
        </GlassCard>
      </section>
    </>
  );
}
