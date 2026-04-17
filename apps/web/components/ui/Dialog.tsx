'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
};

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

export function Dialog({ open, onClose, children, size = 'md', title }: DialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full rounded-xl border bg-white p-6 shadow-lift dark:bg-obsidian-900 dark:border-obsidian-500',
              sizes[size],
            )}
          >
            {title && <h2 className="mb-3 text-h3 font-display">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
