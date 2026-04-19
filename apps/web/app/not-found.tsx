import Link from 'next/link';

// =============================================================================
// 404 — ported from artefact (batch 5).
// Full-bleed split layout: copy on the left, № canvas on the right.
// Shared .nf-row / .nf-canvas CSS lives in apps/web/app/globals.css.
// =============================================================================

const suggestions = [
  { label: 'Home', href: '/' },
  { label: 'Shop everything', href: '/shop' },
  { label: 'Meet the builders', href: '/builders' },
  { label: 'Help centre', href: '/help' },
];

export default function NotFound() {
  return (
    <div className="bg-paper font-sans text-ink">
      <div className="nf-row">
        {/* left: copy */}
        <section
          className="bav-fade flex flex-col justify-between border-r border-ink-10"
          style={{ padding: 'clamp(56px, 10vw, 120px) clamp(24px, 5vw, 72px)' }}
        >
          <div>
            <div className="bav-label text-ink-30">— 404</div>
            <h1
              className="m-0 mt-14 font-display font-light text-ink"
              style={{
                fontSize: 'clamp(52px, 8vw, 128px)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
              }}
            >
              Not <span className="bav-italic">found</span>.
            </h1>
            <p
              className="mt-10 text-ink-60"
              style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '40ch' }}
            >
              The page you were after isn&rsquo;t here. It may have moved, the
              link may have been mis-typed, or we may have retired it. The
              catalogue and the builders are still where they were.
            </p>
          </div>

          <div className="mt-[72px]">
            <div className="bav-label mb-4 text-ink-60">— Try instead</div>
            <div className="border-t border-ink-10">
              {suggestions.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="bav-hover-opa flex items-center justify-between border-b border-ink-10 py-5 text-ink no-underline"
                >
                  <span
                    className="font-display font-light"
                    style={{ fontSize: 22, lineHeight: 1.2 }}
                  >
                    {s.label}
                  </span>
                  <span className="bav-label text-ink-30">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* right: canvas device */}
        <section
          className="bav-canvas nf-canvas relative flex items-center justify-center"
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
            404
          </span>

          {/* corner meta */}
          <div className="absolute left-12 top-12 z-[1]">
            <div className="bav-label text-ink-60">— Page status</div>
            <div
              className="mt-2 font-mono uppercase text-ink-30"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              HTTP 404 · Not Found
            </div>
          </div>
          <div className="absolute bottom-12 right-12 z-[1] text-right">
            <Link
              href="/"
              className="bav-underline bav-label text-ink no-underline"
            >
              Go home <span className="arrow">→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
