import Link from 'next/link';

/**
 * ReviewsList — server component rendered on the product page beneath the
 * specification section. The parent page fetches approved reviews via Prisma
 * and passes them in. If `reviews` is empty an editorial empty-state is shown
 * linking to the submission form.
 */

export type ReviewItem = {
  reviewId: string;
  rating: number;
  title: string | null;
  body: string;
  reviewerFirstName: string;
  date: string | Date;
  verified: boolean;
  photos?: string[];
  helpful?: number;
  builder?: { displayName: string } | null;
};

export type ReviewsListProps = {
  product: { slug: string };
  reviews: ReviewItem[];
};

function formatDate(d: string | Date): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const iso = dt.toISOString().slice(0, 10);
  return iso;
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="inline-flex gap-1" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <svg key={n} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M10 1.5L12.6 7.8L19.4 8.4L14.2 13L15.8 19.6L10 16L4.2 19.6L5.8 13L0.6 8.4L7.4 7.8L10 1.5Z"
              fill={filled ? '#17140F' : 'none'}
              stroke="#17140F"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

export function ReviewsList({ product, reviews }: ReviewsListProps) {
  if (!reviews.length) {
    return (
      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[1200px] px-6 md:px-12">
          <div className="bav-label mb-6 text-ink-60">— Reviews</div>
          <h2 className="m-0 mb-6 font-display text-[40px] font-light leading-[1.05]">
            No reviews <span className="bav-italic">yet</span>.
          </h2>
          <p className="mb-6 max-w-[560px] text-[15px] text-ink-60">
            Nobody has written one for this build. If you own it, we&apos;d like to hear from you.
          </p>
          <Link
            href={`/product/${product.slug}/review`}
            className="bav-underline text-ink no-underline"
          >
            <span>Be the first</span>
            <span className="arrow">→</span>
          </Link>
        </div>
      </section>
    );
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const verifiedCount = reviews.filter((r) => r.verified).length;

  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        {/* header */}
        <div className="mb-2 grid items-baseline gap-12 border-b border-ink-10 pb-12 md:grid-cols-[4fr_8fr]">
          <div className="bav-label text-ink-60">— Reviews</div>
          <div>
            <h2 className="m-0 mb-5 font-display font-light leading-[1.05] tracking-[-0.015em] text-[clamp(32px,4vw,52px)]">
              {reviews.length} <span className="bav-italic">considered</span> opinions.
            </h2>
            <div className="flex items-center gap-4 text-[14px] text-ink-60">
              <Stars value={Math.round(avg)} size={14} />
              <span className="font-mono text-ink">{avg.toFixed(1)} / 5</span>
              <span className="text-ink-30">·</span>
              <span>{verifiedCount} verified purchases</span>
            </div>
          </div>
        </div>

        {/* list */}
        <div>
          {reviews.map((r) => (
            <article
              key={r.reviewId}
              className="grid gap-8 border-b border-ink-10 py-10 md:grid-cols-[180px_1fr]"
            >
              {/* meta */}
              <div>
                <Stars value={r.rating} size={13} />
                <div className="mt-4 font-mono text-[11px] tracking-[0.08em] text-ink-30">
                  {formatDate(r.date)}
                </div>
                <div className="mt-[10px] text-[13px] font-medium">{r.reviewerFirstName}</div>
                {r.verified && (
                  <div className="bav-label mt-2 leading-[1.4] text-ink-30">
                    Verified
                    <br />
                    purchase
                  </div>
                )}
                {r.builder && (
                  <div className="mt-[10px] text-[11px] leading-[1.4] text-ink-30">
                    Built by
                    <br />
                    <span className="text-ink-60">{r.builder.displayName}</span>
                  </div>
                )}
              </div>

              {/* content */}
              <div>
                {r.title && (
                  <div className="mb-4 font-display text-[22px] leading-[1.3]">{r.title}</div>
                )}
                <p className="m-0 max-w-[720px] text-[15px] leading-[1.65] text-ink">{r.body}</p>
                {r.photos && r.photos.length > 0 && (
                  <div className="mt-5 flex gap-3">
                    {r.photos.map((_p, i) => (
                      <div
                        key={i}
                        className="bav-canvas flex h-24 w-24 items-center justify-center"
                        aria-hidden="true"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" style={{ opacity: 0.4 }}>
                          <rect x="2" y="3" width="16" height="14" stroke="#17140F" strokeWidth="1" fill="none" />
                          <circle cx="7" cy="8" r="1.5" fill="#17140F" />
                          <path d="M2 13L6 10L10 13L14 9L18 13" stroke="#17140F" strokeWidth="1" fill="none" />
                        </svg>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex items-center gap-5">
                  <span className="inline-flex items-center gap-[6px] text-[12px] text-ink-60">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M3 10V5L6 1L7 2V5H10L9 10H3Z" stroke="currentColor" strokeWidth="1" fill="none" />
                    </svg>
                    Helpful ({r.helpful ?? 0})
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={`/product/${product.slug}/review`}
            className="bav-underline text-[14px] text-ink no-underline"
          >
            <span>Write a review</span>
            <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
