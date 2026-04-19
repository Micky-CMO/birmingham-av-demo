import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductTile, type TileProduct } from '@/components/shop/ProductTile';
import { CampaignFaq, type CampaignFaqItem } from '@/components/campaigns/CampaignFaq';
import { RefurbWeekCountdown } from '@/components/campaigns/RefurbWeekCountdown';
import { defaultImageFor } from '@/lib/services/products';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Refurb Week UK — 247 hand-checked units, 4-day event | Birmingham AV',
  description:
    'Refurb Week: 247 refurbished PCs, laptops, monitors, projectors dropped for four days. 12-month warranty + free UK delivery. Silver/Gold members get first pick.',
};

const EVENT = {
  startsAt: '14 Apr 18:00',
  endsAt: '21 Apr 23:59',
  endsAtIso: '2026-04-21T23:59:00+01:00',
  totalUnits: 247,
  totalCategories: 14,
  minGrade: 'Excellent+',
};

const CATEGORY_SLUGS = ['laptops', 'computers', 'monitors', 'projectors'] as const;
type CategoryRow = {
  slug: string;
  name: string;
  count: number;
  items: TileProduct[];
};

const STEPS = [
  { n: '01', label: '— Pick',     body: 'Refurb week listings are badged on category pages. Add to cart as normal — no code needed.' },
  { n: '02', label: '— Checkout', body: 'Prices show the refurb-week reduction at cart. Silver and Gold get an automatic additional five per cent.' },
  { n: '03', label: '— Receive',  body: 'Dispatched inside 48 hours. 12-month warranty applies. Returns during refurb week have no restocking fee.' },
];

const FAQ: CampaignFaqItem[] = [
  { q: 'What is refurb week?',                    a: 'A four-day release of workshop surplus and trade-in stock. It runs once a quarter. Everything is graded Excellent or Like New; nothing below that makes the cut.' },
  { q: 'Is it really lower than the shop price?', a: 'Yes. Items are priced 15 to 30 per cent below equivalent new or standard-refurb listings. The saving comes from clearance, not from a discount code.' },
  { q: 'Do warranties still apply?',              a: '12-month parts-and-labour on everything. No exclusions for refurb week. AV Care subscriptions cover refurb-week purchases from day one.' },
  { q: 'What is loyalty first-pick?',             a: 'Silver members open at 16:00 on day one — two hours ahead of the public. Gold at 14:00. First-pick access is priority only; prices are the same for everyone.' },
  { q: 'Can I return a refurb-week item?',        a: '30 days from delivery, no restocking fee. Same terms as any other BAV purchase during this event.' },
  { q: "When's the next one?",                    a: 'Refurb week runs the second week of each quarter. July, October, January, April. Subscribe to the quiet newsletter to get told 72 hours before it opens.' },
];

async function loadRows(): Promise<CategoryRow[]> {
  const cats = await prisma.productCategory.findMany({
    where: { slug: { in: [...CATEGORY_SLUGS] } },
  });
  const rows = await Promise.all(
    cats.map(async (c) => {
      const [items, count] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true, categoryId: c.categoryId },
          include: {
            inventory: true,
            category: { select: { slug: true } },
            builder: { select: { builderCode: true } },
          },
          orderBy: [{ isFeatured: 'desc' }, { priceGbp: 'desc' }],
          take: 3,
        }),
        prisma.product.count({
          where: { isActive: true, categoryId: c.categoryId },
        }),
      ]);
      return {
        slug: c.slug,
        name: c.name,
        count,
        items: items.map<TileProduct>((p) => ({
          productId: p.productId,
          sku: p.sku,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          priceGbp: Number(p.priceGbp),
          compareAtGbp: p.compareAtGbp ? Number(p.compareAtGbp) : null,
          conditionGrade: p.conditionGrade,
          warrantyMonths: p.warrantyMonths,
          isFeatured: p.isFeatured,
          stockQty: p.inventory?.stockQty ?? 0,
          imageUrl: p.primaryImageUrl ?? p.imageUrls[0] ?? defaultImageFor(p.category.slug),
          categorySlug: p.category.slug,
          builderCode: p.builder.builderCode,
        })),
      };
    }),
  );
  // Keep canonical ordering
  const byName = new Map(rows.map((r) => [r.slug, r]));
  return CATEGORY_SLUGS.map((s) => byName.get(s)).filter(Boolean) as CategoryRow[];
}

export default async function RefurbWeekCampaignPage() {
  const rows = await loadRows();
  const totalUnits = rows.reduce((s, r) => s + r.count, 0) || EVENT.totalUnits;

  return (
    <div className="bg-paper text-ink">
      {/* EVENT CLOCK STRIP */}
      <div className="border-b border-ink-10 bg-paper px-12 py-4 text-center">
        <RefurbWeekCountdown
          endsAtIso={EVENT.endsAtIso}
          startsLabel={EVENT.startsAt}
          endsLabel={EVENT.endsAt}
        />
      </div>

      {/* HERO */}
      <section className="bav-section-x bav-fade mx-auto max-w-[1440px] pb-24 pt-32">
        <div className="bav-hero-grid">
          <div>
            <div className="bav-label mb-8 text-ink-60">
              — Quarterly event · {totalUnits} units · clearance grade {EVENT.minGrade}
            </div>
            <h1 className="m-0 font-display font-light tracking-[-0.02em] text-[clamp(56px,7vw,96px)] leading-[0.96]">
              Seven days, <span className="bav-italic">one</span>
              <br /> kind of drop.
            </h1>
            <p className="mt-10 mb-10 max-w-[480px] text-[14px] leading-[1.7] text-ink-60">
              Refurb week happens once a quarter. Workshop surplus, trade-ins, overstock and
              display units across fourteen categories, priced to clear. Silver and Gold members
              get a head-start before the public opening.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/shop?campaign=refurb-week" className="bav-cta !w-auto px-11 py-[22px]">
                Shop refurb week
              </Link>
              <Link href="/account/loyalty" className="bav-underline text-[13px] text-ink no-underline">
                Join loyalty for first pick <span className="arrow">→</span>
              </Link>
            </div>
          </div>
          <div className="bav-canvas relative grid h-[480px] place-items-center">
            <span className="relative z-[1] font-display font-light tracking-[-0.04em] text-ink text-[clamp(240px,32vw,420px)] leading-[0.8]">
              <span className="bav-italic">№</span>
              {totalUnits}
            </span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-ink-10">
        <div className="bav-section-x mx-auto max-w-[1440px] py-6">
          <div className="bav-label text-center text-ink-60">
            {totalUnits} units · {EVENT.totalCategories} categories · clearance grade {EVENT.minGrade} · no restocking on refurb-week orders
          </div>
        </div>
      </section>

      {/* CATEGORY ROWS */}
      <section className="bav-section-x mx-auto max-w-[1440px] pb-12 pt-24">
        <div className="bav-4-8 mb-12">
          <div className="bav-label text-ink-60">— The floor</div>
          <h2 className="m-0 font-display font-light tracking-[-0.02em] text-ink text-[48px] leading-[1.05]">
            Four rooms, <span className="bav-italic">open</span>.
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="border border-dashed border-ink-10 p-16 text-center text-[14px] text-ink-60">
            Refurb-week listings are being seeded — check back once the workshop drops this quarter&apos;s stock.
          </div>
        ) : (
          <div>
            {rows.map((row) => (
              <div key={row.slug} className="bav-cat-row">
                <div>
                  <div className="bav-label mb-2 text-ink">— {row.name}</div>
                  <div className="font-mono text-[13px] text-ink-60">
                    {row.count} units · this event
                  </div>
                </div>
                <div className="bav-cat-scroll">
                  {row.items.length === 0 ? (
                    <div className="text-[13px] text-ink-30">No units listed yet.</div>
                  ) : (
                    row.items.map((p) => (
                      <div key={p.productId} className="bav-mini-tile">
                        <ProductTile product={p} />
                      </div>
                    ))
                  )}
                </div>
                <div className="self-end">
                  <Link
                    href={`/shop/${row.slug}?campaign=refurb-week`}
                    className="bav-underline text-[13px] text-ink no-underline"
                  >
                    All {row.count} {row.name.toLowerCase()} <span className="arrow">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LOYALTY */}
      <section className="mt-16 border-y border-ink-10 bg-paper-2">
        <div className="bav-section-x mx-auto max-w-[1440px] py-24">
          <div className="bav-4-8">
            <div>
              <div className="bav-label mb-6 text-ink-60">— Silver &amp; Gold</div>
              <h2 className="m-0 font-display font-light tracking-[-0.01em] text-ink text-[32px] leading-[1.1]">
                First pick, every quarter.
              </h2>
            </div>
            <div>
              <div className="grid grid-cols-[200px_1fr_auto] items-baseline gap-8 border-t border-ink-10 py-6">
                <div className="font-display text-[20px] font-light text-ink">Silver</div>
                <div className="text-[14px] leading-[1.6] text-ink-60">
                  Access at 16:00, two hours before public opening.
                </div>
                <div className="bav-label text-ink-30">Tier 01</div>
              </div>
              <div className="grid grid-cols-[200px_1fr_auto] items-baseline gap-8 border-y border-ink-10 py-6">
                <div className="font-display text-[20px] font-light text-ink">
                  <span className="bav-italic">Gold</span>
                </div>
                <div className="text-[14px] leading-[1.6] text-ink-60">
                  Access at 14:00, four hours before public opening.
                </div>
                <div className="bav-label text-ink-30">Tier 02</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="bav-section-x mx-auto max-w-[1440px] pt-24">
        <div className="bav-steps">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="mb-6 font-display font-light tracking-[-0.04em] text-ink text-[clamp(120px,18vw,180px)] leading-[0.85]">
                <span className="bav-italic">№</span>
                {s.n}
              </div>
              <div className="bav-label mb-4 text-ink">{s.label}</div>
              <p className="m-0 max-w-[340px] text-[13px] leading-[1.7] text-ink-60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bav-section-x mx-auto max-w-[1440px] py-24">
        <div className="bav-4-8">
          <div>
            <div className="bav-label mb-6 text-ink-60">— Small print</div>
            <h2 className="m-0 font-display font-light tracking-[-0.01em] text-ink text-[32px] leading-[1.1]">
              Questions, <span className="bav-italic">answered</span>.
            </h2>
          </div>
          <CampaignFaq items={FAQ} />
        </div>
      </section>

      {/* CLOSER */}
      <section className="bav-section-x mx-auto max-w-[1440px] py-32 text-center">
        <div className="bav-label mb-6 text-ink-60">— Or</div>
        <h2 className="m-0 font-display font-light tracking-[-0.02em] text-ink text-[48px] leading-[1.05]">
          The next <span className="bav-italic">one</span> lands in July.
        </h2>
        <p className="mt-5 mb-8 text-[14px] text-ink-60">
          Subscribe to the quiet newsletter and we will tell you 72 hours before it opens.
        </p>
        <Link href="/newsletter" className="bav-underline text-[13px] text-ink no-underline">
          Join the list <span className="arrow">→</span>
        </Link>
      </section>
    </div>
  );
}
