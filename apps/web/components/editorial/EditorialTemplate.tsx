import Link from 'next/link';
import type { ReactNode } from 'react';

// ============================================================================
// EditorialTemplate (from artefact 25, batch 5)
//
// Reusable shell used by: /about, /warehouses, /careers, /contact, /journal/*.
// Styles live in apps/web/app/globals.css under the
// "Editorial + Legal templates" section; tokens are CSS variables defined in
// :root (see same file). The style block that the artefact originally inlined
// has been deleted here to keep the module clean.
// ============================================================================

export type EditorialByline = {
  name: string;
  role?: string;
  dateIso?: string;
};

export type EditorialHero =
  | { kind: 'canvas'; buildNumber: string }
  | { kind: 'ink-canvas'; caption: string }
  | { kind: 'none' };

export type EditorialGalleryItem = {
  buildNumber: string;
  caption?: string;
};

export type EditorialBlock =
  | { kind: 'p'; text: string }
  | { kind: 'dropcap-p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'pullquote'; text: string; cite?: string }
  | { kind: 'gallery'; items: EditorialGalleryItem[] };

export type EditorialCta = {
  label: string;
  href: string;
};

export type EditorialTemplateProps = {
  eyebrow: string;
  title: string;
  titleItalic: string;
  lede?: string;
  byline?: EditorialByline | null;
  hero?: EditorialHero;
  blocks?: EditorialBlock[];
  cta?: EditorialCta | null;
};

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function EditorialTemplate({
  eyebrow,
  title,
  titleItalic,
  lede,
  byline = null,
  hero = { kind: 'none' },
  blocks = [],
  cta = null,
}: EditorialTemplateProps) {
  const paragraphCount = blocks.filter(
    (b) => b.kind === 'p' || b.kind === 'dropcap-p',
  ).length;

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* ---- title block ---- */}
      <header className="bav-fade mx-auto max-w-page px-12 pb-[72px] pt-32">
        <div className="ed-grid">
          <div>
            <div className="bav-label text-ink-60">— {eyebrow}</div>
            {byline && (
              <div className="mt-7 border-t border-ink-10 pt-5">
                <div
                  className="font-display font-light"
                  style={{ fontSize: 20, lineHeight: 1.25 }}
                >
                  {byline.name}
                </div>
                {byline.role && (
                  <div className="bav-label mt-1.5 text-ink-30">{byline.role}</div>
                )}
                {byline.dateIso && (
                  <div className="bav-label mt-2.5 font-mono text-ink-30">
                    {formatDate(byline.dateIso)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <h1
              className="m-0 font-display font-light text-ink"
              style={{
                fontSize: 'clamp(48px, 7vw, 104px)',
                lineHeight: 1.0,
                letterSpacing: '-0.025em',
              }}
            >
              {title} <span className="bav-italic">{titleItalic}</span>.
            </h1>
            {lede && (
              <p
                className="mt-10 font-sans text-ink"
                style={{ fontSize: 22, lineHeight: 1.5, maxWidth: '60ch' }}
              >
                {lede}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ---- hero slot ---- */}
      {hero.kind !== 'none' && (
        <section className="mx-auto max-w-page px-12 pb-24">
          {hero.kind === 'canvas' && (
            <div
              className="bav-canvas flex items-center justify-center"
              style={{ aspectRatio: '16 / 9' }}
            >
              <span
                className="relative z-[1] font-display font-light italic text-ink"
                style={{
                  fontSize: 'clamp(200px, 28vw, 420px)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                №{hero.buildNumber}
              </span>
            </div>
          )}
          {hero.kind === 'ink-canvas' && (
            <div
              className="bav-ink-canvas flex items-end p-12"
              style={{ aspectRatio: '16 / 9' }}
            >
              <span
                className="bav-label relative z-[1]"
                style={{ color: 'rgba(247,245,242,0.6)' }}
              >
                {hero.caption}
              </span>
            </div>
          )}
        </section>
      )}

      {/* ---- body ---- */}
      <section className="mx-auto max-w-page px-12 pb-24">
        <div className="ed-grid">
          <aside>
            <div className="sticky top-24">
              <div className="bav-label text-ink-60">— Reading</div>
              <p
                className="mt-5 font-sans text-ink-30"
                style={{ fontSize: 13, lineHeight: 1.55 }}
              >
                {paragraphCount} paragraphs. Open in a quiet tab.
              </p>
            </div>
          </aside>
          <article className="ed-prose">
            {blocks.map((b, i) => {
              if (b.kind === 'p') return <p key={i}>{b.text}</p>;
              if (b.kind === 'dropcap-p')
                return (
                  <p key={i} className="dropcap">
                    {b.text}
                  </p>
                );
              if (b.kind === 'h2') return <h2 key={i}>{b.text}</h2>;
              if (b.kind === 'h3') return <h3 key={i}>{b.text}</h3>;
              if (b.kind === 'pullquote')
                return (
                  <blockquote key={i} className="pullquote">
                    {'\u201C'}
                    {b.text}
                    {'\u201D'}
                    {b.cite && <cite>— {b.cite}</cite>}
                  </blockquote>
                );
              if (b.kind === 'gallery')
                return (
                  <div key={i} className="ed-gallery">
                    {b.items.map((it, j) => (
                      <figure key={j} className="ed-gallery-item m-0">
                        <div className="bav-canvas canvas">
                          <span className="buildno">
                            <span
                              className="bav-italic align-super"
                              style={{ fontSize: '0.45em' }}
                            >
                              №
                            </span>
                            {it.buildNumber}
                          </span>
                        </div>
                        {it.caption && (
                          <figcaption className="caption">{it.caption}</figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                );
              return null;
            })}

            {cta && (
              <div
                className="mt-24 border-t border-ink-10 pt-12"
                style={{ maxWidth: '64ch' }}
              >
                <CtaLink href={cta.href}>{cta.label}</CtaLink>
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

function CtaLink({ href, children }: { href: string; children: ReactNode }) {
  const isInternal = href.startsWith('/');
  const classes = 'bav-underline font-sans text-ink no-underline';
  const style = { fontSize: 16 } as const;

  if (isInternal) {
    return (
      <Link href={href} className={classes} style={style}>
        {children} <span className="arrow">→</span>
      </Link>
    );
  }
  return (
    <a href={href} className={classes} style={style}>
      {children} <span className="arrow">→</span>
    </a>
  );
}

export default EditorialTemplate;
