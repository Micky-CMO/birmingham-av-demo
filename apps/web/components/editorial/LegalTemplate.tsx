'use client';

import { useEffect, useState } from 'react';

// ============================================================================
// LegalTemplate (from artefact 26, batch 5)
//
// Reusable shell used by: /terms, /privacy, /cookies, /modern-slavery,
// /warranty, /shipping, /returns-policy, /accessibility.
//
// Marked 'use client' because the active-clause TOC tracks scroll position
// via a window scroll listener.
//
// Styles live in apps/web/app/globals.css under the
// "Editorial + Legal templates" section; tokens are CSS variables defined in
// :root. The <style> block the artefact originally inlined has been deleted
// here to keep the module clean.
// ============================================================================

export type LegalBodyItem = string | { list: string[] };

export type LegalSubClause = {
  n: string;
  title: string;
  body: LegalBodyItem[];
};

export type LegalClause = {
  n: string;
  id: string;
  title: string;
  body: LegalBodyItem[];
  sub?: LegalSubClause[];
};

export type LegalTemplateProps = {
  eyebrow: string;
  title: string;
  titleItalic: string;
  lastUpdatedIso: string;
  effectiveIso?: string;
  versionLabel?: string;
  intro?: string;
  clauses: LegalClause[];
  contactLine?: string;
  downloadHref?: string;
};

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function renderBody(body: LegalBodyItem[] | undefined) {
  if (!Array.isArray(body)) return null;
  return body.map((item, i) => {
    if (typeof item === 'string') return <p key={i}>{item}</p>;
    if (item && Array.isArray(item.list)) {
      return (
        <ul key={i}>
          {item.list.map((li, j) => (
            <li key={j}>{li}</li>
          ))}
        </ul>
      );
    }
    return null;
  });
}

export function LegalTemplate({
  eyebrow,
  title,
  titleItalic,
  lastUpdatedIso,
  effectiveIso,
  versionLabel,
  intro,
  clauses,
  contactLine,
  downloadHref,
}: LegalTemplateProps) {
  const [activeId, setActiveId] = useState<string | null>(clauses[0]?.id ?? null);

  useEffect(() => {
    const onScroll = () => {
      const offsets = clauses.map((c) => {
        const el = document.getElementById(`clause-${c.id}`);
        if (!el) return { id: c.id, top: Infinity };
        return { id: c.id, top: el.getBoundingClientRect().top };
      });
      const above = offsets
        .filter((o) => o.top <= 120)
        .sort((a, b) => b.top - a.top)[0];
      if (above) setActiveId(above.id);
      else if (offsets[0]) setActiveId(offsets[0].id);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [clauses]);

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* ---- title block ---- */}
      <header className="bav-fade mx-auto max-w-page px-12 pb-12 pt-24">
        <div className="bav-label text-ink-60">— {eyebrow}</div>
        <h1
          className="m-0 mt-8 font-display font-light text-ink"
          style={{
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 1.0,
            letterSpacing: '-0.025em',
            maxWidth: '16ch',
          }}
        >
          {title} <span className="bav-italic">{titleItalic}</span>.
        </h1>

        {/* meta strip */}
        <div
          className="mt-12 grid border-b border-t border-ink-10"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          <div className="border-r border-ink-10 py-5 pr-5">
            <div className="bav-label text-ink-30">Last updated</div>
            <div className="mt-2 font-mono text-ink" style={{ fontSize: 14 }}>
              {formatDate(lastUpdatedIso)}
            </div>
          </div>
          {effectiveIso && (
            <div className="border-r border-ink-10 px-5 py-5">
              <div className="bav-label text-ink-30">Effective</div>
              <div className="mt-2 font-mono text-ink" style={{ fontSize: 14 }}>
                {formatDate(effectiveIso)}
              </div>
            </div>
          )}
          {versionLabel && (
            <div className="border-r border-ink-10 px-5 py-5">
              <div className="bav-label text-ink-30">Version</div>
              <div className="mt-2 font-mono text-ink" style={{ fontSize: 14 }}>
                {versionLabel}
              </div>
            </div>
          )}
          {downloadHref && (
            <div className="flex items-center justify-end px-5 py-5">
              <a
                href={downloadHref}
                className="bav-label bav-hover-opa text-ink no-underline"
              >
                Download PDF →
              </a>
            </div>
          )}
        </div>

        {intro && (
          <p
            className="mt-10 text-ink-60"
            style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '64ch' }}
          >
            {intro}
          </p>
        )}
      </header>

      {/* ---- body ---- */}
      <main className="mx-auto max-w-page px-12 pb-32 pt-12">
        <div className="lg-grid">
          {/* TOC */}
          <aside>
            <nav className="lg-toc">
              <div className="bav-label mb-3.5 text-ink-60">— Contents</div>
              {clauses.map((c) => (
                <a
                  key={c.id}
                  href={`#clause-${c.id}`}
                  className={`lg-toc-link ${activeId === c.id ? 'active' : ''}`}
                >
                  <span className="n">{c.n}</span>
                  <span>{c.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          {/* clauses */}
          <article>
            {clauses.map((c) => (
              <section
                key={c.id}
                id={`clause-${c.id}`}
                className="lg-clause"
              >
                <div className="cn">Clause {c.n}</div>
                <h2 className="ct">{c.title}</h2>
                {renderBody(c.body)}
                {c.sub && c.sub.length > 0 && (
                  <div className="lg-sub">
                    {c.sub.map((s, j) => (
                      <div key={j} className="lg-sub-item">
                        <div className="sn">{s.n}</div>
                        <div>
                          <div className="st">{s.title}</div>
                          {renderBody(s.body)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}

            {contactLine && (
              <div className="mt-[72px] border-b border-t border-ink-10 py-8">
                <div className="bav-label mb-3 text-ink-60">— Questions</div>
                <p
                  className="m-0 text-ink"
                  style={{ fontSize: 15, lineHeight: 1.6, maxWidth: '64ch' }}
                >
                  {contactLine}
                </p>
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}

export default LegalTemplate;
