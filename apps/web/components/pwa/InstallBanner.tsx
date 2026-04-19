'use client';

import { useEffect, useState } from 'react';

/**
 * PWA install prompt banner. Ported from artefact 87.
 *
 * Behaviour
 * ---------
 * - Mounted globally by the storefront layout.
 * - Captures the browser's `beforeinstallprompt` event and stores it on
 *   the component so the custom Install button can trigger the native
 *   prompt on demand.
 * - Shown once per browser session (sessionStorage) to avoid nagging.
 * - A user dismissal persists for 30 days in localStorage.
 * - Suppressed if the app is already in standalone/display-mode: installed.
 */

const DISMISS_KEY = 'bav-pwa-dismissed';
const SESSION_KEY = 'bav-pwa-seen';
const DISMISS_WINDOW_MS = 30 * 86_400_000; // 30 days

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed? Nothing to do.
    const matchesStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari quirk
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (matchesStandalone) return;

    // Recently dismissed? Nothing to do.
    try {
      const dismissedAt = window.localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const age = Date.now() - Number(dismissedAt);
        if (Number.isFinite(age) && age < DISMISS_WINDOW_MS) return;
      }
    } catch {
      // ignore storage errors
    }

    // Already shown this session? Skip.
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // ignore
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
      try {
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        // If the prompt throws (e.g. already consumed), just dismiss visually.
      }
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Install Birmingham AV"
      className="bav-install-banner bav-fade"
    >
      <button
        type="button"
        className="bav-install-close"
        onClick={handleDismiss}
        aria-label="Dismiss install banner"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
        </svg>
      </button>

      <div className="bav-install-grid">
        <div>
          <div className="bav-label mb-3 text-ink-60">— Install</div>
          <div className="mb-2.5 font-display text-[22px] font-light leading-[1.25] tracking-[-0.01em] text-ink">
            Keep Birmingham AV <span className="bav-italic">one tap</span> away.
          </div>
          <div className="text-[13px] leading-[1.55] text-ink-60">
            Works offline for browsing. No notifications without asking.
          </div>
        </div>
        <div className="bav-install-btns">
          <button
            type="button"
            onClick={handleInstall}
            className="bav-cta !w-auto px-8 py-[14px] text-[12px]"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="bav-underline cursor-pointer border-none bg-transparent p-0 text-[13px] text-ink"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallBanner;
