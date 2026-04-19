import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductTile, type TileProduct } from '@/components/shop/ProductTile';
import { CampaignFaq, type CampaignFaqItem } from '@/components/campaigns/CampaignFaq';
import { defaultImageFor } from '@/lib/services/products';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gaming PCs — Christmas drop, UK, 12 hand-assembled builds | Birmingham AV',
  description:
    'Twelve gaming rigs built in Birmingham for Christmas. Ryzen 7 & 9 / RTX 5080 & 5090. 12-month warranty, free UK delivery, 24-hour stress test. Order before 20 Dec.',
};

// Editorial copy (kept in-page; copy is campaign-specific, not a CMS field)
const INCLUDED = [
  { title: '24-hour stress test', body: 'Full thermal and stability run, benchmark sheet in the box.', aside: 'STD-01' },
  { title: 'Birth certificate',   body: 'Signed card naming the builder and the bench it left.',        aside: 'STD-02' },
  { title: '12-month warranty',   body: 'Parts and labour, on everything inside the case.',             aside: 'STD-03' },
  { title: 'Free UK delivery',    body: 'Insured, tracked, signed-for. 24h from leaving the workshop.', aside: 'STD-04' },
  { title: '30-day returns',      body: 'Change of mind, no questions. We cover return shipping.',      aside: 'STD-05' },
  { title: '14-day price match',  body: 'If you find the same spec cheaper, we refund the gap.',        aside: 'STD-06' },
];

const STEPS = [
  { n: '01', label: '— Order',    body: 'Pick a rig. Checkout takes less than a minute. Card, Klarna, PayPal or invoice.' },
  { n: '02', label: '— Build',    body: 'Assigned to one builder. Assembled, bench-tested, imaged and signed over 24 hours.' },
  { n: '03', label: '— Dispatch', body: 'Collected by courier. Insured, signed-for, tracked. With you inside a working day.' },
];

const FAQ: CampaignFaqItem[] = [
  { q: 'Can I pay in instalments?',        a: 'Yes. Klarna and Clearpay are available at checkout for orders up to £2,000. Above that, a bank transfer with a three-month invoice plan is possible on request.' },
  { q: 'What if my rig arrives faulty?',   a: 'Every rig ships with a 12-month parts-and-labour warranty. Faults in the first 30 days are handled as returns with a prepaid label. After that, our workshop collects, repairs and returns.' },
  { q: 'Will it arrive before Christmas?', a: 'Orders placed by 20 December ship before the cut-off. Each build is bench-tested for 24 hours and dispatched the same day. UK mainland arrives inside one working day.' },
  { q: 'Can I customise a build?',         a: 'Yes. Pick the closest rig, then use the custom quote link at the bottom of this page. Turnaround on custom builds is five to ten working days.' },
  { q: 'Do you take trade-ins?',           a: 'Yes. Book a diagnostic and we will quote against your current machine. Credit is applied at checkout.' },
  { q: "What's in the box?",               a: 'The rig, power cable, spare thumb screws, a printed birth certificate and benchmark sheet. No bundled peripherals; we assume you already have yours.' },
];

async function loadGamingRigs(): Promise<{ rigs: TileProduct[]; total: number }> {
  const category = await prisma.productCategory.findUnique({
    where: { slug: 'gaming-pc-bundles' },
  });
  if (!category) return { rigs: [], total: 0 };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, categoryId: category.categoryId },
      include: {
        inventory: true,
        category: { select: { slug: true } },
        builder: { select: { builderCode: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { priceGbp: 'desc' }],
      take: 12,
    }),
    prisma.product.count({
      where: { isActive: true, categoryId: category.categoryId },
    }),
  ]);

  const rigs: TileProduct[] = rows.map((p) => ({
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
  }));

  return { rigs, total };
}

export default async function GamingChristmasCampaignPage() {
  const { rigs, total } = await loadGamingRigs();
  const remaining = rigs.filter((r) => r.stockQty > 0).length;

  return (
    <div className="bg-paper text-ink">
      {/* HERO */}
      <section className="bav-section-x bav-fade mx-auto max-w-[1440px] pb-24 pt-32">
        <div className="bav-hero-grid">
          <div>
            <div className="bav-label mb-8 text-ink-60">— Christmas · limited builders · limited stock</div>
            <h1 className="m-0 font-display font-light tracking-[-0.02em] text-[clamp(56px,7vw,96px)] leading-[0.96]">
              Gaming <span className="bav-italic">rigs</span>
              <br /> built for
              <br /> the holidays.
            </h1>
            <p className="mt-10 mb-10 max-w-[460px] text-[14px] leading-[1.7] text-ink-60">
              Twelve rigs, assembled by hand in Birmingham. 22 builders between them, each paired
              to one machine and one bench. Every build ships with a 24-hour stress test on paper
              and a 12-month warranty in the box.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/shop/gaming-pc-bundles?campaign=xmas" className="bav-cta !w-auto px-11 py-[22px]">
                Shop the twelve builds
              </Link>
              <Link href="/builders" className="bav-underline text-[13px] text-ink no-underline">
                See the build process <span className="arrow">→</span>
              </Link>
            </div>
          </div>
          <div className="bav-canvas relative grid h-[480px] place-items-center">
            <span className="relative z-[1] font-display font-light tracking-[-0.04em] text-ink text-[clamp(240px,32vw,420px)] leading-[0.8]">
              <span className="bav-italic">№</span>073
            </span>
          </div>
        </div>
      </section>

      {/* STOCK TICKER */}
      <section className="border-y border-ink-10">
        <div className="bav-section-x mx-auto max-w-[1440px] py-6">
          <div className="bav-ticker">
            <div className="bav-label text-ink">{rigs.length || 12} builds in this drop</div>
            <div className="bav-label text-center text-ink-60">
              {remaining || 9} remaining · dispatched 24h from order
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <span className="bav-pulse" />
              <span className="bav-label text-ink">Live — updated every hour</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE BUILDS */}
      <section className="bav-section-x mx-auto max-w-[1440px] pt-24">
        <div className="bav-4-8 mb-16">
          <div className="bav-label text-ink-60">— The drop</div>
          <div>
            <h2 className="m-0 font-display font-light tracking-[-0.02em] text-ink text-[48px] leading-[1.05]">
              Twelve rigs, <span className="bav-italic">considered</span>.
            </h2>
            <p className="mt-5 max-w-[560px] text-[14px] leading-[1.7] text-ink-60">
              Ringfenced from the usual workshop queue. Chosen for what they do well — a hot Ryzen
              and RTX pairing, a Core Ultra build for creators, a silent chassis for the study.
            </p>
          </div>
        </div>

        {rigs.length === 0 ? (
          <div className="border border-dashed border-ink-10 p-16 text-center text-[14px] text-ink-60">
            The Christmas drop is being seeded — check back once the workshop lists the twelve rigs.
          </div>
        ) : (
          <div className="bav-grid-3">
            {rigs.map((p) => (
              <ProductTile key={p.productId} product={p} />
            ))}
          </div>
        )}

        {total > rigs.length && (
          <div className="mt-12">
            <Link href="/shop/gaming-pc-bundles?campaign=xmas" className="bav-underline text-[13px] text-ink no-underline">
              See all {total} gaming bundles <span className="arrow">→</span>
            </Link>
          </div>
        )}
      </section>

      {/* INCLUDED */}
      <section className="mt-24 border-y border-ink-10 bg-paper-2">
        <div className="bav-section-x mx-auto max-w-[1440px] py-24">
          <div className="bav-4-8">
            <div>
              <div className="bav-label mb-6 text-ink-60">— What&apos;s included</div>
              <h2 className="m-0 font-display font-light tracking-[-0.01em] text-ink text-[32px] leading-[1.1]">
                Standard on every rig.
              </h2>
            </div>
            <div>
              {INCLUDED.map((row, i) => (
                <div
                  key={row.title}
                  className={`grid grid-cols-[1fr_1.2fr_auto] items-baseline gap-8 border-t border-ink-10 py-6 ${i === INCLUDED.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="font-display text-[18px] font-light text-ink">{row.title}</div>
                  <div className="text-[13px] leading-[1.6] text-ink-60">{row.body}</div>
                  <div className="bav-label text-ink-30">{row.aside}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEXT STEPS */}
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
          Build it <span className="bav-italic">yours</span>.
        </h2>
        <p className="mt-5 mb-8 text-[14px] text-ink-60">
          Custom configs take 5-10 working days. Start a quote with a builder.
        </p>
        <Link href="/quote" className="bav-underline text-[13px] text-ink no-underline">
          Start a custom quote <span className="arrow">→</span>
        </Link>
      </section>
    </div>
  );
}
