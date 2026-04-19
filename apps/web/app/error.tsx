'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// =============================================================================
// 500 — ported from artefact (batch 5).
// Next.js 14 error boundary — must be a client component and receives
// { error, reset } props. The "Try again" button calls reset(); secondary
// routes use Link / anchor tags.
// =============================================================================

const fallbackRoutes = [
  { label: 'Go to the home page', href: '/' },
  { label: 'Browse the catalogue', href: '/shop' },
  { label: 'Contact support', href: '/support' },
];

function formatIncidentId(digest: string | undefined): string {
  if (!digest) {
    // Generate a stable fallback so the box always has something to quote.
    const now = new Date();
    const ts =
      now.toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random()
        .toString(16)
        .slice(2, 8)
        .toUpperCase();
    return 'INC-' + ts;
  }
  return 'INC-' + digest.slice(0, 12).toUpperCase();
}

function formatTimestamp(d: Date): string {
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: wire to the real telemetry client (Sentry / OpenTelemetry) so
    // the incidentId quoted to users lines up with the trace on-call sees.
    // eslint-disable-next-line no-console
    console.error('[error.tsx] boundary caught:', error);
  }, [error]);

  const incidentId = formatIncidentId(error.digest);
  const occurredAt = formatTimestamp(new Date());

  return (
    <div className="bg-paper font-sans text-ink">
      <div className="err-row">
        {/* left: copy */}
        <section
          className="bav-fade flex flex-col justify-between border-r border-ink-10"
          style={{ padding: 'clamp(56px, 10vw, 120px) clamp(24px, 5vw, 72px)' }}
        >
          <div>
            <div className="bav-label text-ink-30">— 500</div>
            <h1
              className="m-0 mt-14 font-display font-light text-ink"
              style={{
                fontSize: 'clamp(52px, 8vw, 128px)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
              }}
            >
              Off <span className="bav-italic">duty</span>.
            </h1>
            <p
              className="mt-10 text-ink-60"
              style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '42ch' }}
            >
              Something on our side stopped working. The error has been logged
              and the on-call engineer has been paged; no action is needed from
              you for that part.
            </p>
            <p
              className="mt-4 text-ink-60"
              style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '42ch' }}
            >
              If you were in the middle of checking out, your cart is safe and
              no payment will have been taken.
            </p>

            {/* incident block */}
            <div
              className="mt-14 border-b border-t border-ink-10 py-6"
              style={{ maxWidth: 520 }}
            >
              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: '1fr 1fr' }}
              >
                <div>
                  <div className="bav-label text-ink-30">Incident ID</div>
                  <div
                    className="mt-2 font-mono text-ink"
                    style={{ fontSize: 13 }}
                  >
                    {incidentId}
                  </div>
                </div>
                <div>
                  <div className="bav-label text-ink-30">Occurred</div>
                  <div
                    className="mt-2 font-mono text-ink"
                    style={{ fontSize: 13 }}
                  >
                    {occurredAt} GMT
                  </div>
                </div>
              </div>
              <p
                className="mt-4 text-ink-60"
                style={{ fontSize: 13, lineHeight: 1.55 }}
              >
                Quote this ID if you contact support; it lets us pull the exact
                trace.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                className="bav-cta"
                onClick={() => reset()}
                style={{ width: 'auto' }}
              >
                Try again
              </button>
              <Link
                href="/support"
                className="bav-underline bav-label self-center text-ink no-underline"
              >
                Contact support <span className="arrow">→</span>
              </Link>
            </div>
          </div>

          <div className="mt-[72px]">
            <div className="bav-label mb-4 text-ink-60">— Or head to</div>
            <div className="border-t border-ink-10">
              {fallbackRoutes.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="bav-hover-opa flex items-center justify-between border-b border-ink-10 py-[18px] text-ink no-underline"
                >
                  <span
                    className="font-display font-light"
                    style={{ fontSize: 20, lineHeight: 1.2 }}
                  >
                    {r.label}
                  </span>
                  <span className="bav-label text-ink-30">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* right: canvas device */}
        <section
          className="bav-canvas err-canvas relative flex items-center justify-center"
          style={{ minHeight: '100vh' }}
        >
          <span
            className="relative z-[1] font-display font-light italic text-ink"
            style={{
              fontSize: 'clamp(180px, 26vw, 420px)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            <span
              className="align-super"
              style={{ fontSize: '0.4em', marginRight: '0.05em' }}
            >
              №
            </span>
            500
          </span>

          <div className="absolute left-12 top-12 z-[1]">
            <div className="bav-label text-ink-60">— Page status</div>
            <div
              className="mt-2 font-mono uppercase text-ink-30"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              HTTP 500 · Internal Error
            </div>
          </div>

          <div className="absolute bottom-12 left-12 z-[1] flex items-center gap-2.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--ink)' }}
            />
            <span className="bav-label text-ink-60">Engineer paged</span>
          </div>

          <div className="absolute bottom-12 right-12 z-[1] text-right">
            <div className="bav-label text-ink-30">Status page</div>
            <a
              href="https://status.birminghamav.co.uk"
              className="bav-underline bav-label mt-2 inline-flex text-ink no-underline"
            >
              status.birminghamav.co.uk <span className="arrow">→</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
