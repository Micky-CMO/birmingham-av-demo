'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

export function AdminUserMenu({ email, role }: { email: string; role: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-ink-300/50 bg-white/70 py-1 pl-1 pr-3 font-mono text-caption uppercase tracking-[0.15em] text-ink-700 backdrop-blur-sm transition-colors hover:bg-white dark:border-obsidian-500/50 dark:bg-obsidian-800/70 dark:text-ink-300 dark:hover:bg-obsidian-800"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-green text-[11px] font-semibold text-white">
          {email.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{role.replace('_', ' ')}</span>
        <span aria-hidden className={cn('transition-transform duration-240', open && 'rotate-180')}>
          ▾
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-lg border border-ink-300/60 bg-white/95 shadow-lift backdrop-blur-glass dark:border-obsidian-500/60 dark:bg-obsidian-900/95"
          >
            <div className="border-b border-ink-300/50 px-4 py-3 dark:border-obsidian-500/40">
              <div className="truncate text-small font-medium">{email}</div>
              <div className="mt-0.5 font-mono text-caption uppercase tracking-[0.15em] text-ink-500">{role}</div>
            </div>
            <div className="py-1">
              <a
                href="/admin/dashboard"
                className="block px-4 py-2 text-small transition-colors hover:bg-ink-100 dark:hover:bg-obsidian-800"
              >
                Dashboard
              </a>
              <a
                href="/"
                className="block px-4 py-2 text-small transition-colors hover:bg-ink-100 dark:hover:bg-obsidian-800"
              >
                View store
              </a>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="block w-full border-t border-ink-300/40 px-4 py-2 text-left text-small text-semantic-critical transition-colors hover:bg-semantic-critical/5 dark:border-obsidian-500/30"
              >
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
