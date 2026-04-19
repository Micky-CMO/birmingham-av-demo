'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

type NavProps = {
  activeBuilds?: number;
};

const MAIN_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Builders', href: '/builders' },
  { label: 'Journal', href: '/journal' },
  { label: 'Support', href: '/support' },
];

export function Nav({ activeBuilds = 0 }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const cartCount = useCartStore((s) => s.count());
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  useEffect(() => setHydrated(true), []);

  const count = hydrated ? cartCount : 0;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-ink-10 bg-paper">
        <div
          className="bav-nav-inner mx-auto flex h-[60px] max-w-page items-center justify-between gap-6 px-12"
        >
          <Link href="/" aria-label="Birmingham AV — home" className="flex items-center">
            <Image
              src="/brand/logo.png"
              alt="Birmingham AV"
              width={294}
              height={136}
              priority
              className="h-11 w-auto md:h-12"
            />
          </Link>

          <div className="bav-nav-links flex gap-10 text-[13px]">
            {MAIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bav-hover-opa text-ink no-underline"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-5 text-[13px]">
            <Link
              href="/search"
              aria-label="Search"
              className="bav-hover-opa bav-nav-desktop-util flex items-center text-ink no-underline"
            >
              <IconSearch />
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className="bav-hover-opa bav-nav-desktop-util flex items-center text-ink no-underline"
            >
              <IconUser />
            </Link>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Cart, ${count} items`}
              className="bav-hover-opa flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-ink"
            >
              <IconBag />
              <span className="font-mono text-[12px] tabular-nums text-ink-60">
                ({String(count).padStart(2, '0')})
              </span>
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="bav-nav-hamburger ml-1 hidden cursor-pointer border-none bg-transparent p-1 text-ink"
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[100] flex animate-fade-up flex-col bg-paper px-6 pb-8 pt-5"
        >
          <div className="flex h-10 items-center justify-between">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              aria-label="Birmingham AV — home"
              className="flex items-center"
            >
              <Image
                src="/brand/logo.png"
                alt="Birmingham AV"
                width={120}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="cursor-pointer border-none bg-transparent p-1 text-ink"
            >
              <IconClose />
            </button>
          </div>
          <div className="mt-14 flex flex-col gap-8">
            {MAIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-[40px] leading-none tracking-[-0.025em] text-ink no-underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-[14px] border-t border-ink-10 pt-8">
            <Link
              href="/search"
              onClick={() => setMenuOpen(false)}
              className="text-[15px] text-ink no-underline"
            >
              Search
            </Link>
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="text-[15px] text-ink no-underline"
            >
              Account
            </Link>
            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
              className="text-[15px] text-ink no-underline"
            >
              Cart{' '}
              <span className="font-mono tabular-nums text-ink-60">
                ({String(count).padStart(2, '0')})
              </span>
            </Link>
            {activeBuilds > 0 && (
              <div className="bav-label mt-5 flex items-center gap-[10px] text-ink-60">
                <span className="bav-pulse" />
                <span>Workshop active — {activeBuilds} builds in progress</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function IconSearch({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconUser({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="5" />
    </svg>
  );
}
function IconBag({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12l1 4H5l1-4Z" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function IconMenu({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function IconClose({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
