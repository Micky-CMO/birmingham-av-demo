import Link from 'next/link';
import { PageHero } from '@/components/storefront/PageHero';
import { Button, GlassCard } from '@/components/ui';

export const metadata = { title: 'Careers' };

const ROLES = [
  { title: 'PC Builder (Senior)', location: 'BHM-HUB-A · Full-time', summary: 'Assembly, burn-in, and QC sign-off. 3+ years workshop experience.' },
  { title: 'QC Technician', location: 'BHM-HUB-B · Full-time', summary: 'Run the seven-stage bench test. Flag failures, document root cause.' },
  { title: 'Customer Support Lead', location: 'Remote (UK) · Full-time', summary: 'Own escalated tickets, partner with the AI agent, coach junior support.' },
  { title: 'Warehouse Logistics', location: 'BHM-HUB-C · Full-time', summary: 'Inbound refurb stock, outbound QC-passed units, UK courier liaison.' },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="We build machines. We're also building a team."
        lead="Four open roles across the Birmingham hubs. We hire workshop first, CV second."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <ul className="space-y-4">
          {ROLES.map((r) => (
            <li key={r.title}>
              <GlassCard className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">{r.title}</h2>
                  <div className="mt-1 font-mono text-caption uppercase tracking-[0.2em] text-ink-500">{r.location}</div>
                  <p className="mt-3 max-w-2xl text-small text-ink-500 dark:text-ink-300">{r.summary}</p>
                </div>
                <Link href="mailto:careers@birmingham-av.com?subject=Application">
                  <Button variant="outline">Apply</Button>
                </Link>
              </GlassCard>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
