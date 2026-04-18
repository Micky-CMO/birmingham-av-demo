import { PageHero } from '@/components/storefront/PageHero';

export const metadata = { title: 'Modern slavery statement' };

export default function ModernSlaveryPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Modern slavery statement"
        lead="Birmingham AV Ltd.'s statement under section 54 of the Modern Slavery Act 2015."
      />
      <article className="mx-auto max-w-3xl space-y-8 px-6 pb-24 text-body leading-relaxed text-ink-700 dark:text-ink-300">
        <section>
          <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">Our business</h2>
          <p className="mt-3">
            Birmingham AV Ltd. is a UK private company refurbishing, building, and selling computer hardware direct to
            UK consumers. Our suppliers are UK wholesalers of pre-owned enterprise hardware and UK distributors of new
            components.
          </p>
        </section>
        <section>
          <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">Our commitment</h2>
          <p className="mt-3">
            We have zero tolerance for modern slavery, forced labour, or human trafficking in our operations or supply
            chain. All staff are directly employed by Birmingham AV Ltd. on PAYE with full UK statutory rights.
          </p>
        </section>
        <section>
          <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">Due diligence</h2>
          <p className="mt-3">
            We require all trade suppliers to confirm compliance with the Modern Slavery Act. Any supplier found to
            breach these commitments will have their account terminated. We review our supplier register annually.
          </p>
        </section>
        <section>
          <h2 className="font-display text-h2 font-semibold tracking-[-0.02em]">Reporting concerns</h2>
          <p className="mt-3">
            Concerns can be raised confidentially by email to{' '}
            <a className="text-brand-green hover:underline" href="mailto:compliance@birmingham-av.com">
              compliance@birmingham-av.com
            </a>
            . Reports are handled by the director and will be acknowledged within five working days.
          </p>
        </section>
        <footer className="pt-8 text-caption text-ink-500">
          Approved by the board of Birmingham AV Ltd. and reviewed annually. Last updated April 2026.
        </footer>
      </article>
    </>
  );
}
