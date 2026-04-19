import React, { useState, useEffect } from 'react';

// ============================================================================
// ARTEFACT 26 — Legal template
//
// Reusable shell used by: /terms, /privacy, /cookies, /modern-slavery,
// /warranty, /shipping, /returns-policy, /accessibility. The fenced block
// below is the canonical template; it must be pasted byte-identical into
// any future artefact that uses this shell. md5 the fenced region before
// shipping.
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

function BAVLegalStyles() {
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
      .bav-hover-opa { transition: opacity 300ms; }
      .bav-hover-opa:hover { opacity: 0.6; }

      .lg-grid { display: grid; grid-template-columns: 3fr 9fr; gap: 96px; align-items: start; }
      @media (max-width: 1000px) { .lg-grid { grid-template-columns: 1fr; gap: 40px; } }

      .lg-toc { position: sticky; top: 96px; max-height: calc(100vh - 128px); overflow-y: auto; padding-right: 8px; }
      @media (max-width: 1000px) { .lg-toc { position: relative; top: 0; max-height: none; border: 1px solid ${t.ink10}; padding: 24px; } }
      .lg-toc-link { display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: baseline; padding: 10px 0; border-top: 1px solid ${t.ink10}; text-decoration: none; color: ${t.ink60}; transition: color 300ms; font-size: 14px; line-height: 1.4; }
      .lg-toc-link:last-child { border-bottom: 1px solid ${t.ink10}; }
      .lg-toc-link:hover, .lg-toc-link.active { color: ${t.ink}; }
      .lg-toc-link .n { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.04em; color: ${t.ink30}; font-variant-numeric: tabular-nums; }
      .lg-toc-link.active .n { color: ${t.ink}; }

      .lg-clause { padding: 48px 0; border-top: 1px solid ${t.ink10}; scroll-margin-top: 96px; }
      .lg-clause:first-of-type { border-top: 1px solid ${t.ink}; }
      .lg-clause:last-of-type { border-bottom: 1px solid ${t.ink10}; }
      .lg-clause .cn { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.18em; color: ${t.ink30}; font-variant-numeric: tabular-nums; margin-bottom: 16px; text-transform: uppercase; }
      .lg-clause .ct { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 144; font-weight: 300; font-size: clamp(26px, 3vw, 36px); line-height: 1.15; letter-spacing: -0.01em; margin: 0 0 24px; color: ${t.ink}; }
      .lg-clause p { font-size: 15px; line-height: 1.7; color: ${t.ink}; margin: 0 0 18px; max-width: 70ch; }
      .lg-clause ul { list-style: none; padding: 0; margin: 0 0 18px; max-width: 70ch; }
      .lg-clause ul li { font-size: 15px; line-height: 1.7; color: ${t.ink}; padding: 8px 0 8px 24px; position: relative; }
      .lg-clause ul li::before { content: ''; position: absolute; left: 0; top: 18px; width: 12px; height: 1px; background: ${t.ink30}; }

      .lg-sub { margin-top: 28px; }
      .lg-sub-item { display: grid; grid-template-columns: 60px 1fr; gap: 20px; padding: 24px 0; border-top: 1px solid ${t.ink10}; }
      .lg-sub-item:last-child { border-bottom: 1px solid ${t.ink10}; }
      .lg-sub-item .sn { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.08em; color: ${t.ink30}; font-variant-numeric: tabular-nums; padding-top: 4px; }
      .lg-sub-item .st { font-family: 'Instrument Sans', system-ui, sans-serif; font-weight: 500; font-size: 15px; line-height: 1.4; color: ${t.ink}; margin-bottom: 8px; }
      .lg-sub-item p { font-size: 14px; line-height: 1.65; color: ${t.ink60}; margin: 0 0 12px; max-width: 68ch; }
      .lg-sub-item p:last-child { margin-bottom: 0; }
    `}</style>
  );
}

/**
 * LegalTemplate
 *
 * Props:
 *   eyebrow         string   — section label, rendered with "— " prefix
 *   title           string   — display headline, plain part
 *   titleItalic     string   — the one word receiving the italic swash
 *   lastUpdatedIso  string   — ISO date
 *   effectiveIso    string   — ISO date of commencement, optional
 *   versionLabel    string   — e.g. "v3.2", optional
 *   intro           string   — single-paragraph intro
 *   clauses         Array of:
 *                     { n: '1', id: 'about', title: 'About these terms',
 *                       body: [ 'paragraph text', { list: [...] }, ... ],
 *                       sub: [ { n: '1.1', title, body: [...] } ] }
 *   contactLine     string   — e.g. "Questions about these terms: legal@..."
 *   downloadHref    string   — optional link to PDF
 */
function LegalTemplate({
  eyebrow,
  title,
  titleItalic,
  lastUpdatedIso,
  effectiveIso,
  versionLabel,
  intro,
  clauses = [],
  contactLine,
  downloadHref,
}) {
  const t = BAV_TOKENS;
  const [activeId, setActiveId] = useState(clauses[0]?.id || null);

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    const onScroll = () => {
      const offsets = clauses.map((c) => {
        const el = document.getElementById(`clause-${c.id}`);
        if (!el) return { id: c.id, top: Infinity };
        return { id: c.id, top: el.getBoundingClientRect().top };
      });
      const above = offsets.filter((o) => o.top <= 120).sort((a, b) => b.top - a.top)[0];
      if (above) setActiveId(above.id);
      else if (offsets[0]) setActiveId(offsets[0].id);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [clauses]);

  const renderBody = (body) => {
    if (!Array.isArray(body)) return null;
    return body.map((item, i) => {
      if (typeof item === 'string') return <p key={i}>{item}</p>;
      if (item && item.list) return (
        <ul key={i}>
          {item.list.map((li, j) => <li key={j}>{li}</li>)}
        </ul>
      );
      return null;
    });
  };

  return (
    <>
      <BAVLegalStyles />
      <div style={{ background: t.paper, color: t.ink, ...t.sans, minHeight: '100vh' }}>

        {/* ---- title block ---- */}
        <header className="bav-fade" style={{ maxWidth: 1440, margin: '0 auto', padding: '96px 48px 48px' }}>
          <div className="bav-label" style={{ color: t.ink60 }}>— {eyebrow}</div>
          <h1 style={{ ...t.display, fontWeight: 300, fontSize: 'clamp(40px, 6vw, 80px)', lineHeight: 1.0, letterSpacing: '-0.025em', margin: '32px 0 0', color: t.ink, maxWidth: '16ch' }}>
            {title} <span className="bav-italic">{titleItalic}</span>.
          </h1>

          {/* meta strip */}
          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${t.ink10}`, borderBottom: `1px solid ${t.ink10}` }}>
            <div style={{ padding: '20px 0', borderRight: `1px solid ${t.ink10}`, paddingRight: 20 }}>
              <div className="bav-label" style={{ color: t.ink30 }}>Last updated</div>
              <div style={{ ...t.mono, fontSize: 14, color: t.ink, marginTop: 8 }}>{formatDate(lastUpdatedIso)}</div>
            </div>
            {effectiveIso && (
              <div style={{ padding: '20px 20px', borderRight: `1px solid ${t.ink10}` }}>
                <div className="bav-label" style={{ color: t.ink30 }}>Effective</div>
                <div style={{ ...t.mono, fontSize: 14, color: t.ink, marginTop: 8 }}>{formatDate(effectiveIso)}</div>
              </div>
            )}
            {versionLabel && (
              <div style={{ padding: '20px 20px', borderRight: `1px solid ${t.ink10}` }}>
                <div className="bav-label" style={{ color: t.ink30 }}>Version</div>
                <div style={{ ...t.mono, fontSize: 14, color: t.ink, marginTop: 8 }}>{versionLabel}</div>
              </div>
            )}
            {downloadHref && (
              <div style={{ padding: '20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <a href={downloadHref} className="bav-label bav-hover-opa" style={{ color: t.ink, textDecoration: 'none' }}>Download PDF →</a>
              </div>
            )}
          </div>

          {intro && (
            <p style={{ fontSize: 18, lineHeight: 1.6, color: t.ink60, margin: '40px 0 0', maxWidth: '64ch' }}>
              {intro}
            </p>
          )}
        </header>

        {/* ---- body ---- */}
        <main style={{ maxWidth: 1440, margin: '0 auto', padding: '48px 48px 128px' }}>
          <div className="lg-grid">

            {/* TOC */}
            <aside>
              <nav className="lg-toc">
                <div className="bav-label" style={{ color: t.ink60, marginBottom: 14 }}>— Contents</div>
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
                <section key={c.id} id={`clause-${c.id}`} className="lg-clause">
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
                <div style={{ marginTop: 72, padding: '32px 0', borderTop: `1px solid ${t.ink10}`, borderBottom: `1px solid ${t.ink10}` }}>
                  <div className="bav-label" style={{ color: t.ink60, marginBottom: 12 }}>— Questions</div>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: t.ink, margin: 0, maxWidth: '64ch' }}>{contactLine}</p>
                </div>
              )}
            </article>
          </div>
        </main>
      </div>
    </>
  );
}
// --- TEMPLATE END ---

// ============================================================================
// Demo invocation — /terms page content. In production, swap the `content`
// object for data loaded from the CMS or a route-specific content module.
// ============================================================================

export default function BirminghamAVTerms() {
  const content = {
    eyebrow: 'Terms',
    title: 'Terms &',
    titleItalic: 'conditions',
    lastUpdatedIso: '2026-03-14',
    effectiveIso: '2026-04-01',
    versionLabel: 'v3.2',
    intro: 'These terms govern your purchase of hardware and services from Birmingham AV Limited. They are written plainly on purpose; if any clause is unclear, the contact line at the bottom is a real inbox and a real person will reply.',
    clauses: [
      {
        n: '1', id: 'about', title: 'About these terms',
        body: [
          'Birmingham AV Limited ("we", "us") is a company registered in England and Wales, company number 07431029, with its registered office in Birmingham B16. These terms apply whenever you place an order through birminghamav.co.uk or any channel operated by us.',
          'By placing an order you accept these terms. If you do not accept them, do not place the order.',
        ],
        sub: [
          { n: '1.1', title: 'Changes to these terms', body: ['We may revise these terms from time to time. The version that applies to any order is the one in force on the date the order is placed. Historic versions are available on request.'] },
          { n: '1.2', title: 'Trade orders', body: ['Orders placed under a trade account are additionally governed by the trade agreement signed between us. Where the two documents conflict, the trade agreement takes precedence.'] },
        ],
      },
      {
        n: '2', id: 'orders', title: 'Orders and contracts',
        body: [
          'Placing an order is an offer to buy. The contract between us is formed when we confirm dispatch by email, not at the point of payment.',
          'We reserve the right to refuse an order or cancel a confirmed order before dispatch, for example where we have reason to believe the payment method is fraudulent, where stock has been mispriced by a significant margin, or where the shipping address is outside our serviceable area.',
        ],
        sub: [
          { n: '2.1', title: 'Custom and configured builds', body: ['Orders for machines built to a specific configuration are taken on a bespoke basis. You may cancel a custom order at no charge up to the point we begin component staging; after that, a pro-rata charge applies to cover parts ordered and labour started.'] },
          { n: '2.2', title: 'Pricing and VAT', body: ['All prices are shown in pounds sterling and include VAT at the prevailing UK rate unless you are ordering under a trade account with net-of-VAT pricing agreed.'] },
          { n: '2.3', title: 'Stock', body: ['Listed stock levels are indicative and may change between the time a page is loaded and an order is placed. Where an item is unexpectedly out of stock, we will contact you within one working day.'] },
        ],
      },
      {
        n: '3', id: 'delivery', title: 'Delivery',
        body: [
          'Standard delivery within mainland UK is by DPD next-day on a signed-for service. Typical dispatch timelines are set out at /shipping and are a guide, not a guarantee.',
          { list: [
            'Delivery days are working days; weekends and public holidays are excluded.',
            'Risk passes on delivery. Loss or damage in transit is our responsibility until the parcel is signed for.',
            'We do not currently deliver to the Channel Islands, the Isle of Man, BFPO addresses, or outside the United Kingdom via our standard service.',
          ] },
        ],
      },
      {
        n: '4', id: 'warranty', title: 'Warranty',
        body: [
          'Every unit ships with a minimum twelve-month return-to-workshop warranty covering parts and labour. Specific products may carry longer terms; where they do, the product page is definitive.',
          'AV Care is a separate subscription that extends and broadens cover; it is governed by its own terms linked from /warranty.',
        ],
      },
      {
        n: '5', id: 'returns', title: 'Returns and cancellation',
        body: [
          'Your right to cancel a standard order under the Consumer Contracts Regulations is thirty days from delivery. Custom-configured orders are excluded from this right once build has begun, except where the unit is faulty or not as described.',
          'The returns process is at /returns-policy and routed through /account/returns. Items must be returned in their original packaging and condition; a restocking fee may apply to non-faulty returns of unboxed goods.',
        ],
      },
      {
        n: '6', id: 'liability', title: 'Liability',
        body: [
          'Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for any matter in respect of which it would be unlawful to limit liability.',
          'Subject to the above, our liability under any single contract is limited to the price you paid for the goods giving rise to the claim. We are not liable for loss of data, loss of profits, or any indirect or consequential loss.',
        ],
      },
      {
        n: '7', id: 'law', title: 'Governing law',
        body: [
          'These terms and any contract formed under them are governed by the laws of England and Wales. The courts of England and Wales have exclusive jurisdiction over any dispute.',
        ],
      },
    ],
    contactLine: 'Questions about these terms: write to legal@birminghamav.co.uk, or by post to Birmingham AV Ltd, 14 Vittoria Street, Birmingham B1 3ND.',
    downloadHref: '/legal/terms-v3.2.pdf',
  };

  return <LegalTemplate {...content} />;
}
