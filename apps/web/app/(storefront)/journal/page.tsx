import type { Metadata } from 'next';
import Link from 'next/link';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export const metadata: Metadata = {
  title: 'The journal — Birmingham AV',
  description:
    'Longer pieces on what we build, how we build it, and the decisions that keep changing our mind.',
};

export const dynamic = 'force-static';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type JournalEntry = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  readMinutes: number;
  author: string;
};

// Fallback editorial set used when no MDX files are present under
// content/journal/. Kept in-code so the page renders something real during
// early dev and doesn't 500 on an empty content dir.
const STATIC_ARTICLES: JournalEntry[] = [
  {
    slug: 'why-we-still-burn-in-every-machine',
    title: 'Why we still burn-in every machine',
    dek: 'Twenty-four hours on a stress-test bench is how we catch the one in three hundred. Here is what that actually looks like on the workshop floor, and why we refuse to cut the step.',
    date: '2026-04-14',
    readMinutes: 6,
    author: 'Alfie Ashworth',
  },
  {
    slug: 'the-case-for-a-less-powerful-gpu',
    title: 'The case for a less powerful GPU',
    dek: 'Half our 4090 buyers would be better served by a 4080 Super. We argue the point with numbers, and explain why we will tell you to spend less if the build warrants it.',
    date: '2026-03-28',
    readMinutes: 8,
    author: 'Ruth Onyango',
  },
  {
    slug: 'on-warranty-and-what-it-should-mean',
    title: 'On warranty, and what it should mean',
    dek: 'Twelve months parts and labour is the floor, not the ceiling. How we think about standing behind a build five years after it leaves the shop.',
    date: '2026-03-11',
    readMinutes: 5,
    author: 'James Chen',
  },
  {
    slug: 'ddr5-and-the-myth-of-more',
    title: 'DDR5 and the myth of more',
    dek: 'There is a point beyond which extra memory helps nothing you actually do. We ran the benchmarks on six workloads and found it earlier than the marketing suggests.',
    date: '2026-02-22',
    readMinutes: 9,
    author: 'Sasha Whitlock',
  },
  {
    slug: 'a-refurbished-machine-is-not-a-second-class-one',
    title: 'A refurbished machine is not a second-class one',
    dek: 'Our refurbished units pass the same twenty-four-hour burn-in as new builds, carry the same warranty, and are built by the same twenty-two people.',
    date: '2026-02-10',
    readMinutes: 7,
    author: 'Ruth Onyango',
  },
  {
    slug: 'the-quietest-pc-we-have-built',
    title: 'The quietest PC we have built',
    dek: 'Twenty-two decibels at the chassis under full load. A long account of how we got there, including the fan curves we stole from a recording studio.',
    date: '2026-01-30',
    readMinutes: 11,
    author: 'Jamie Holt',
  },
  {
    slug: 'why-we-left-ebay',
    title: 'Why we left eBay',
    dek: 'Forty million pounds a year through a platform that reduced our builds to thumbnails. What the move to our own storefront is allowing us to do, and what it cost.',
    date: '2026-01-15',
    readMinutes: 10,
    author: 'James Chen',
  },
];

const CONTENT_DIR = path.join(process.cwd(), '..', '..', 'content', 'journal');

/**
 * Read any MDX files in content/journal/. Frontmatter fields `title`, `dek`,
 * `date`, `readMinutes` and `author` are expected. Files without frontmatter
 * are skipped silently. Returns null if the directory doesn't exist.
 */
async function readJournalDir(): Promise<JournalEntry[] | null> {
  let entries: string[];
  try {
    entries = await readdir(CONTENT_DIR);
  } catch {
    return null;
  }
  const files = entries.filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  if (!files.length) return null;

  const parsed = await Promise.all(
    files.map(async (f) => {
      const raw = await readFile(path.join(CONTENT_DIR, f), 'utf8');
      const { data } = matter(raw);
      const slug = f.replace(/\.(mdx|md)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
      if (!data.title || !data.date) return null;
      return {
        slug,
        title: String(data.title),
        dek: String(data.dek ?? data.description ?? ''),
        date: new Date(data.date).toISOString().slice(0, 10),
        readMinutes: Number(data.readMinutes ?? 5),
        author: String(data.author ?? 'The workshop'),
      } as JournalEntry;
    }),
  );

  return parsed.filter((e): e is JournalEntry => e !== null);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function JournalPage() {
  const mdx = await readJournalDir();
  const articles = (mdx && mdx.length > 0 ? mdx : STATIC_ARTICLES).sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
  const page = 1;
  const totalPages = 1;

  return (
    <div className="bg-paper text-ink">
      {/* ===== MASTHEAD ===== */}
      <section className="bav-fade mx-auto max-w-[1200px] px-6 pb-24 pt-32 md:px-12">
        <div className="bav-label mb-10 text-ink-60">— Writing from the workshop</div>
        <h1 className="m-0 font-display font-light leading-[0.96] tracking-[-0.025em] text-[clamp(64px,9vw,136px)]">
          The <span className="bav-italic">journal</span>.
        </h1>
        <p className="m-0 mt-10 max-w-[560px] text-[17px] leading-[1.6] text-ink-60">
          Longer pieces on what we build, how we build it, and the decisions that keep changing
          our mind. Written by the people on the workshop floor, published when we have
          something to say.
        </p>
      </section>

      {/* ===== ARTICLES ===== */}
      <section className="mx-auto max-w-[1200px] px-6 md:px-12">
        <div className="border-t border-ink">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/journal/${a.slug}`}
              className="journal-row block border-b border-ink-10 py-11 text-ink no-underline"
            >
              <div className="journal-row-grid grid items-baseline gap-12 md:grid-cols-[140px_1fr_140px_48px]">
                <div className="whitespace-nowrap font-mono text-[11px] tracking-[0.08em] text-ink-30">
                  {a.date}
                </div>
                <div>
                  <h2 className="m-0 mb-3 font-display font-light leading-[1.15] tracking-[-0.01em] text-[clamp(24px,2.6vw,34px)]">
                    {a.title}
                  </h2>
                  <p
                    className="m-0 max-w-[620px] overflow-hidden text-[16px] leading-[1.55] text-ink-60"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {a.dek}
                  </p>
                </div>
                <div className="text-right">
                  <div className="whitespace-nowrap font-mono text-[11px] tracking-[0.08em] text-ink-30">
                    {String(a.readMinutes).padStart(2, '0')} min read
                  </div>
                  <div className="mt-[6px] font-mono text-[11px] tracking-[0.08em] text-ink-30">
                    {a.author}
                  </div>
                </div>
                <div className="hidden text-right md:block">
                  <span className="journal-arrow inline-block text-[20px] text-ink">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== PAGINATION ===== */}
      <section className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 pb-40 pt-[72px] md:px-12">
        <div className="font-mono text-[12px] tracking-[0.1em] text-ink-30">
          {String(page).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            disabled={page === 1}
            className="bav-cta-secondary"
            style={{
              opacity: page === 1 ? 0.35 : 1,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Newer pieces
          </button>
          <button
            type="button"
            disabled={page === totalPages}
            className="bav-cta-secondary"
            style={{
              opacity: page === totalPages ? 0.35 : 1,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Older pieces →
          </button>
        </div>
      </section>
    </div>
  );
}
