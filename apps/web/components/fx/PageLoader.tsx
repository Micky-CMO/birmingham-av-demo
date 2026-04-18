'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const SEEN_KEY = 'bav-loader-seen';
const DURATION_MS = 900;

/**
 * First-paint brand reveal. Shown once per session for ~900ms, then fades out.
 *
 * SSR-safe: initial `show` is false, so the server-rendered HTML never includes
 * the overlay. The overlay only appears if, on the client, sessionStorage has
 * no "seen" flag. Because the storefront layout is a server component and this
 * is a client component mounted inside it, React preserves this component across
 * App Router client-side navigations — so it will not re-mount and re-trigger.
 */
export function PageLoader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Guard: only run in the browser.
    if (typeof window === 'undefined') return;

    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // sessionStorage can throw in privacy modes / sandboxed iframes.
      // Treat as "seen" so we don't show on every navigation in that case.
      seen = true;
    }

    if (seen) return;

    setShow(true);
    const t = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* ignore */
      }
      setShow(false);
    }, DURATION_MS);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Loading Birmingham AV"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-50 dark:bg-obsidian-950"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-28 w-28"
          >
            <Image src="/brand/logo.png" alt="Birmingham AV" fill className="object-contain" priority />
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '40vw' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="absolute bottom-16 left-1/2 h-[2px] -translate-x-1/2 bg-brand-green"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
