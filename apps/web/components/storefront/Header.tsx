'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from './ThemeToggle';
import { PWAInstallChip } from '@/components/fx/PWAInstaller';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop/gaming-pc-bundles', label: 'Gaming' },
  { href: '/shop/laptops', label: 'Laptops' },
  { href: '/shop/monitors', label: 'Monitors' },
  { href: '/shop/gaming-pc-bundles', label: 'Bundles' },
  { href: '/support', label: 'Support' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartStore((s) => s.count());
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock scroll when mobile menu is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Close mobile menu on viewport resize into desktop.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={cn(
        'sticky top-0 z-40 h-16 w-full border-b transition-all duration-420 sm:h-[72px]',
        scrolled
          ? 'border-ink-300/60 bg-white/75 shadow-glass-light backdrop-blur-sm sm:backdrop-blur-glass dark:border-obsidian-500/60 dark:bg-obsidian-900/75 dark:shadow-glass-dark'
          : 'border-transparent bg-gradient-to-b from-ink-50/60 to-transparent dark:from-obsidian-950/40',
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-1.5 px-3 xs:gap-2 xs:px-4 sm:gap-6 sm:px-6">
        <Logo priority />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavItem key={item.href + item.label} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-obsidian-800"
          >
            <SearchIcon />
          </button>
          <div className="hidden sm:flex">
            <PWAInstallChip />
          </div>
          <ThemeToggle />
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-11 w-11 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-obsidian-800 xsm:flex"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            aria-label={`Cart, ${cartCount} items`}
            onClick={() => setCartOpen(true)}
            className="relative flex h-11 min-w-11 items-center justify-center gap-2 rounded-md bg-ink-100 px-2.5 text-small font-medium text-ink-900 transition-all hover:bg-ink-300/60 xs:px-3 dark:bg-obsidian-800 dark:text-ink-50 dark:hover:bg-obsidian-700"
          >
            <BagIcon />
            <span className="hidden xs:inline">Cart</span>
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1.5 text-caption font-semibold text-white"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-obsidian-800 md:hidden"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 top-16 z-40 flex flex-col overflow-y-auto bg-white/97 backdrop-blur-sm sm:top-[72px] dark:bg-obsidian-950/97 md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 pb-10 pt-4">
              {NAV.map((item, i) => (
                <motion.div
                  key={item.href + item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-12 items-center rounded-md px-4 py-3 text-base font-medium text-ink-900 transition-colors hover:bg-ink-100 active:bg-ink-100 dark:text-ink-50 dark:hover:bg-obsidian-800"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV.length * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="mt-2 border-t border-ink-300/60 pt-2 dark:border-obsidian-500/60"
              >
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-12 items-center rounded-md px-4 py-3 text-base font-medium text-ink-900 transition-colors hover:bg-ink-100 active:bg-ink-100 dark:text-ink-50 dark:hover:bg-obsidian-800"
                >
                  Account
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative rounded-md px-3 py-2 text-small font-medium text-ink-700 transition-colors duration-240 hover:text-ink-900 dark:text-ink-300 dark:hover:text-ink-50"
    >
      <span>{label}</span>
      <span
        aria-hidden
        className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-brand-green transition-transform duration-420 ease-unfold group-hover:scale-x-100"
      />
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
      <path d="M9 7a3 3 0 1 1 6 0" strokeLinecap="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
