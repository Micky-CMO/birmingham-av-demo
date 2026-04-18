import { PageHero } from '@/components/storefront/PageHero';
import { Button, GlassCard, Input } from '@/components/ui';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Get in touch." lead="We respond inside two hours during UK working hours." />
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-24 md:grid-cols-2">
        <GlassCard className="p-8">
          <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">Drop us a line</h2>
          <form className="mt-6 space-y-4" action="mailto:support@birmingham-av.com">
            <Input placeholder="Your name" required />
            <Input type="email" placeholder="Email" required />
            <Input placeholder="Subject" />
            <textarea
              placeholder="How can we help?"
              rows={6}
              required
              className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-small dark:border-obsidian-500 dark:bg-obsidian-900"
            />
            <Button size="lg">Send message</Button>
          </form>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-8">
            <h3 className="font-display text-h3 font-semibold">Support</h3>
            <p className="mt-2 text-small text-ink-500">
              <a className="text-brand-green hover:underline" href="mailto:support@birmingham-av.com">
                support@birmingham-av.com
              </a>
            </p>
            <p className="mt-1 font-mono text-caption text-ink-500">Mon - Fri · 08:30 - 18:00 GMT</p>
          </GlassCard>
          <GlassCard className="p-8">
            <h3 className="font-display text-h3 font-semibold">Trade</h3>
            <p className="mt-2 text-small text-ink-500">
              <a className="text-brand-green hover:underline" href="mailto:trade@birmingham-av.com">
                trade@birmingham-av.com
              </a>
            </p>
            <p className="mt-1 font-mono text-caption text-ink-500">B2B orders, volume quotes</p>
          </GlassCard>
          <GlassCard className="p-8">
            <h3 className="font-display text-h3 font-semibold">Press</h3>
            <p className="mt-2 text-small text-ink-500">
              <a className="text-brand-green hover:underline" href="mailto:press@birmingham-av.com">
                press@birmingham-av.com
              </a>
            </p>
          </GlassCard>
          <GlassCard className="p-8">
            <h3 className="font-display text-h3 font-semibold">Registered office</h3>
            <p className="mt-2 font-mono text-small text-ink-700 dark:text-ink-300">
              Birmingham AV Ltd.<br />21b Buntsford Drive<br />Bromsgrove, B60 3AJ
            </p>
            <p className="mt-1 font-mono text-caption text-ink-500">Company no. 12383651</p>
          </GlassCard>
        </div>
      </section>
    </>
  );
}
