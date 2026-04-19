'use client';

import { useState } from 'react';

type FormState = {
  subject: string;
  orderNumber: string;
  email: string;
  message: string;
};

export function SupportContactForm() {
  const [form, setForm] = useState<FormState>({
    subject: '',
    orderNumber: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.subject || !form.email || !form.message) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="border-b border-t border-ink-10 py-12"
        style={{ borderTopColor: 'var(--ink)', maxWidth: 640 }}
      >
        <div className="bav-label text-ink-60">— Message received</div>
        <h3
          className="my-5 font-display font-light text-ink"
          style={{ fontSize: 32 }}
        >
          Thanks, we have <span className="bav-italic">it</span>.
        </h3>
        <p
          className="m-0 text-ink-60"
          style={{ fontSize: 16, lineHeight: 1.6 }}
        >
          A ticket has been opened against {form.email}. You&rsquo;ll get a
          reply from the team within one working day; an AI triage note usually
          lands within the hour.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="mb-2">
        <div className="bav-label mb-2 text-ink-30">Subject</div>
        <input
          className="support-input"
          placeholder="What&rsquo;s it about"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </div>
      <div
        className="mb-2 grid gap-8"
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        <div>
          <div className="bav-label mb-2 mt-6 text-ink-30">
            Order number (optional)
          </div>
          <input
            className="support-input"
            placeholder="BAV-260418-739201"
            value={form.orderNumber}
            onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
          />
        </div>
        <div>
          <div className="bav-label mb-2 mt-6 text-ink-30">Your email</div>
          <input
            className="support-input"
            placeholder="you@example.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>
      <div className="my-8">
        <div className="bav-label mb-3 text-ink-30">Message</div>
        <textarea
          className="support-textarea"
          placeholder="Tell us what&rsquo;s happening. The more specific, the faster we can help."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="bav-label text-ink-30">
          Replies within 24 hours, working days
        </span>
        <button
          className="bav-cta"
          onClick={handleSubmit}
          style={{ width: 'auto' }}
        >
          Send message
        </button>
      </div>
    </div>
  );
}

export default SupportContactForm;
