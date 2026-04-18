import type { Metadata } from 'next';
import { PageHero } from '@/components/storefront/PageHero';
import { GlassCard } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Shipping',
  description:
    'Birmingham AV shipping: free UK next-day delivery on orders over £50, Saturday and Express options, EU and international rates, all insured and tracked.',
};

export default function ShippingPage() {
  return (
    <>
      <PageHero
        eyebrow="Delivery"
        title="UK next-day. Free over £50. Insured door-to-door."
        lead="We ship same-day on orders placed before 3pm weekdays. All couriers include parcel insurance and signed-for delivery."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="overflow-hidden rounded-xl border border-ink-300/50 dark:border-obsidian-500/40">
          <table className="w-full font-mono text-small">
            <thead className="bg-ink-100 dark:bg-obsidian-800">
              <tr>
                <th className="px-6 py-4 text-left">Service</th>
                <th className="px-6 py-4 text-left">Speed</th>
                <th className="px-6 py-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['UK Next Day (orders £50+)', 'Next working day, pre-12pm', 'Free'],
                ['UK Next Day Express', 'Next working day, pre-10:30am', '£9.99'],
                ['UK Saturday', 'Saturday AM', '£14.99'],
                ['Highlands + Islands', '2 working days', 'From £12'],
                ['EU', '3-5 working days, signed-for', 'From £29'],
                ['International', 'Varies, tracked', 'Quoted at checkout'],
              ].map(([service, speed, cost]) => (
                <tr key={service} className="border-t border-ink-300/40 dark:border-obsidian-500/30">
                  <td className="px-6 py-4">{service}</td>
                  <td className="px-6 py-4 text-ink-500">{speed}</td>
                  <td className="px-6 py-4 text-right font-medium">{cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { k: 'Packaging', b: 'Double-walled, corner-reinforced, shock-watch stickered on builds over £1,500.' },
            { k: 'Tracking', b: 'Tracking link arrives by email and SMS the moment your parcel leaves the hub.' },
            { k: 'Damage', b: 'Photograph the box on arrival if visibly damaged. Signed-for-but-damaged is on us.' },
          ].map((x) => (
            <GlassCard key={x.k} className="p-8">
              <h3 className="font-display text-h3 font-semibold">{x.k}</h3>
              <p className="mt-3 text-small text-ink-500 dark:text-ink-300">{x.b}</p>
            </GlassCard>
          ))}
        </div>
      </section>
    </>
  );
}
