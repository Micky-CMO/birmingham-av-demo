import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { search } from '@/lib/services/search';
import { formatGbp } from '@bav/lib';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const q = searchParams.q?.slice(0, 40) ?? '';
  if (!q) return { title: 'Search — Birmingham AV', description: 'Search the catalogue.' };
  return {
    title: `Search: ${q} — Birmingham AV`,
    description: `Results for "${q}" across Birmingham AV products, builders, and help.`,
  };
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? '';
  const results = query ? await search(query, 24) : null;

  return (
    <div className="mx-auto max-w-page px-6 pb-32 pt-20 md:px-12">
      {/* Header + input */}
      <div className="mb-12">
        <div className="bav-label mb-4 text-ink-60">— Search</div>
        <form action="/search" method="GET" className="mb-4">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search builds, builders, help"
            autoFocus
            className="w-full border-0 border-b border-ink-10 bg-transparent pb-3 font-display text-[clamp(32px,4vw,48px)] font-light leading-none tracking-[-0.025em] text-ink outline-none focus:border-ink"
          />
        </form>
        {results && (
          <div className="bav-label text-ink-60">
            {results.total} {results.total === 1 ? 'match' : 'matches'}
            {query && <> for <span className="text-ink">"{query}"</span></>}
          </div>
        )}
      </div>

      {/* No query yet — show prompt */}
      {!query && (
        <div className="py-20 text-center">
          <h1 className="mb-4 font-display font-light tracking-[-0.025em] text-[40px]">
            What are you <span className="bav-italic">looking for</span>?
          </h1>
          <p className="text-[16px] text-ink-60">
            Try a product name (`ThinkPad X1`), a spec (`RTX 5090`), or a builder name.
          </p>
        </div>
      )}

      {/* Empty state */}
      {results && results.total === 0 && (
        <div className="py-20 text-center">
          <h2 className="mb-4 font-display font-light tracking-[-0.025em] text-[40px]">
            Nothing matched.
          </h2>
          <p className="mb-8 text-[16px] text-ink-60">
            Try a simpler term, or browse{' '}
            <Link href="/shop" className="bav-underline text-ink">
              <span>the catalogue</span>
            </Link>
            .
          </p>
        </div>
      )}

      {/* Product results */}
      {results && results.products.length > 0 && (
        <section className="mb-16">
          <div className="bav-label mb-8 text-ink-60">— Products ({results.products.length})</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
            {results.products.map((p) => (
              <Link
                key={p.productId}
                href={`/product/${p.slug}`}
                className="bav-tile block text-ink no-underline"
              >
                <div className="bav-canvas relative mb-4 aspect-[4/5]">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.title}
                      fill
                      sizes="(max-width: 900px) 50vw, 30vw"
                      className="relative z-[5] object-cover"
                    />
                  ) : (
                    <div className="bav-tile-num absolute inset-0 flex items-center justify-center font-display font-light italic leading-none tracking-[-0.05em] text-[clamp(72px,8vw,120px)]">
                      №
                    </div>
                  )}
                </div>
                <div className="mb-1 line-clamp-2 text-[15px] font-medium leading-[1.35]">{p.title}</div>
                {p.subtitle && (
                  <div className="bav-label mb-2 truncate text-ink-60">{p.subtitle}</div>
                )}
                <div className="font-mono text-[17px] tabular-nums">
                  {formatGbp(p.priceGbp)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Builder results */}
      {results && results.builders.length > 0 && (
        <section>
          <div className="bav-label mb-8 text-ink-60">— Builders ({results.builders.length})</div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {results.builders.map((b) => (
              <Link
                key={b.builderCode}
                href={`/builders/${b.builderCode}`}
                className="block text-ink no-underline"
              >
                <div className="bav-ink-canvas mb-4 aspect-[4/5]" />
                <div className="font-display text-[18px] tracking-[-0.015em]">
                  {b.displayName}
                </div>
                <div className="bav-label mt-1 text-ink-60">
                  {b.tier} · {b.yearsBuilding ?? '—'} years
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
