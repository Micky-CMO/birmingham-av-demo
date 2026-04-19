'use client';

import { Fragment, useMemo, useState } from 'react';

export type CampaignRow = {
  campaignId: string;
  subject: string;
  preheader: string;
  segmentLabel: string;
  segmentKey: string;
  status: string;
  recipients: number;
  opens: number;
  clicks: number;
  scheduledFor: string | null;
  createdAt: string;
};

export type Segment = { k: string; label: string; count: number };

function statusDot(s: string) {
  if (s === 'draft')
    return (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--ink-30)',
          display: 'inline-block',
        }}
      />
    );
  if (s === 'scheduled')
    return (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--ink)',
          display: 'inline-block',
        }}
      />
    );
  if (s === 'sent') return <span className="bav-pulse" />;
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#B94040',
        display: 'inline-block',
      }}
    />
  );
}

function renderHtml(
  subject: string,
  preheader: string,
  headline: string,
  italicIdx: number,
  subhead: string,
  body: string,
  ctaLabel: string,
  ctaHref: string
): string {
  const headlineWords = headline.split(' ');
  const headlineHtml = headlineWords
    .map((w, i) =>
      i === italicIdx
        ? `<em style="font-style:italic">${escapeHtml(w)}</em>`
        : escapeHtml(w)
    )
    .join(' ');
  const bodyHtml = escapeHtml(body).replace(/\n/g, '<br/>');
  const cta =
    ctaLabel && ctaHref
      ? `<div style="margin-top:28px"><a href="${escapeAttr(ctaHref)}" style="display:inline-block;border:1px solid #17140F;background:#17140F;color:#F7F5F2;padding:16px 28px;font-size:11px;text-transform:uppercase;text-decoration:none">${escapeHtml(ctaLabel)}</a></div>`
      : '';
  return `<!doctype html><html><body style="background:#F7F5F2;color:#17140F;font-family:sans-serif;padding:24px">
<div style="max-width:640px;margin:0 auto">
<p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(23,20,15,0.6);margin:0 0 24px">— Birmingham AV</p>
<h1 style="font-weight:300;font-size:32px;line-height:1.1;margin:0">${headlineHtml}</h1>
<p style="font-size:14px;color:rgba(23,20,15,0.6);margin:18px 0 24px;line-height:1.55">${escapeHtml(subhead)}</p>
<div style="font-size:14px;line-height:1.7">${bodyHtml}</div>
${cta}
<hr style="margin-top:40px;border:none;border-top:1px solid rgba(23,20,15,0.1)"/>
<p style="font-size:10px;color:rgba(23,20,15,0.3);line-height:1.7">BIRMINGHAM AV · CUSTOM HOUSE · DIGBETH · BIRMINGHAM B5 6RD<br/>UNSUBSCRIBE · MANAGE PREFERENCES</p>
</div></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

export function NewsletterComposer({
  campaigns,
  segments,
}: {
  campaigns: CampaignRow[];
  segments: Segment[];
}) {
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [headline, setHeadline] = useState('');
  const [italicIdx, setItalicIdx] = useState(0);
  const [subhead, setSubhead] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaHref, setCtaHref] = useState('');
  const [segment, setSegment] = useState<string>('all');
  const [schedule, setSchedule] = useState<'now' | 'later'>('now');
  const [scheduleAt, setScheduleAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const headlineWords = useMemo(() => headline.split(' ').filter(Boolean), [headline]);

  const save = async (status: 'draft' | 'scheduled' | 'sent') => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const html = renderHtml(
        subject,
        preheader,
        headline,
        italicIdx,
        subhead,
        body,
        ctaLabel,
        ctaHref
      );
      const text = `${headline}\n\n${subhead}\n\n${body}\n\n${ctaLabel ? `${ctaLabel}: ${ctaHref}` : ''}`;
      const payload: Record<string, unknown> = {
        subject: subject || 'Untitled campaign',
        html,
        text,
        status,
        recipientSegment: segment,
      };
      if (status === 'scheduled' && scheduleAt) {
        const parsed = Date.parse(scheduleAt);
        if (!Number.isNaN(parsed)) payload.scheduledFor = new Date(parsed).toISOString();
      }
      const res = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setErr(b?.error?.message ?? 'save failed');
        return;
      }
      setMsg(
        status === 'draft'
          ? 'Draft saved.'
          : status === 'scheduled'
            ? 'Campaign scheduled.'
            : 'Campaign queued.'
      );
      window.setTimeout(() => window.location.reload(), 1200);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper text-ink" style={{ padding: '48px 40px 96px' }}>
      <div className="mx-auto max-w-[1280px]">
        <div className="bav-label mb-4" style={{ color: 'var(--ink-60)' }}>
          — Admin · Marketing · Newsletters
        </div>
        <h1
          className="m-0 font-display font-light"
          style={{
            fontSize: 'clamp(32px, 3.5vw, 48px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            fontVariationSettings: "'opsz' 144",
          }}
        >
          Newsletters.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-60)',
            marginTop: 14,
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          Compose an editorial send. Preview before scheduling. One campaign per send — no drips
          here yet.
        </p>

        <div style={{ marginTop: 40 }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: '1.6fr 1fr 0.8fr 100px 120px 80px',
              gap: 16,
              padding: '14px 0',
              borderBottom: '1px solid var(--ink-10)',
            }}
          >
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              SUBJECT
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              SEGMENT
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              STATUS
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)', textAlign: 'right' }}>
              RECIPIENTS
            </span>
            <span className="bav-label" style={{ color: 'var(--ink-60)' }}>
              OPENS / CLICKS
            </span>
            <span />
          </div>

          {campaigns.length === 0 && (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                color: 'var(--ink-60)',
                fontSize: 13,
              }}
            >
              No campaigns yet. Start one below.
            </div>
          )}

          {campaigns.map((c) => (
            <div
              key={c.campaignId}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1.6fr 1fr 0.8fr 100px 120px 80px',
                gap: 16,
                padding: '22px 0',
                borderBottom: '1px solid var(--ink-10)',
              }}
            >
              <div>
                <div
                  className="font-display font-light"
                  style={{
                    fontSize: 16,
                    lineHeight: 1.25,
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  {c.subject}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-60)',
                    marginTop: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.preheader}
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  border: '1px solid var(--ink-10)',
                  padding: '5px 10px',
                  alignSelf: 'start',
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {c.segmentLabel}
              </span>
              <div className="flex items-center" style={{ gap: 8 }}>
                {statusDot(c.status)}
                <span
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: 11,
                    color: c.status === 'sent' ? 'var(--ink)' : 'var(--ink-30)',
                  }}
                >
                  {c.status.toUpperCase()}
                </span>
              </div>
              <span
                className="font-mono tabular-nums"
                style={{ fontSize: 12, color: 'var(--ink-60)', textAlign: 'right' }}
              >
                {c.recipients.toLocaleString('en-GB')}
              </span>
              <div
                className="font-mono tabular-nums"
                style={{ fontSize: 11, color: 'var(--ink-60)' }}
              >
                {c.status === 'sent' ? (
                  <>
                    <div>{c.opens.toLocaleString('en-GB')} opens</div>
                    <div style={{ marginTop: 2 }}>{c.clicks.toLocaleString('en-GB')} clicks</div>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <span />
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: '1px solid var(--ink-10)',
            marginTop: 96,
            paddingTop: 40,
          }}
        >
          <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 32 }}>
            — New campaign
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: 'minmax(0, 60%) minmax(0, 40%)',
              gap: 0,
              border: '1px solid var(--ink-10)',
            }}
          >
            <div style={{ borderRight: '1px solid var(--ink-10)', padding: 40 }}>
              <Row label="SUBJECT LINE">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={inputStyle}
                />
              </Row>
              <Row label="PREHEADER">
                <input
                  type="text"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 6 }}>
                  Shown in the inbox preview. Keep under 90 characters.
                </div>
              </Row>
              <Row label="HEADLINE">
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => {
                    setHeadline(e.target.value);
                    setItalicIdx(0);
                  }}
                  style={inputStyle}
                />
              </Row>
              <Row label="ITALICISED WORD">
                <select
                  value={italicIdx}
                  onChange={(e) => setItalicIdx(parseInt(e.target.value, 10))}
                  style={{
                    fontSize: 14,
                    border: 'none',
                    background: 'transparent',
                    padding: '6px 0',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  {headlineWords.length === 0 && <option value={0}>—</option>}
                  {headlineWords.map((w, i) => (
                    <option key={i} value={i}>
                      {w}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="SUBHEAD">
                <input
                  type="text"
                  value={subhead}
                  onChange={(e) => setSubhead(e.target.value)}
                  style={inputStyle}
                />
              </Row>
              <Row label="BODY">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="font-mono tabular-nums"
                  style={{
                    ...inputStyle,
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    resize: 'vertical',
                    minHeight: 160,
                  }}
                />
              </Row>
              <Row label="CTA LABEL">
                <input
                  type="text"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  style={inputStyle}
                />
              </Row>
              <Row label="CTA HREF">
                <input
                  type="text"
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  className="font-mono tabular-nums"
                  style={inputStyle}
                />
              </Row>

              <Row label="SEGMENT">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {segments.map((s) => (
                    <label
                      key={s.k}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        padding: '8px 0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            border: `1px solid ${segment === s.k ? 'var(--ink)' : 'var(--ink-30)'}`,
                            background: segment === s.k ? 'var(--ink)' : 'transparent',
                            position: 'relative',
                          }}
                        >
                          {segment === s.k && (
                            <span
                              style={{
                                position: 'absolute',
                                inset: 3,
                                background: 'var(--paper)',
                              }}
                            />
                          )}
                        </span>
                        <input
                          type="radio"
                          name="segment"
                          checked={segment === s.k}
                          onChange={() => setSegment(s.k)}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: 14 }}>{s.label}</span>
                      </div>
                      <span
                        className="font-mono tabular-nums"
                        style={{ fontSize: 11, color: 'var(--ink-60)' }}
                      >
                        {s.count.toLocaleString('en-GB')}
                      </span>
                    </label>
                  ))}
                </div>
              </Row>

              <Row label="SCHEDULE">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(
                    [
                      ['now', 'Send now'],
                      ['later', 'Schedule'],
                    ] as const
                  ).map(([k, label]) => (
                    <label
                      key={k}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        padding: '6px 0',
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: `1px solid ${schedule === k ? 'var(--ink)' : 'var(--ink-30)'}`,
                          background: schedule === k ? 'var(--ink)' : 'transparent',
                          position: 'relative',
                        }}
                      >
                        {schedule === k && (
                          <span
                            style={{
                              position: 'absolute',
                              inset: 3,
                              background: 'var(--paper)',
                            }}
                          />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="sched"
                        checked={schedule === k}
                        onChange={() => setSchedule(k)}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: 14 }}>{label}</span>
                      {k === 'later' && schedule === 'later' && (
                        <input
                          type="text"
                          placeholder="2026-04-22T09:00Z"
                          value={scheduleAt}
                          onChange={(e) => setScheduleAt(e.target.value)}
                          className="font-mono tabular-nums"
                          style={{
                            fontSize: 12,
                            marginLeft: 16,
                            flex: 1,
                            borderBottom: '1px solid var(--ink-10)',
                            background: 'transparent',
                            border: 'none',
                            padding: '4px 0',
                            outline: 'none',
                          }}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </Row>

              {err && (
                <div
                  className="font-mono tabular-nums"
                  style={{ fontSize: 12, color: '#B94040', marginTop: 16 }}
                >
                  {err}
                </div>
              )}
              {msg && (
                <div className="flex items-center" style={{ gap: 10, marginTop: 16 }}>
                  <span className="bav-pulse" />
                  <span
                    className="font-mono tabular-nums"
                    style={{ fontSize: 11, color: 'var(--ink)' }}
                  >
                    {msg.toUpperCase()}
                  </span>
                </div>
              )}

              <div
                className="flex flex-wrap items-center"
                style={{ gap: 16, marginTop: 32 }}
              >
                <button
                  type="button"
                  className="bav-cta"
                  disabled={busy}
                  onClick={() => save(schedule === 'now' ? 'sent' : 'scheduled')}
                >
                  {busy
                    ? 'Saving…'
                    : schedule === 'now'
                      ? 'Send now'
                      : 'Schedule send'}
                </button>
                <button
                  type="button"
                  className="bav-cta-secondary"
                  disabled={busy}
                  onClick={() => save('draft')}
                >
                  Save draft
                </button>
              </div>
            </div>

            {/* preview */}
            <div style={{ background: 'var(--paper-2)', padding: 32 }}>
              <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 20 }}>
                — Preview
              </div>

              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--ink-10)',
                  padding: 28,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--ink-10)',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{subject || 'Subject'}</div>
                  <div
                    className="font-mono tabular-nums"
                    style={{ fontSize: 10, color: 'var(--ink-60)' }}
                  >
                    BIRMINGHAM AV &lt;POST@BIRMINGHAMAV.CO.UK&gt;
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                    {preheader}
                  </div>
                </div>

                <div style={{ paddingTop: 32 }}>
                  <div
                    className="bav-label"
                    style={{ color: 'var(--ink-60)', marginBottom: 24 }}
                  >
                    — Birmingham AV
                  </div>

                  <h2
                    className="font-display font-light m-0"
                    style={{
                      fontSize: 32,
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    {headlineWords.length === 0 ? (
                      <span style={{ color: 'var(--ink-30)' }}>Headline</span>
                    ) : (
                      headlineWords.map((w, i) => (
                        <Fragment key={i}>
                          {i > 0 && ' '}
                          {i === italicIdx ? <span className="bav-italic">{w}</span> : w}
                        </Fragment>
                      ))
                    )}
                  </h2>

                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--ink-60)',
                      marginTop: 18,
                      marginBottom: 24,
                      lineHeight: 1.55,
                    }}
                  >
                    {subhead || <span style={{ color: 'var(--ink-30)' }}>Subhead</span>}
                  </p>

                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {body || <span style={{ color: 'var(--ink-30)' }}>Body copy…</span>}
                  </div>

                  {ctaLabel && ctaHref && (
                    <div style={{ marginTop: 28 }}>
                      <a
                        href={ctaHref}
                        className="bav-cta"
                        style={{
                          textDecoration: 'none',
                          padding: '16px 28px',
                          fontSize: 11,
                        }}
                      >
                        {ctaLabel}
                      </a>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 40,
                      paddingTop: 24,
                      borderTop: '1px solid var(--ink-10)',
                    }}
                  >
                    <div
                      className="font-mono tabular-nums"
                      style={{ fontSize: 10, color: 'var(--ink-30)', lineHeight: 1.7 }}
                    >
                      BIRMINGHAM AV · CUSTOM HOUSE · DIGBETH · BIRMINGHAM B5 6RD
                      <br />
                      UNSUBSCRIBE · MANAGE PREFERENCES
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 128 }} />
      </div>
    </main>
  );
}

const inputStyle = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--ink)',
  fontSize: 14,
  width: '100%',
  padding: '6px 0',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: '160px 1fr',
        gap: 16,
        padding: '18px 0',
        borderBottom: '1px solid var(--ink-10)',
      }}
    >
      <span className="bav-label" style={{ color: 'var(--ink-60)', paddingTop: 10 }}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
