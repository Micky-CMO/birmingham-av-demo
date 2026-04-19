'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

/**
 * ReviewSubmissionForm — client component that posts to /api/reviews.
 * Receives the validated product + builder + orderItemId from the server
 * page so it can focus on input UX without reading the DB itself.
 */

type Product = {
  title: string;
  slug: string;
  sku: string;
  buildNumber: string;
};

type Builder = {
  displayName: string;
  builderCode: string;
};

export type ReviewSubmissionFormProps = {
  productId: string;
  orderItemId: string;
  product: Product;
  builder: Builder;
};

function Stars({
  value,
  size = 28,
  onSelect,
}: {
  value: number;
  size?: number;
  onSelect: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const displayed = hover || value;

  return (
    <div
      className="inline-flex cursor-pointer gap-1"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label="Overall rating"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} of 5`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onSelect(n)}
          className="border-0 bg-transparent p-0 transition-opacity"
        >
          <svg width={size} height={size} viewBox="0 0 20 20">
            <path
              d="M10 1.5L12.6 7.8L19.4 8.4L14.2 13L15.8 19.6L10 16L4.2 19.6L5.8 13L0.6 8.4L7.4 7.8L10 1.5Z"
              fill={n <= displayed ? '#17140F' : 'none'}
              stroke="#17140F"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function ReviewSubmissionForm({
  productId,
  orderItemId,
  product,
  builder,
}: ReviewSubmissionFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = rating > 0 && body.trim().length >= 20 && !submitting;

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    // For now we store filenames as a placeholder — real photo upload needs
    // presigned S3 URLs, which we'll wire once the object-store service lands.
    const files = Array.from(e.target.files ?? []).slice(0, 5 - photos.length);
    if (!files.length) return;
    setPhotos((prev) => [...prev, ...files.map((f) => f.name)]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId,
          orderItemId,
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
          // Only send HTTP URLs — local file names are placeholders until
          // the uploader is wired in. This keeps validation green.
          photoUrls: photos.filter((p) => /^https?:\/\//.test(p)),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(data.error?.message ?? 'could not submit review');
        setSubmitting(false);
        return;
      }
      router.push(`/product/${product.slug}?review=submitted`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'network error');
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-paper text-ink">
      <form
        onSubmit={handleSubmit}
        className="bav-fade mx-auto max-w-[800px] px-6 py-24 md:px-12 md:py-[96px]"
      >
        {/* eyebrow */}
        <div className="bav-label mb-8 text-ink-60">— Leave a review</div>

        {/* headline */}
        <h1 className="m-0 mb-6 font-display font-light leading-[1.05] tracking-[-0.015em] text-[clamp(40px,5vw,64px)]">
          How did it <span className="bav-italic">turn out</span>?
        </h1>

        <p className="m-0 mb-14 max-w-[560px] text-[17px] leading-[1.6] text-ink-60">
          A few honest sentences help more than a paragraph of superlatives. Tell us what you
          bought it for and whether it did the job.
        </p>

        {/* product pane */}
        <div className="mb-16 grid items-center gap-6 border-y border-ink-10 py-6 md:grid-cols-[120px_1fr]">
          <div className="bav-canvas flex aspect-[4/5] items-center justify-center">
            <div className="font-display text-[40px] font-light leading-none text-[rgba(23,20,15,0.85)]">
              <span className="bav-italic text-[0.55em]">№</span>
              {product.buildNumber}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[18px] font-medium">{product.title}</div>
            <div className="mb-2 font-mono text-[11px] tracking-[0.08em] text-ink-30">
              {product.sku}
            </div>
            <div className="bav-label text-ink-30">
              Verified purchase · Built by {builder.displayName}
            </div>
          </div>
        </div>

        {/* rating */}
        <div className="mb-12">
          <div className="bav-label mb-4 text-ink-60">— Overall rating</div>
          <div className="flex items-center gap-5">
            <Stars value={rating} size={28} onSelect={setRating} />
            {rating > 0 && (
              <div className="font-mono text-[13px] text-ink-60">{rating} / 5</div>
            )}
          </div>
        </div>

        {/* title */}
        <div className="mb-12">
          <div className="bav-label mb-4 text-ink-60">
            — Title{' '}
            <span className="normal-case tracking-normal text-ink-30">(optional)</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="One line summary"
            maxLength={80}
            className="w-full border-0 border-b border-ink-10 bg-transparent py-3 text-[18px] text-ink outline-none focus:border-ink"
          />
        </div>

        {/* body */}
        <div className="mb-12">
          <div className="bav-label mb-4 text-ink-60">— Your review</div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you buy it for? How has it held up? Anything you'd change?"
            rows={8}
            maxLength={2000}
            className="w-full resize-y border border-ink-10 bg-transparent p-5 text-[15px] leading-[1.6] text-ink outline-none focus:border-ink"
          />
          <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-30">
            <span>
              {body.length < 20
                ? `${20 - body.length} more characters needed`
                : 'Ready to submit'}
            </span>
            <span>{body.length} / 2000</span>
          </div>
        </div>

        {/* photos */}
        <div className="mb-16">
          <div className="bav-label mb-4 text-ink-60">
            — Photos{' '}
            <span className="normal-case tracking-normal text-ink-30">(up to 5, optional)</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {photos.map((name, i) => (
              <div
                key={i}
                className="relative flex aspect-square items-center justify-center border border-ink-10 bg-paper-2 p-2"
              >
                <div className="break-all text-center font-mono text-[10px] leading-[1.3] text-ink-60">
                  {name.length > 20 ? `${name.slice(0, 18)}…` : name}
                </div>
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border border-ink-10 bg-paper p-0"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8">
                    <path d="M1 1L7 7M7 1L1 7" stroke="rgba(23,20,15,0.60)" strokeWidth="1" />
                  </svg>
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="flex aspect-square cursor-pointer items-center justify-center border border-dashed border-ink-10 transition-colors hover:border-ink">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path d="M10 4V16M4 10H16" stroke="rgba(23,20,15,0.60)" strokeWidth="1" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {photos.some((p) => !/^https?:\/\//.test(p)) && (
            <p className="mt-3 font-mono text-[10px] text-ink-30">
              Photo uploads land in a later pass — for now filenames preview only.
            </p>
          )}
        </div>

        {/* errors */}
        {error && (
          <div className="mb-6 border border-ink-10 bg-paper-2 p-4 text-[13px] text-ink">
            {error}
          </div>
        )}

        {/* submit */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/product/${product.slug}`}
            className="bav-cta-secondary no-underline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bav-cta"
            disabled={!canSubmit}
            style={{
              opacity: canSubmit ? 1 : 0.35,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </div>

        <p className="mt-6 text-center text-[12px] leading-[1.5] text-ink-30">
          Reviews are moderated for spam and abuse, not for sentiment. We publish every honest
          review including negative ones.
        </p>
      </form>
    </div>
  );
}
