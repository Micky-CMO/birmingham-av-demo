import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductTile, type TileProduct } from '@/components/shop/ProductTile';
import { CampaignFaq, type CampaignFaqItem } from '@/components/campaigns/CampaignFaq';
import { defaultImageFor } from '@/lib/services/products';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Refurbished laptops UK — Back-to-school, 12-month warranty | Birmingham AV',
  description:
    '80+ refurbished MacBooks, Framework, ThinkPad, XPS — bench-tested in Birmingham with 12-month warranty and free 48h UK delivery. From £249.',
};

const INCLUDED = [
  { title: 'Battery health verified', body: 'Design capacity 85% or better. Charge-cycle log on the birth certificate.', aside: 'BTS-01' },
  { title: 'Display calibrated',       body: 'Profiled for brightness uniformity and colour. Dead-pixel scan attached.',    aside: 'BTS-02' },
  { title: 'Fresh OS install',         body: 'Windows 11 or macOS clean. No trial bloatware, no leftover accounts.',        aside: 'BTS-03' },
  { title: '72-hour stress test',      body: 'Thermal log and stability run. We keep the machine if it does not pass.',    aside: 'BTS-04' },
  { title: '12-month warranty',        body: 'Parts and labour. In-workshop repair turnaround averages four days.',         aside: 'BTS-05' },
];

const STEPS = [
  { n: '01', label: '— Order',      body: 'Pick a laptop. Student delivery is free to a UK address with a .ac.uk email at checkout.' },
  { n: '02', label: '— Bench test', body: 'Each unit is bench-tested, imaged and graded before it leaves. 72 hours end-to-end.' },
  { n: '03', label: '— Dispatch',   body: '48-hour UK mainland courier. Insured, signed-for, with a 30-day return window once it lands.' },
];

const FAQ: CampaignFaqItem[] = [
  { q: 'Can I get a loaner during warranty repair?', a: 'On the AV Care Plus subscription, yes — one loan unit during each repair. Without Plus, we post out a refurbished equivalent if the repair will exceed five working days.' },
  { q: 'Do you do student discounts?',               a: 'Free delivery on any .ac.uk verification at checkout. We do not discount the hardware itself; the price you see is already a refurbished one.' },
  { q: 'Which OS is pre-installed?',                 a: 'Windows machines ship with Windows 11 Home or Pro, activated. MacBooks ship with the latest macOS version they support. Linux on request at no cost.' },
  { q: 'Can I upgrade the RAM after?',               a: 'Depends on the model. Framework and most ThinkPads yes. Modern MacBooks and ultraportable Dells no — memory is soldered. Every listing tells you which.' },
  { q: "What's the return window?",                  a: '30 days from delivery, no questions. We cover return shipping and refund inside three working days of the unit arriving back.' },
  { q: 'Do you take my old laptop in trade?',        a: 'Yes. Book a diagnostic and we quote within a working day. Credit applies directly at checkout.' },
];

async function loadLaptops(): Promise<{ laptops: TileProduct[]; total: number }> {
  const category = await prisma.productCategory.findUnique({
    where: { slug: 'laptops' },
  });
  if (!category) return { laptops: [], total: 0 };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, categoryId: category.categoryId },
      include: {
        inventory: true,
        category: { select: { slug: true } },
        builder: { select: { builderCode: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { priceGbp: 'desc' }],
      take: 9,
    }),
    prisma.product.count({
      where: { isActive: true, categoryId: category.categoryId },
    }),
  ]);

  const laptops: TileProduct[] = rows.map((p) => ({
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

  return { laptops, total };
}

export default async function LaptopsBackToSchoolCampaignPage() {
  const { laptops, total } = await loadLaptops();
  const totalOnShelf = total || 80;

  return (
    <div className="bg-paper text-ink">
      {/* HERO */}
      <section className="bav-section-x bav-fade mx-auto max-w-[1440px] pb-24 pt-32">
        <div className="bav-hero-grid">
          <div>
            <div className="bav-label mb-8 text-ink-60">— Back-to-school · refurbished · in stock</div>
            <h1 className="m-0 font-display font-light tracking-[-0.02em] text-[clamp(56px,7vw,96px)] leading-[0.96]">
              Laptops that <span className="bav-italic">last</span>
              <br /> the course.
            </h1>
            <p className="mt-10 mb-10 max-w-[480px] text-[14px] leading-[1.7] text-ink-60">
              Refurbished ThinkPads, MacBooks and Framework 16s bench-tested in Birmingham. Battery
              health above 85%, fresh OS install, 12-month warranty. Priced for a student budget,
              specced for three years of lecture theatres and part-time work.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/shop/laptops?campaign=back-to-school" className="bav-cta !w-auto px-11 py-[22px]">
                Shop laptops
              </Link>
              <Link href="/about#workshops" className="bav-underline text-[13px] text-ink no-underline">
                See the bench test <span className="arrow">→</span>
              </Link>
            </div>
          </div>
          <div className="bav-canvas relative grid h-[480px] place-items-center">
            <span className="relative z-[1] font-display font-light tracking-[-0.04em] text-ink text-[clamp(240px,32vw,420px)] leading-[0.8]">
              <span className="bav-italic">№</span>204
            </span>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <section className="border-y border-ink-10">
        <div className="bav-section-x mx-auto max-w-[1440px] py-6">
          <div className="bav-ticker">
            <div className="bav-label text-ink">{totalOnShelf} laptops on the shelf</div>
            <div className="bav-label text-center text-ink-60">
              Refurbished grade Very Good or better
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <span className="bav-pulse" />
              <span className="bav-label text-ink">48h UK delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* SHORTLIST */}
      <section className="bav-section-x mx-auto max-w-[1440px] pt-24">
        <div className="bav-4-8 mb-16">
          <div className="bav-label text-ink-60">— The shortlist</div>
          <div>
            <h2 className="m-0 font-display font-light tracking-[-0.02em] text-ink text-[48px] leading-[1.05]">
              Nine laptops, <span className="bav-italic">ready</span>.
            </h2>
            <p className="mt-5 max-w-[560px] text-[14px] leading-[1.7] text-ink-60">
              From the cheapest reliable ThinkPad on the shelf to a nearly-new M3 Pro. Each one has
              been sat with a builder for at least a working day before it reached the listing.
            </p>
          </div>
        </div>

        {laptops.length === 0 ? (
          <div className="border border-dashed border-ink-10 p-16 text-center text-[14px] text-ink-60">
            The back-to-school shortlist is being seeded — check back once the workshop surfaces nine laptops.
          </div>
        ) : (
          <div className="bav-grid-3">
            {laptops.map((p) => (
              <ProductTile key={p.productId} product={p} />
            ))}
          </div>
        )}

        {total > laptops.length && (
          <div className="mt-12">
            <Link href="/shop/laptops?campaign=back-to-school" className="bav-underline text-[13px] text-ink no-underline">
              See all {total} laptops <span className="arrow">→</span>
            </Link>
          </div>
        )}
      </section>

      {/* INCLUDED */}
      <section className="mt-24 border-y border-ink-10 bg-paper-2">
        <div className="bav-section-x mx-auto max-w-[1440px] py-24">
          <div className="bav-4-8">
            <div>
              <div className="bav-label mb-6 text-ink-60">— What&apos;s done before it ships</div>
              <h2 className="m-0 font-display font-light tracking-[-0.01em] text-ink text-[32px] leading-[1.1]">
                Every laptop, <span className="bav-italic">checked</span>.
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
          Pick ours, or <span className="bav-italic">bring</span> yours.
        </h2>
        <p className="mt-5 mb-8 text-[14px] text-ink-60">
          Trade-ins quoted inside a working day. Diagnostics booked online.
        </p>
        <Link href="/contact" className="bav-underline text-[13px] text-ink no-underline">
          Book a diagnostic <span className="arrow">→</span>
        </Link>
      </section>
    </div>
  );
}
