'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  const cartCount = useCartStore((s) => s.count());
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={cn(
        'sticky top-0 z-40 h-[72px] w-full border-b transition-all duration-420',
        scrolled
          ? 'border-ink-300/60 bg-white/65 shadow-glass-light backdrop-blur-glass dark:border-obsidian-500/60 dark:bg-obsidian-900/65 dark:shadow-glass-dark'
          : 'border-transparent bg-gradient-to-b from-ink-50/60 to-transparent dark:from-obsidian-950/40',
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-6">
        <Logo priority />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavItem key={item.href + item.label} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-obsidian-800"
          >
            <SearchIcon />
          </button>
          <PWAInstallChip />
          <ThemeToggle />
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-9 w-9 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-obsidian-800 sm:flex"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            aria-label="Cart"
            onClick={() => setCartOpen(true)}
            className="relative flex h-9 items-center gap-2 rounded-md bg-ink-100 px-3 text-small font-medium text-ink-900 transition-all hover:bg-ink-300/60 dark:bg-obsidian-800 dark:text-ink-50 dark:hover:bg-obsidian-700"
          >
            <BagIcon />
            <span className="hidden sm:inline">Cart</span>
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
        </div>
      </div>
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
