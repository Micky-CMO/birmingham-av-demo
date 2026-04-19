import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { search } from '@/lib/services/search';
import { formatGbp } from '@bav/lib';
import { SearchInput } from './SearchInput';
import { SortSelect } from './SortSelect';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string };
}): Promise<Metadata> {
  const q = searchParams.q?.slice(0, 40) ?? '';
  if (!q) return { title: 'Search — Birmingham AV', description: 'Search the catalogue.' };
  return {
    title: `Search: ${q} — Birmingham AV`,
    description: `Results for "${q}" across Birmingham AV products, builders, and help.`,
  };
}

/**
 * A few editorial "always-on" suggestions surfaced on the search page when the
 * backend service returns results. These live in-code because the search
 * service intentionally only indexes products + builders — showing a couple
 * of curated help-centre articles and journal pieces beneath real hits helps
 * the page land editorially without another fetch.
 */
const HELP_ARTICLES = [
  {
    slug: 'what-refurbished-means',
    title: 'What "refurbished" actually means here',
    excerpt:
      'Every refurbished unit passes the same 24-hour burn-in as a new build and carries the same warranty. The word is not an apology.',
  },
  {
    slug: 'returning-a-machine',
    title: 'Returning a machine',
    excerpt:
      'How our 30-day return works, what counts as fair wear, and when we charge for damage.',
  },
  {
    slug: 'choosing-a-gpu',
    title: 'Choosing a GPU without the marketing',
    excerpt:
      'A plain-language account of the workloads that warrant a 4090, a 4080 Super, or just a 7900 XTX.',
  },
];

const JOURNAL_PICKS = [
  {
    slug: 'why-we-still-burn-in-every-machine',
    title: 'Why we still burn-in every machine',
    dek: 'Twenty-four hours on a stress-test bench is how we catch the one in three hundred.',
    date: '2026-04-14',
    readMinutes: 6,
  },
  {
    slug: 'the-case-for-a-less-powerful-gpu',
    title: 'The case for a less powerful GPU',
    dek: 'Half our 4090 buyers would be better served by a 4080. We argue the point with numbers.',
    date: '2026-03-28',
    readMinutes: 8,
  },
  {
    slug: 'on-warranty-and-what-it-should-mean',
    title: 'On warranty, and what it should mean',
    dek: 'Twelve months parts and labour is the floor, not the ceiling.',
    date: '2026-01-30',
    readMinutes: 5,
  },
];

type Sort = 'relevance' | 'newest' | 'price-low' | 'price-high' | 'bestseller';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string };
}) {
  const query = searchParams.q ?? '';
  const sort = (searchParams.sort ?? 'relevance') as Sort;
  const results = query ? await search(query, 24) : null;

  const sortedProducts = results
    ? applySort([...results.products], sort)
    : [];

  const hasQuery = query.length > 0;
  const hasResults = !!results && results.total > 0;

  return (
    <div className="mx-auto max-w-page px-6 md:px-12">
      {/* ===== SEARCH HEADER ===== */}
      <section className="bav-fade pt-[72px]">
        <div className="bav-label mb-7 text-ink-60">— Search</div>
        <SearchInput defaultValue={query} defaultSort={sort} />

        {hasQuery && results && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <div className="bav-label text-ink-60">
              {results.total} {results.total === 1 ? 'result' : 'results'} for{' '}
              <span className="text-ink">&ldquo;{query}&rdquo;</span>
            </div>
            <SortSelect query={query} value={sort} />
          </div>
        )}
      </section>

      {/* ===== PROMPT (no query) ===== */}
      {!hasQuery && (
        <section className="mx-auto max-w-[800px] py-[160px]">
          <div className="bav-label mb-6 text-ink-60">— Where to begin</div>
          <h2 className="m-0 mb-8 font-display font-light leading-[1.08] tracking-[-0.015em] text-[clamp(40px,5vw,64px)]">
            What are you <span className="bav-italic">looking for</span>?
          </h2>
          <p className="mb-10 max-w-[560px] text-[17px] leading-[1.6] text-ink-60">
            Try a product name (<span className="font-mono">ThinkPad X1</span>), a spec (
            <span className="font-mono">RTX 5090</span>), or a builder name.
          </p>
          <div className="flex flex-wrap gap-6">
            <Link href="/shop" className="bav-underline text-ink no-underline">
              <span>Browse the catalogue</span>
              <span className="arrow">→</span>
            </Link>
            <Link href="/help" className="bav-underline text-ink no-underline">
              <span>Help centre</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </section>
      )}

      {/* ===== EMPTY STATE ===== */}
      {hasQuery && results && results.total === 0 && (
        <section className="mx-auto max-w-[800px] py-[160px]">
          <div className="bav-label mb-6 text-ink-60">— Nothing found</div>
          <h2 className="m-0 mb-8 font-display font-light leading-[1.08] tracking-[-0.015em] text-[clamp(40px,5vw,64px)]">
            No matches for <span className="bav-italic">&ldquo;{query}&rdquo;</span>.
          </h2>
          <p className="mb-10 max-w-[560px] text-[17px] leading-[1.6] text-ink-60">
            Try a simpler term, or browse the catalogue. Most things we sell are indexed by
            builder, component and price, not by marketing names.
          </p>
          <div className="flex flex-wrap gap-6">
            <Link href="/shop" className="bav-underline text-ink no-underline">
              <span>Browse the catalogue</span>
              <span className="arrow">→</span>
            </Link>
            <Link href="/help" className="bav-underline text-ink no-underline">
              <span>Help centre</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </section>
      )}

      {/* ===== RESULTS ===== */}
      {hasResults && results && (
        <>
          {/* Products */}
          {sortedProducts.length > 0 && (
            <section className="pt-20">
              <div className="bav-label mb-6 text-ink-60">
                — Products · {sortedProducts.length} shown
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
                {sortedProducts.map((p) => {
                  const buildNumber = buildNumberFromSlug(p.slug);
                  return (
                    <Link
                      key={p.productId}
                      href={`/product/${p.slug}`}
                      className="bav-tile block text-ink no-underline"
                    >
                      <div className="bav-canvas relative mb-5 flex aspect-[4/5] items-center justify-center">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.title}
                            fill
                            sizes="(max-width: 800px) 50vw, (max-width: 1100px) 33vw, 25vw"
                            className="relative z-[5] object-cover"
                          />
                        ) : (
                          <div className="relative z-[1] font-display font-light leading-none tracking-[-0.02em] text-[clamp(80px,14vw,180px)] text-[rgba(23,20,15,0.85)]">
                            <span className="bav-italic text-[0.55em]">№</span>
                            {buildNumber}
                          </div>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="mb-1 text-[15px] font-medium leading-[1.3]">
                            {p.title}
                          </div>
                          {p.subtitle && (
                            <div className="truncate text-[13px] text-ink-60">{p.subtitle}</div>
                          )}
                        </div>
                        <div className="shrink-0 text-right font-mono text-[14px] tabular-nums">
                          {formatGbp(p.priceGbp)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-12 text-center">
                <Link
                  href={`/shop?q=${encodeURIComponent(query)}`}
                  className="bav-underline text-[14px] text-ink no-underline"
                >
                  <span>See all {results.total} results</span>
                  <span className="arrow">→</span>
                </Link>
              </div>
            </section>
          )}

          {/* Divider */}
          <div className="my-20 h-px bg-ink-10" />

          {/* Help articles (static curated) */}
          <section>
            <div className="bav-label mb-6 text-ink-60">
              — Articles · {HELP_ARTICLES.length} from the help centre
            </div>
            <div>
              {HELP_ARTICLES.map((a, i) => (
                <Link
                  key={a.slug}
                  href={`/help/${a.slug}`}
                  className={`bav-hover-opa grid grid-cols-[1fr_auto] items-baseline gap-8 border-t border-ink-10 py-7 text-ink no-underline ${
                    i === HELP_ARTICLES.length - 1 ? 'border-b border-ink-10' : ''
                  }`}
                >
                  <div className="max-w-[900px]">
                    <div className="mb-2 text-[18px] font-medium">{a.title}</div>
                    <div className="text-[14px] leading-[1.5] text-ink-60">{a.excerpt}</div>
                  </div>
                  <div className="text-[20px] text-ink-30">→</div>
                </Link>
              ))}
            </div>
          </section>

          {/* Builders */}
          {results.builders.length > 0 && (
            <>
              <div className="my-20 h-px bg-ink-10" />
              <section>
                <div className="bav-label mb-6 text-ink-60">
                  — Builders · {results.builders.length} matched
                </div>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  {results.builders.map((b) => (
                    <Link
                      key={b.builderCode}
                      href={`/builders/${b.builderCode}`}
                      className="block text-ink no-underline"
                    >
                      <div className="bav-ink-canvas mb-4 flex aspect-[3/4] items-end p-5">
                        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(247,245,242,0.6)]">
                          {b.builderCode}
                        </div>
                      </div>
                      <div className="mb-1 font-display text-[16px] font-medium">
                        {b.displayName}
                      </div>
                      <div className="text-[12px] text-ink-60">
                        {capitalise(b.tier)} · {b.yearsBuilding ?? '—'} years
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Journal picks */}
          <div className="my-20 h-px bg-ink-10" />
          <section className="pb-[160px]">
            <div className="bav-label mb-6 text-ink-60">— From the journal</div>
            <div>
              {JOURNAL_PICKS.map((j, i) => (
                <Link
                  key={j.slug}
                  href={`/journal/${j.slug}`}
                  className={`bav-hover-opa grid grid-cols-[140px_1fr_auto] items-baseline gap-8 border-t border-ink-10 py-9 text-ink no-underline ${
                    i === JOURNAL_PICKS.length - 1 ? 'border-b border-ink-10' : ''
                  }`}
                >
                  <div className="font-mono text-[11px] tracking-[0.08em] text-ink-30">
                    {j.date}
                  </div>
                  <div>
                    <div className="mb-[6px] font-display text-[24px] font-light leading-[1.2]">
                      {j.title}
                    </div>
                    <div className="max-w-[720px] text-[14px] leading-[1.5] text-ink-60">
                      {j.dek}
                    </div>
                  </div>
                  <div className="whitespace-nowrap font-mono text-[11px] tracking-[0.08em] text-ink-30">
                    {String(j.readMinutes).padStart(2, '0')} min read
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ---- helpers ----

function buildNumberFromSlug(slug: string): string {
  const m = slug.match(/(\d+)/g);
  if (!m) return '001';
  const last = m[m.length - 1] ?? '001';
  return last.padStart(3, '0').slice(-3);
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type SearchHit = Awaited<ReturnType<typeof search>>['products'][number];

function applySort(hits: SearchHit[], sort: Sort): SearchHit[] {
  switch (sort) {
    case 'price-low':
      return hits.sort((a, b) => a.priceGbp - b.priceGbp);
    case 'price-high':
      return hits.sort((a, b) => b.priceGbp - a.priceGbp);
    // newest, bestseller, relevance — the underlying service already orders by
    // ts_rank then created_at desc, so we leave the order untouched.
    default:
      return hits;
  }
}
