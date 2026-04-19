'use client';

import { useEffect, useState } from 'react';

/**
 * Cookie consent bottom-sheet. Ported from artefact 29.
 * Shows on first visit only; choice persists in localStorage under `bav-consent`.
 * Categories: necessary (locked) · analytics · preferences · marketing.
 */

type Prefs = {
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
};

const STORAGE_KEY = 'bav-consent';

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    necessary: true,
    analytics: false,
    preferences: false,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  if (!mounted || !visible) return null;

  const save = (finalPrefs: Prefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...finalPrefs, decidedAt: Date.now() }));
    setVisible(false);
  };

  const acceptAll = () => save({ necessary: true, analytics: true, preferences: true, marketing: true });
  const rejectOptional = () => save({ necessary: true, analytics: false, preferences: false, marketing: false });
  const saveChoices = () => save(prefs);
  const togglePref = (key: 'analytics' | 'preferences' | 'marketing') => {
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const CATEGORIES: Array<{
    key: 'necessary' | 'analytics' | 'preferences' | 'marketing';
    label: string;
    description: string;
    locked?: boolean;
  }> = [
    { key: 'necessary', label: 'Necessary', description: 'Required for the site to function — cart contents, sign-in, checkout. Cannot be disabled.', locked: true },
    { key: 'analytics', label: 'Analytics', description: 'Anonymous usage measurement so we can see which pages are useful and which are not.' },
    { key: 'preferences', label: 'Preferences', description: 'Remembers recently viewed builds and filter selections between visits.' },
    { key: 'marketing', label: 'Marketing', description: 'Attribution for ad campaigns. Off unless you opt in.' },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] border-t border-ink-10 bg-paper shadow-[0_-1px_30px_rgba(23,20,15,0.04)]">
      <div className="mx-auto max-w-page px-6 py-6 md:px-12 md:py-8">
        {!expanded ? (
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="bav-label mb-2 text-ink-60">— Cookies</div>
              <p className="m-0 max-w-[640px] text-[14px] leading-[1.6] text-ink">
                We use cookies for essential site features, anonymous analytics, and (only if you opt in) marketing attribution. Your choice persists across visits.{' '}
                <a href="/cookies" className="underline">Read the cookie policy →</a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="bav-label cursor-pointer border border-ink-10 bg-transparent px-4 py-3 text-ink-60 transition-colors hover:border-ink"
              >
                Manage
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="bav-label cursor-pointer border border-ink-10 bg-transparent px-4 py-3 text-ink-60 transition-colors hover:border-ink"
              >
                Reject optional
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="bav-label cursor-pointer border border-ink bg-ink px-4 py-3 text-paper transition-opacity hover:opacity-88"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bav-label mb-4 text-ink-60">— Manage your cookies</div>
            <div className="mb-6 flex flex-col gap-3">
              {CATEGORIES.map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-start gap-4 border border-ink-10 p-4"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={c.locked ? true : prefs[c.key]}
                    disabled={c.locked}
                    onChange={() => !c.locked && togglePref(c.key as 'analytics' | 'preferences' | 'marketing')}
                  />
                  <span
                    aria-hidden
                    className={`mt-1 h-[14px] w-[14px] flex-shrink-0 border transition-colors ${
                      (c.locked || prefs[c.key]) ? 'border-ink bg-ink' : 'border-ink-30 bg-transparent'
                    } ${c.locked ? 'opacity-60' : ''}`}
                  />
                  <div className="flex-1">
                    <div className="mb-1 text-[14px] font-medium text-ink">
                      {c.label}
                      {c.locked && <span className="bav-label ml-2 text-ink-30">Required</span>}
                    </div>
                    <div className="text-[13px] leading-[1.5] text-ink-60">{c.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="bav-label cursor-pointer border border-ink-10 bg-transparent px-4 py-3 text-ink-60 transition-colors hover:border-ink"
              >
                Back
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="bav-label cursor-pointer border border-ink-10 bg-transparent px-4 py-3 text-ink-60 transition-colors hover:border-ink"
              >
                Reject optional
              </button>
              <button
                type="button"
                onClick={saveChoices}
                className="bav-label cursor-pointer border border-ink bg-ink px-4 py-3 text-paper transition-opacity hover:opacity-88"
              >
                Save choices
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="bav-label cursor-pointer border border-ink-10 bg-transparent px-4 py-3 text-ink-60 transition-colors hover:border-ink"
              >
                Accept all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
