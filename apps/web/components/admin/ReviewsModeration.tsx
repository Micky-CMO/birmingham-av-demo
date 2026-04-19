'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type AdminReviewRow = {
  reviewId: string;
  rating: number;
  title: string | null;
  body: string;
  productTitle: string;
  productSlug: string;
  productSku: string;
  reviewerFirst: string;
  reviewerLastInitial: string;
  reviewerEmail: string;
  createdAt: string;
  adminStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  verifiedPurchase: boolean;
  photoCount: number;
};

interface Props {
  reviews: AdminReviewRow[];
  stats: { pending: number; flagged: number; approvedMonth: number; averageRating: number };
}

type StatusKey = 'all' | 'pending' | 'flagged' | 'approved' | 'rejected';

const ink = 'var(--ink)';
const ink60 = 'var(--ink-60)';
const ink30 = 'var(--ink-30)';
const ink10 = 'var(--ink-10)';
const paper = 'var(--paper)';
const paper2 = 'var(--paper-2)';

function statusBadge(s: AdminReviewRow['adminStatus']) {
  if (s === 'pending') return { dot: 'var(--ink-30)', label: 'Pending', color: ink60 };
  if (s === 'flagged') return { dot: '#B94040', label: 'Flagged', color: '#B94040' };
  if (s === 'approved') return { dot: '#1EB53A', label: 'Approved', color: '#1EB53A' };
  if (s === 'rejected') return { dot: 'var(--ink-30)', label: 'Rejected', color: ink60 };
  return { dot: 'var(--ink-30)', label: s as string, color: ink60 };
}

function Stars({ n, size = 12, gap = 2 }: { n: number; size?: number; gap?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < n;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M6 1 L7.47 4.09 L10.85 4.5 L8.35 6.78 L9 10.1 L6 8.44 L3 10.1 L3.65 6.78 L1.15 4.5 L4.53 4.09 Z"
              fill={filled ? 'var(--ink)' : 'none'}
              stroke="var(--ink)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

export function ReviewsModeration({ reviews: initial, stats }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initial);
  const [statusFilter, setStatusFilter] = useState<StatusKey>('pending');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.reviewId ?? null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== 'all' && r.adminStatus !== statusFilter) return false;
      if (ratingFilter !== 'all' && r.rating !== Number.parseInt(ratingFilter, 10)) return false;
      return true;
    });
  }, [reviews, statusFilter, ratingFilter]);

  const active = useMemo(
    () => reviews.find((r) => r.reviewId === activeId) ?? filtered[0] ?? null,
    [reviews, activeId, filtered],
  );

  const applyAction = async (action: 'approve' | 'reject' | 'flag') => {
    if (!active) return;
    setBusyId(active.reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${active.reviewId}/moderate`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('moderate failed');
      const data = (await res.json()) as { review: { adminStatus: AdminReviewRow['adminStatus'] } };
      setReviews((prev) =>
        prev.map((r) =>
          r.reviewId === active.reviewId ? { ...r, adminStatus: data.review.adminStatus } : r,
        ),
      );
      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);
      alert('Action failed — check the console.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div
        style={{ padding: '48px 48px 32px', borderBottom: `1px solid ${ink10}` }}
      >
        <div className="bav-label mb-3.5" style={{ color: ink60 }}>— Admin · Reviews moderation</div>
        <div className="flex items-baseline justify-between gap-10">
          <div>
            <h1
              className="m-0 font-display font-light"
              style={{
                fontSize: 'clamp(40px, 4vw, 56px)',
                letterSpacing: '-0.01em',
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Reviews.
            </h1>
            <p
              className="mt-4 max-w-[660px] text-[14px] leading-[1.55]"
              style={{ color: ink60 }}
            >
              Verified-purchase reviews are auto-approved unless flagged. This queue is for
              pending, flagged, and disputed reviews only.
            </p>
          </div>
        </div>

        <div
          className="mt-8 grid border"
          style={{ gridTemplateColumns: 'repeat(4, 200px)', borderColor: ink10 }}
        >
          {[
            { label: `${stats.pending} pending`, emphasis: true },
            { label: `${stats.flagged} flagged`, emphasis: true },
            { label: `${stats.approvedMonth} approved this month`, emphasis: false },
            {
              label: `Average rating — ${stats.averageRating.toFixed(1)}`,
              emphasis: false,
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: '20px 24px',
                borderRight: i < 3 ? `1px solid ${ink10}` : 'none',
              }}
            >
              <div className="font-mono tabular-nums" style={{ fontSize: 11, color: s.emphasis ? ink : ink60 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="mt-8 flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="bav-label" style={{ color: ink60 }}>Status</div>
            <div style={{ display: 'flex', border: `1px solid ${ink10}` }}>
              {(['all', 'pending', 'flagged', 'rejected', 'approved'] as StatusKey[]).map((s, i, arr) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  style={{
                    background: statusFilter === s ? ink : 'transparent',
                    color: statusFilter === s ? paper : ink,
                    padding: '9px 16px',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRight: i < arr.length - 1 ? `1px solid ${ink10}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="bav-label" style={{ color: ink60 }}>Rating</div>
            <div style={{ display: 'flex', border: `1px solid ${ink10}` }}>
              {['all', '5', '4', '3', '2', '1'].map((r, i, arr) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRatingFilter(r)}
                  style={{
                    background: ratingFilter === r ? ink : 'transparent',
                    color: ratingFilter === r ? paper : ink,
                    padding: '9px 14px',
                    fontSize: 11,
                    border: 'none',
                    borderRight: i < arr.length - 1 ? `1px solid ${ink10}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {r === 'all' ? 'ALL' : r + '★'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <div
          style={{
            width: 580,
            flexShrink: 0,
            borderRight: `1px solid ${ink10}`,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 && (
            <div className="px-6 py-10 text-[13px]" style={{ color: ink60 }}>
              No reviews match the current filters.
            </div>
          )}
          {filtered.map((r) => {
            const isActive = r.reviewId === active?.reviewId;
            const sb = statusBadge(r.adminStatus);
            return (
              <div
                key={r.reviewId}
                onClick={() => setActiveId(r.reviewId)}
                style={{
                  padding: 24,
                  borderBottom: `1px solid ${ink10}`,
                  borderLeft: isActive ? `2px solid ${ink}` : '2px solid transparent',
                  background: isActive ? paper2 : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div className="mb-2.5 flex flex-wrap items-center gap-3.5">
                  <Stars n={r.rating} />
                  <div
                    style={{
                      fontSize: 12,
                      color: ink60,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.productTitle}
                  </div>
                  <div className="font-mono" style={{ fontSize: 11, color: ink30 }}>
                    {r.createdAt.slice(0, 10)}
                  </div>
                </div>
                {r.title && (
                  <div
                    className="font-display"
                    style={{
                      fontSize: 16,
                      fontWeight: 400,
                      marginBottom: 8,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    {r.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: ink60,
                    lineHeight: 1.55,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}
                >
                  {r.body}
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: sb.dot, display: 'inline-block' }} />
                  <span className="bav-label" style={{ color: sb.color }}>{sb.label}</span>
                  {r.verifiedPurchase && (
                    <span className="bav-label" style={{ color: ink30, marginLeft: 12 }}>Verified</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {active && (
          <div
            style={{
              flex: 1,
              padding: 48,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1 }}>
              <div className="bav-label mb-3.5" style={{ color: ink60 }}>— Review · {active.adminStatus}</div>
              {active.title && (
                <h2
                  className="font-display font-light"
                  style={{
                    fontSize: 32,
                    margin: 0,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                    marginBottom: 20,
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  {active.title}
                </h2>
              )}
              <Stars n={active.rating} size={16} gap={4} />
              <div className="mt-4 font-mono" style={{ fontSize: 11, color: ink60 }}>
                {active.reviewerFirst} {active.reviewerLastInitial} ·{' '}
                {active.verifiedPurchase ? 'Verified purchase' : 'Unverified'} ·{' '}
                {active.createdAt}
              </div>

              <a
                href={`/product/${active.productSlug}`}
                className="mt-6 flex items-center gap-4 border p-4 no-underline"
                style={{ borderColor: ink10, color: ink }}
              >
                <div
                  className="bav-canvas"
                  style={{
                    width: 72,
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div className="font-display" style={{ fontSize: 14, fontVariationSettings: "'opsz' 144" }}>
                    {active.productTitle}
                  </div>
                  <div className="mt-1 font-mono" style={{ fontSize: 11, color: ink60 }}>
                    {active.productSku}
                  </div>
                </div>
              </a>

              <div
                className="mt-8"
                style={{ fontSize: 14, color: ink, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
              >
                {active.body}
              </div>

              {active.photoCount > 0 && (
                <div className="mt-8">
                  <div className="bav-label mb-3.5" style={{ color: ink60 }}>
                    — Photos ({active.photoCount})
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                position: 'sticky',
                bottom: 0,
                background: paper,
                paddingTop: 32,
                paddingBottom: 8,
                borderTop: `1px solid ${ink10}`,
                marginTop: 40,
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="bav-cta"
                  style={{ flex: 1, padding: '14px 28px' }}
                  onClick={() => applyAction('approve')}
                  disabled={busyId === active.reviewId || isPending}
                >
                  Approve &amp; publish
                </button>
                <button
                  type="button"
                  className="bav-cta-secondary"
                  style={{ flex: 1, padding: '13px 28px' }}
                  onClick={() => applyAction('reject')}
                  disabled={busyId === active.reviewId || isPending}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="bav-cta-secondary"
                  style={{ flex: 1, padding: '13px 28px' }}
                  onClick={() => applyAction('flag')}
                  disabled={busyId === active.reviewId || isPending}
                >
                  Flag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
