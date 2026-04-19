'use client';

import { useState } from 'react';

const TEMPLATES = [
  {
    slug: 'welcome',
    title: 'Welcome',
    path: 'auth/Welcome',
    subject: 'Welcome to Birmingham AV — verify your email',
  },
  {
    slug: 'password-reset',
    title: 'Password reset',
    path: 'auth/PasswordReset',
    subject: 'Reset your Birmingham AV password',
  },
  {
    slug: 'business-application-received',
    title: 'Business application received',
    path: 'auth/BusinessApplicationReceived',
    subject: 'Trade account application received',
  },
  {
    slug: 'order-confirmation',
    title: 'Order confirmation',
    path: 'commerce/OrderConfirmation',
    subject: 'Order BAV-260419-739201 confirmed',
  },
  {
    slug: 'dispatched',
    title: 'Order dispatched',
    path: 'commerce/Dispatched',
    subject: 'BAV-260419-739201 · dispatched via DPD',
  },
  {
    slug: 'delivered',
    title: 'Order delivered',
    path: 'commerce/Delivered',
    subject: 'Aegis Ultra RTX 5090 delivered',
  },
  {
    slug: 'return-authorised',
    title: 'Return authorised',
    path: 'returns/ReturnAuthorised',
    subject: 'Return BAV-RMA-260419-0012 authorised',
  },
  {
    slug: 'refund-issued',
    title: 'Refund issued',
    path: 'returns/RefundIssued',
    subject: 'Refund issued · return BAV-RMA-260419-0012',
  },
] as const;

type TemplateSlug = (typeof TEMPLATES)[number]['slug'];

export function EmailPreviewer() {
  const [selected, setSelected] = useState<TemplateSlug>('order-confirmation');
  const active = TEMPLATES.find((t) => t.slug === selected) ?? TEMPLATES[0];

  const iframeSrc = `/api/admin/emails/preview?slug=${selected}`;

  return (
    <main
      className="min-h-screen bg-paper text-ink"
      style={{ padding: '48px 40px 96px' }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div style={{ marginBottom: 40 }}>
          <div className="bav-label" style={{ color: 'var(--ink-60)', marginBottom: 14 }}>
            — Admin · Marketing · Email previewer
          </div>
          <h1
            className="m-0 font-display font-light"
            style={{
              fontSize: 'clamp(28px, 3vw, 40px)',
              letterSpacing: '-0.02em',
              fontVariationSettings: "'opsz' 144",
            }}
          >
            Email previewer.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-60)',
              marginTop: 12,
              maxWidth: 560,
              lineHeight: 1.55,
            }}
          >
            Eight transactional templates, rendered server-side with sample data. Open a template to
            preview in the iframe.
          </p>
        </div>

        <div
          className="grid bav-emails-grid"
          style={{
            gridTemplateColumns: '260px minmax(0, 1fr)',
            border: '1px solid var(--ink-10)',
            minHeight: 700,
          }}
        >
          <div
            style={{
              borderRight: '1px solid var(--ink-10)',
              padding: '24px 0',
            }}
          >
            <div
              className="bav-label"
              style={{
                color: 'var(--ink-60)',
                padding: '0 24px',
                marginBottom: 20,
              }}
            >
              — Templates
            </div>
            {TEMPLATES.map((t) => {
              const isActive = selected === t.slug;
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setSelected(t.slug)}
                  className={isActive ? '' : 'bav-hover-opa'}
                  style={{
                    padding: '16px 24px',
                    cursor: 'pointer',
                    borderLeft: isActive
                      ? '2px solid var(--ink)'
                      : '2px solid transparent',
                    background: 'transparent',
                    border: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    borderBottom: 'none',
                    textAlign: 'left',
                    width: '100%',
                    display: 'block',
                  }}
                >
                  <div
                    className="font-display font-light"
                    style={{
                      fontSize: 16,
                      color: isActive ? 'var(--ink)' : 'var(--ink-60)',
                      letterSpacing: '-0.01em',
                      fontVariationSettings: "'opsz' 144",
                    }}
                  >
                    {t.title}
                  </div>
                  <div
                    className="font-mono tabular-nums"
                    style={{
                      fontSize: 10,
                      color: 'var(--ink-30)',
                      marginTop: 4,
                    }}
                  >
                    emails/{t.path}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ background: 'var(--paper-2)', padding: 32 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  className="bav-label"
                  style={{ color: 'var(--ink-60)', marginBottom: 6 }}
                >
                  — Subject
                </div>
                <div
                  className="font-display font-light"
                  style={{
                    fontSize: 20,
                    letterSpacing: '-0.01em',
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  {active.subject}
                </div>
              </div>
              <a
                href={iframeSrc}
                target="_blank"
                rel="noreferrer"
                className="bav-underline"
                style={{ fontSize: 13, textDecoration: 'none', color: 'var(--ink)' }}
              >
                Open raw <span className="arrow">→</span>
              </a>
            </div>

            <iframe
              key={selected}
              src={iframeSrc}
              title={`Preview — ${active.title}`}
              style={{
                width: '100%',
                minHeight: 700,
                border: '1px solid var(--ink-10)',
                background: 'var(--paper)',
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
