'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSED_KEY = 'bav-pwa-dismissed';
const INSTALLED_KEY = 'bav-pwa-installed';

export function PWAInstaller() {
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const promptEvent = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch((err) => console.warn('[pwa] sw register failed', err));
      });
    }

    // Already installed?
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || localStorage.getItem(INSTALLED_KEY)) {
      setInstalled(true);
      return;
    }

    // Capture install prompt
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      promptEvent.current = e as BeforeInstallPromptEvent;
      setInstallable(true);
      // Show banner after 6s of dwell — never on first paint
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 6000);
      }
    }

    function onInstalled() {
      setInstalled(true);
      setShowBanner(false);
      localStorage.setItem(INSTALLED_KEY, '1');
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function handleInstall() {
    const ev = promptEvent.current;
    if (!ev) return;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      localStorage.setItem(INSTALLED_KEY, '1');
    } else {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
    setShowBanner(false);
    promptEvent.current = null;
  }

  function dismiss() {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  }

  if (installed || !installable) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 left-5 z-[55] hidden w-[360px] max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-xl border border-ink-300/60 bg-white/85 p-4 shadow-lift backdrop-blur-glass dark:border-obsidian-500/60 dark:bg-obsidian-900/85 sm:flex"
          role="dialog"
          aria-label="Install Birmingham AV"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
            <Image src="/brand/logo.png" alt="Birmingham AV" fill className="object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-small font-medium">Install Birmingham AV</div>
            <div className="text-caption text-ink-500">One-tap access. Offline ready. No App Store needed.</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md px-2 py-1 text-caption text-ink-500 transition-colors hover:bg-ink-100 dark:hover:bg-obsidian-800"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-md bg-brand-green px-3 py-1.5 text-caption font-semibold text-white transition-colors hover:bg-brand-green-600"
            >
              Install
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Header chip variant: a small "Install app" button that only appears when installable.
 * Mount inside the header next to the cart button.
 */
export function PWAInstallChip() {
  const [installable, setInstallable] = useState(false);
  const promptEvent = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      promptEvent.current = e as BeforeInstallPromptEvent;
      setInstallable(true);
    }
    function onInstalled() {
      setInstallable(false);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!installable) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        const ev = promptEvent.current;
        if (!ev) return;
        await ev.prompt();
        const { outcome } = await ev.userChoice;
        if (outcome === 'accepted') localStorage.setItem(INSTALLED_KEY, '1');
        promptEvent.current = null;
        setInstallable(false);
      }}
      className="hidden h-9 items-center gap-1.5 rounded-md border border-brand-green/40 bg-brand-green-100 px-3 font-mono text-caption uppercase tracking-widest text-brand-green-600 transition-colors hover:bg-brand-green/15 dark:bg-brand-green/15 lg:flex"
    >
      <DownloadIcon /> Install app
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4v12M6 11l6 6 6-6M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
