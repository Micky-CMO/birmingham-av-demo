import React from 'react';

// ============================================================================
// ARTEFACT 25 — Editorial template
//
// Reusable shell used by: /about, /warehouses, /careers, /contact,
// and each article at /journal/[slug]. The fenced block below is the
// canonical template; it must be pasted byte-identical into any future
// artefact that uses this shell. md5 the fenced region before shipping.
// ============================================================================

// --- TEMPLATE START ---
const BAV_TOKENS = {
  paper:  '#F7F5F2',
  paper2: '#EDE9E3',
  ink:    '#17140F',
  ink60:  'rgba(23,20,15,0.60)',
  ink30:  'rgba(23,20,15,0.30)',
  ink10:  'rgba(23,20,15,0.10)',
  green:  '#1EB53A',
  display: { fontFamily: "'Fraunces', Georgia, serif", fontVariationSettings: "'opsz' 144" },
  sans:    { fontFamily: "'Instrument Sans', system-ui, sans-serif" },
  mono:    { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums' },
};

function BAVEditorialStyles() {
  const t = BAV_TOKENS;
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; box-sizing: border-box; }
      body { margin: 0; }

      .bav-label { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
      .bav-italic { font-style: italic; font-variation-settings: 'opsz' 144; }
      .bav-fade { animation: bavFade 1000ms cubic-bezier(0.16, 1, 0.3, 1) backwards; }
      @keyframes bavFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .bav-underline { position: relative; display: inline-flex; align-items: center; gap: 10px; padding-bottom: 3px; }
      .bav-underline::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: currentColor; transform-origin: right; transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1); }
      .bav-underline:hover::after { transform-origin: left; }
      .bav-underline .arrow { transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1); }
      .bav-underline:hover .arrow { transform: translateX(6px); }
      .bav-canvas { background: linear-gradient(140deg, #EDE9E3 0%, #E3DED6 100%); position: relative; overflow: hidden; }
      .bav-canvas::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 32% 28%, rgba(255,255,255,0.7), transparent 55%); pointer-events: none; }
      .bav-canvas::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 72% 82%, rgba(23,20,15,0.09), transparent 60%); pointer-events: none; }
      .bav-ink-canvas { background: linear-gradient(140deg, #2a2520 0%, #17140F 85%); position: relative; overflow: hidden; }
      .bav-ink-canvas::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 28% 22%, rgba(255,255,255,0.14), transparent 50%); pointer-events: none; }
      .bav-hover-opa { transition: opacity 300ms; }
      .bav-hover-opa:hover { opacity: 0.6; }

      .ed-prose p { font-size: 18px; line-height: 1.7; color: ${t.ink}; margin: 0 0 28px; max-width: 64ch; }
      .ed-prose p.lede { font-size: 22px; line-height: 1.5; color: ${t.ink}; max-width: 60ch; }
      .ed-prose h2 { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 144; font-weight: 300; font-size: clamp(28px, 3vw, 40px); line-height: 1.15; letter-spacing: -0.01em; margin: 72px 0 24px; color: ${t.ink}; }
      .ed-prose h3 { font-family: 'Instrument Sans', system-ui, sans-serif; font-weight: 500; font-size: 18px; line-height: 1.3; margin: 48px 0 16px; color: ${t.ink}; }
      .ed-prose .pullquote { font-family: 'Fraunces', Georgia, serif; font-weight: 300; font-style: italic; font-variation-settings: 'opsz' 144; font-size: clamp(28px, 3.4vw, 42px); line-height: 1.3; letter-spacing: -0.01em; color: ${t.ink}; border-top: 1px solid ${t.ink}; border-bottom: 1px solid ${t.ink10}; padding: 48px 0; margin: 72px 0; max-width: 54ch; }
      .ed-prose .pullquote cite { display: block; margin-top: 24px; font-style: normal; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${t.ink30}; }
      .ed-prose .dropcap::first-letter { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 144; font-weight: 300; font-style: italic; float: left; font-size: 88px; line-height: 0.85; margin: 8px 16px 0 -2px; color: ${t.ink}; }

      .ed-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 72px 0; max-width: 100%; }
      @media (max-width: 900px) { .ed-gallery { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 520px) { .ed-gallery { grid-template-columns: 1fr; } }
      .ed-gallery-item { display: block; }
      .ed-gallery-item .canvas { aspect-ratio: 4 / 5; display: flex; align-items: center; justify-content: center; }
      .ed-gallery-item .buildno { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 144; font-weight: 300; font-style: italic; font-size: clamp(80px, 10vw, 140px); letter-spacing: -0.03em; color: ${t.ink}; line-height: 1; position: relative; z-index: 1; }
      .ed-gallery-item .caption { font-size: 13px; line-height: 1.5; color: ${t.ink60}; margin-top: 16px; }

      .ed-grid { display: grid; grid-template-columns: 4fr 8fr; gap: 96px; }
      @media (max-width: 1000px) { .ed-grid { grid-template-columns: 1fr; gap: 48px; } }
    `}</style>
  );
}

/**
 * EditorialTemplate
 *
 * Props:
 *   eyebrow       string   — section label, rendered with "— " prefix
 *   title         string   — display headline, plain part
 *   titleItalic   string   — the one word receiving the italic swash
 *   lede          string   — single-paragraph standfirst
 *   byline        { name, role, dateIso } | null
 *   hero          { kind: 'canvas', buildNumber } | { kind: 'ink-canvas', caption } | { kind: 'none' }
 *   blocks        Array of:
 *                   { kind: 'p', text }
 *                   { kind: 'dropcap-p', text }
 *                   { kind: 'h2', text }
 *                   { kind: 'h3', text }
 *                   { kind: 'pullquote', text, cite? }
 *                   { kind: 'gallery', items: [{ buildNumber, caption }] }
 *   cta           { label, href } | null
 */
function EditorialTemplate({
  eyebrow,
  title,
  titleItalic,
  lede,
  byline = null,
  hero = { kind: 'none' },
  blocks = [],
  cta = null,
}) {
  const t = BAV_TOKENS;
  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <BAVEditorialStyles />
      <div style={{ background: t.paper, color: t.ink, ...t.sans, minHeight: '100vh' }}>

        {/* ---- title block ---- */}
        <header className="bav-fade" style={{ maxWidth: 1440, margin: '0 auto', padding: '128px 48px 72px' }}>
          <div className="ed-grid">
            <div>
              <div className="bav-label" style={{ color: t.ink60 }}>— {eyebrow}</div>
              {byline && (
                <div style={{ marginTop: 28, borderTop: `1px solid ${t.ink10}`, paddingTop: 20 }}>
                  <div style={{ ...t.display, fontWeight: 300, fontSize: 20, lineHeight: 1.25, color: t.ink }}>{byline.name}</div>
                  {byline.role && <div className="bav-label" style={{ color: t.ink30, marginTop: 6 }}>{byline.role}</div>}
                  {byline.dateIso && <div className="bav-label" style={{ color: t.ink30, marginTop: 10, ...t.mono }}>{formatDate(byline.dateIso)}</div>}
                </div>
              )}
            </div>
            <div>
              <h1 style={{ ...t.display, fontWeight: 300, fontSize: 'clamp(48px, 7vw, 104px)', lineHeight: 1.0, letterSpacing: '-0.025em', margin: 0, color: t.ink }}>
                {title} <span className="bav-italic">{titleItalic}</span>.
              </h1>
              {lede && (
                <p className="lede" style={{ ...t.sans, fontSize: 22, lineHeight: 1.5, color: t.ink, marginTop: 40, maxWidth: '60ch' }}>
                  {lede}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* ---- hero slot ---- */}
        {hero.kind !== 'none' && (
          <section style={{ maxWidth: 1440, margin: '0 auto', padding: '0 48px 96px' }}>
            {hero.kind === 'canvas' && (
              <div className="bav-canvas" style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...t.display, fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(200px, 28vw, 420px)', letterSpacing: '-0.04em', color: t.ink, lineHeight: 1, position: 'relative', zIndex: 1 }}>
                  №{hero.buildNumber}
                </span>
              </div>
            )}
            {hero.kind === 'ink-canvas' && (
              <div className="bav-ink-canvas" style={{ aspectRatio: '16 / 9', display: 'flex', alignItems: 'flex-end', padding: 48 }}>
                <span className="bav-label" style={{ color: 'rgba(247,245,242,0.6)', position: 'relative', zIndex: 1 }}>{hero.caption}</span>
              </div>
            )}
          </section>
        )}

        {/* ---- body ---- */}
        <section style={{ maxWidth: 1440, margin: '0 auto', padding: '0 48px 96px' }}>
          <div className="ed-grid">
            <aside>
              <div style={{ position: 'sticky', top: 96 }}>
                <div className="bav-label" style={{ color: t.ink60 }}>— Reading</div>
                <p style={{ ...t.sans, fontSize: 13, lineHeight: 1.55, color: t.ink30, marginTop: 20 }}>
                  {blocks.filter(b => b.kind === 'p' || b.kind === 'dropcap-p').length} paragraphs.
                  Open in a quiet tab.
                </p>
              </div>
            </aside>
            <article className="ed-prose">
              {blocks.map((b, i) => {
                if (b.kind === 'p') return <p key={i}>{b.text}</p>;
                if (b.kind === 'dropcap-p') return <p key={i} className="dropcap">{b.text}</p>;
                if (b.kind === 'h2') return <h2 key={i}>{b.text}</h2>;
                if (b.kind === 'h3') return <h3 key={i}>{b.text}</h3>;
                if (b.kind === 'pullquote') return (
                  <blockquote key={i} className="pullquote">
                    \u201C{b.text}\u201D
                    {b.cite && <cite>— {b.cite}</cite>}
                  </blockquote>
                );
                if (b.kind === 'gallery') return (
                  <div key={i} className="ed-gallery">
                    {b.items.map((it, j) => (
                      <figure key={j} className="ed-gallery-item" style={{ margin: 0 }}>
                        <div className="bav-canvas canvas">
                          <span className="buildno">
                            <span className="bav-italic" style={{ fontSize: '0.45em', verticalAlign: 'super' }}>№</span>{it.buildNumber}
                          </span>
                        </div>
                        {it.caption && <figcaption className="caption">{it.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                );
                return null;
              })}

              {cta && (
                <div style={{ marginTop: 96, paddingTop: 48, borderTop: `1px solid ${t.ink10}`, maxWidth: '64ch' }}>
                  <a href={cta.href} className="bav-underline" style={{ color: t.ink, textDecoration: 'none', ...t.sans, fontSize: 16 }}>
                    {cta.label} <span className="arrow">→</span>
                  </a>
                </div>
              )}
            </article>
          </div>
        </section>
      </div>
    </>
  );
}
// --- TEMPLATE END ---

// ============================================================================
// Demo invocation — /about page content. In production, swap the `content`
// object for data loaded from the CMS or a route-specific content module.
// ============================================================================

export default function BirminghamAVAbout() {
  const content = {
    eyebrow: 'About',
    title: 'Computers,',
    titleItalic: 'considered',
    lede: 'Birmingham AV is a workshop in the Jewellery Quarter that builds PCs by hand, tests them for twenty-four hours, and puts a birth certificate in the box. Twenty-two builders. Roughly two hundred units in flight at any given moment. No shortcuts anyone outside the shop would notice, which is most of the work.',
    byline: null,
    hero: { kind: 'canvas', buildNumber: '042' },
    blocks: [
      { kind: 'dropcap-p', text: 'We started in 2011 out of a first-floor unit on Vyse Street with three benches and a DPD account. Twelve years on, the benches moved to a larger workshop, the DPD account got a dedicated collection, and the team grew. The shape of the work did not change: one builder per unit, from first screw to boot, and nobody ships a machine they would not run at home.' },
      { kind: 'p', text: 'We sold on eBay for most of that period because eBay put us in front of buyers. It also put us next to shops that drop-ship from Shenzhen, skip the burn-in, and photograph a generic tower instead of the one they\u2019re sending. Our returns rate was a third of theirs. Our reviews were different. Our margin was compressed by the same fees that subsidised them. Building our own storefront was the next honest step.' },
      { kind: 'h2', text: 'What we build' },
      { kind: 'p', text: 'Gaming towers are the biggest slice, but it\u2019s not most of the work. The rest is what gets bracketed as "other": silent workstations for audio engineers, multi-GPU rigs for small render farms, locked-down fleets for accountancy practices, projector and AV gear for schools and churches, refurbished laptops for buyers who want repairability over thinness. The shop floor has a water-loop bench and a screwdriver-only bench, and they get roughly equal traffic.' },
      { kind: 'pullquote', text: 'No one sees the twenty-four-hour soak test. That\u2019s the point. They see a machine that still works in year five.', cite: 'Alfie Ashworth, BLD-004' },
      { kind: 'h2', text: 'How we\u2019re set up' },
      { kind: 'p', text: 'Twenty-two builders, each with a tier and a track record. Every machine carries the builder\u2019s code on the birth certificate in the box, and their profile page is public. If one of our builders has a bad month, the numbers show it and they get pulled off the queue. This isn\u2019t generous to them; it\u2019s fair to you.' },
      { kind: 'gallery', items: [
        { buildNumber: '073', caption: 'Aegis Ultra · BLD-004 · water-cooled 5090 tower' },
        { buildNumber: '089', caption: 'Silent workstation · BLD-011 · Noctua fanless CPU block' },
        { buildNumber: '114', caption: 'Refurbished ThinkPad T14s · BLD-019 · G2 refurb programme' },
      ]},
      { kind: 'h2', text: 'Where we are' },
      { kind: 'p', text: 'The workshop is in the Jewellery Quarter, five minutes\u2019 walk from Jewellery Quarter station. Collection is possible by appointment; we are not open for walk-in browsing, but most people who ask to see the bench get a tour of where their unit will actually be built. The trade counter for schools, procurement, and print-and-sign outfits is a separate door.' },
    ],
    cta: { label: 'Meet the builders', href: '/builders' },
  };

  return <EditorialTemplate {...content} />;
}
