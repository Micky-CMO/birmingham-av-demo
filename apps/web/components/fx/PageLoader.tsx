'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

/**
 * First-paint brand reveal. Shown for ~1.1s on initial mount, then fades out.
 * sessionStorage flag prevents re-flash on client navigation.
 */
export function PageLoader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem('bav-loader-seen');
    if (seen) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem('bav-loader-seen', '1');
      setShow(false);
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
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
