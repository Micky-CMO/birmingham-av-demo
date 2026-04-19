import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { prisma } from '@/lib/db';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';

export const metadata: Metadata = {
  title: 'New and refurbished PCs built in Birmingham',
  description:
    'New and refurbished gaming and workstation PCs, assembled and tested by named builders in Birmingham. 12-month warranty, free UK next-day delivery over £50.',
};

export const dynamic = 'force-dynamic';

const HERO_CATEGORIES = [
  { slug: 'gaming-pc-bundles', name: 'Gaming', letter: 'G' },
  { slug: 'laptops', name: 'Laptops', letter: 'L' },
  { slug: 'monitors', name: 'Monitors', letter: 'M' },
];

type JournalTeaser = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  readMinutes: number;
};

async function getLatestJournalArticle(): Promise<JournalTeaser | null> {
  const dir = path.join(process.cwd(), '..', '..', 'content', 'journal');
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  } catch {
    return null;
  }
  const articles = files
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const { data } = matter(raw);
      const slug = f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.mdx$/, '');
      return {
        slug,
        title: String(data.title ?? ''),
        dek: String(data.dek ?? ''),
        date: data.date ? new Date(String(data.date)).toISOString() : new Date().toISOString(),
        readMinutes: Number(data.readMinutes ?? 6),
      };
    })
    .filter((a) => a.title)
    .sort((a, b) => b.date.localeCompare(a.date));
  return articles[0] ?? null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function HomePage() {
  const [featuredBuilders, latestArticle] = await Promise.allSettled([
    prisma.builder.findMany({
      where: { status: 'active', tier: { in: ['elite', 'preferred'] } },
      orderBy: { yearsBuilding: 'desc' },
      take: 2,
    }),
    getLatestJournalArticle(),
  ]);

  const builders = featuredBuilders.status === 'fulfilled' ? featuredBuilders.value : [];
  const article = latestArticle.status === 'fulfilled' ? latestArticle.value : null;

  return (
    <>
      <OrganizationSchema />

      {/* HERO — pure typographic */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:pt-32 md:pb-40">
          <div className="bav-fade">
            <div className="bav-label mb-16 text-ink-60">
              — Est. 2020 · Birmingham, United Kingdom
            </div>
            <h1 className="m-0 mb-14 font-display text-[clamp(64px,11vw,172px)] font-light leading-[0.92] tracking-[-0.04em]">
              Computers,<br />
              <span className="bav-italic">considered</span>.
            </h1>
            <div className="max-w-[480px]">
              <p className="mb-12 text-[21px] leading-[1.5] text-ink-60">
                Built by hand in the United Kingdom. Warrantied for twelve months.
                Signed by the builder who assembled it.
              </p>
              <Link
                href="/shop"
                className="bav-underline text-[14px] text-ink no-underline"
              >
                <span>Shop everything</span>
                <span className="arrow font-mono">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES — three letter tiles */}
      <section className="border-b border-ink-10">
        <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
          <div className="bav-label mb-14 text-ink-60">— Three ways in</div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
            {HERO_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/${cat.slug}`}
                className="block text-ink no-underline"
              >
                <div
                  className="bav-canvas relative mb-7"
                  style={{ aspectRatio: '4 / 5' }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center font-display italic font-light tracking-[-0.05em]"
                    style={{
                      fontSize: 'clamp(160px, 18vw, 280px)',
                      color: 'rgba(23,20,15,0.09)',
                    }}
                  >
                    {cat.letter}
                  </div>
                </div>
                <div className="font-display text-[32px] tracking-[-0.02em]">
                  {cat.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FROM THE WORKSHOP — builder stories */}
      {builders.length > 0 && (
        <section className="border-b border-ink-10 bg-paper-2">
          <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
            <div className="bav-label mb-16 text-ink-60">— From the workshop</div>
            <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-18">
              {builders.map((b) => {
                const estYear = new Date(b.joinedAt).getFullYear();
                return (
                  <div key={b.builderCode}>
                    <div
                      className="bav-ink-canvas relative mb-7"
                      style={{ aspectRatio: '4 / 5' }}
                    >
                      <div
                        className="bav-label absolute bottom-5 left-5"
                        style={{ color: 'rgba(247,245,242,0.5)' }}
                      >
                        {b.builderCode} · Est. {estYear}
                      </div>
                    </div>
                    <div className="mb-2 font-display text-[34px] tracking-[-0.02em]">
                      {b.displayName}
                    </div>
                    <div className="bav-label mb-5 text-ink-60">
                      Builder · {b.specialities[0] ?? 'Generalist'} · {b.yearsBuilding}{' '}
                      {b.yearsBuilding === 1 ? 'year' : 'years'}
                    </div>
                    {b.bio && (
                      <p className="mb-7 max-w-[480px] text-[16px] leading-[1.6] text-ink-60">
                        {b.bio}
                      </p>
                    )}
                    <Link
                      href={`/builders/${b.builderCode}`}
                      className="bav-underline text-[13px] text-ink no-underline"
                    >
                      <span>Read more</span>
                      <span className="arrow font-mono">→</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* JOURNAL — latest article teaser */}
      {article && (
        <section>
          <div className="mx-auto max-w-page px-6 py-24 md:px-12 md:py-32">
            <div className="bav-label mb-14 text-ink-60">— Journal</div>
            <Link
              href={`/journal/${article.slug}`}
              className="block max-w-[760px] text-ink no-underline"
            >
              <div className="bav-label mb-6 text-ink-60">
                {formatDate(article.date)} · {article.readMinutes} min read
              </div>
              <h3 className="m-0 mb-7 font-display font-light leading-[1.04] tracking-[-0.025em]"
                  style={{ fontSize: 'clamp(36px, 4.8vw, 60px)' }}>
                {article.title}
              </h3>
              <p className="mb-7 text-[18px] leading-[1.55] text-ink-60">{article.dek}</p>
              <span className="bav-underline text-[13px] text-ink">
                <span>Read the piece</span>
                <span className="arrow font-mono">→</span>
              </span>
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
