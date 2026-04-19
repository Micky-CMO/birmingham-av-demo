'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

type NavProps = {
  activeBuilds?: number;
};

type MegaColumn = {
  heading: string;
  items: { label: string; href: string; hint?: string }[];
};

type MegaTab = {
  key: string;
  label: string;
  href: string;
  explore: MegaColumn;
  shop: MegaColumn;
  more: MegaColumn;
};

const MEGA_TABS: MegaTab[] = [
  {
    key: 'computers',
    label: 'Computers',
    href: '/shop/gaming-pc-bundles',
    explore: {
      heading: 'Explore Computers',
      items: [
        { label: 'Gaming PC Bundles', href: '/shop/gaming-pc-bundles' },
        { label: 'Desktop Computers', href: '/shop/computers' },
        { label: 'All-in-One PCs', href: '/shop/all-in-one-pc' },
        { label: 'Build a PC', href: '/configurator' },
      ],
    },
    shop: {
      heading: 'Shop Computers',
      items: [
        { label: 'Shop all Computers', href: '/shop?tab=computers' },
        { label: 'Latest arrivals', href: '/shop/gaming-pc-bundles?sort=newest' },
        { label: 'Under £500', href: '/shop/computers?priceMax=500' },
        { label: 'Finance available', href: '/finance' },
      ],
    },
    more: {
      heading: 'More from Computers',
      items: [
        { label: 'AV Care warranty', href: '/av-care' },
        { label: 'Trade-in your PC', href: '/trade-in' },
        { label: 'Compare models', href: '/compare' },
        { label: 'Meet the builders', href: '/builders' },
      ],
    },
  },
  {
    key: 'laptops',
    label: 'Laptops',
    href: '/shop/laptops',
    explore: {
      heading: 'Explore Laptops',
      items: [
        { label: 'All Laptops', href: '/shop/laptops' },
        { label: 'Gaming laptops', href: '/shop/laptops?use=gaming' },
        { label: 'Business laptops', href: '/shop/laptops?use=business' },
        { label: 'Refurbished', href: '/shop/laptops?condition=refurbished' },
      ],
    },
    shop: {
      heading: 'Shop Laptops',
      items: [
        { label: 'Shop all Laptops', href: '/shop/laptops' },
        { label: 'Latest arrivals', href: '/shop/laptops?sort=newest' },
        { label: 'Under £400', href: '/shop/laptops?priceMax=400' },
        { label: 'Finance available', href: '/finance' },
      ],
    },
    more: {
      heading: 'More from Laptops',
      items: [
        { label: 'AV Care warranty', href: '/av-care' },
        { label: 'Trade-in your laptop', href: '/trade-in' },
        { label: 'Compare models', href: '/compare' },
        { label: 'Buyer\u2019s guide', href: '/journal/refurbished-laptop-buyers-guide' },
      ],
    },
  },
  {
    key: 'displays',
    label: 'Displays',
    href: '/shop/monitors',
    explore: {
      heading: 'Explore Displays',
      items: [
        { label: 'Monitors', href: '/shop/monitors' },
        { label: 'Projectors', href: '/shop/projectors' },
        { label: 'Projector Lenses', href: '/shop/projector-lenses' },
      ],
    },
    shop: {
      heading: 'Shop Displays',
      items: [
        { label: 'Shop all Displays', href: '/shop?tab=displays' },
        { label: 'Latest arrivals', href: '/shop/monitors?sort=newest' },
        { label: '4K monitors', href: '/shop/monitors?res=4k' },
        { label: 'Ultrawide', href: '/shop/monitors?form=ultrawide' },
      ],
    },
    more: {
      heading: 'More from Displays',
      items: [
        { label: 'AV Care warranty', href: '/av-care' },
        { label: 'Trade-in your monitor', href: '/trade-in' },
        { label: 'Mounting + cabling', href: '/shop/parts' },
        { label: 'Delivery + set-up', href: '/support/delivery' },
      ],
    },
  },
  {
    key: 'networking',
    label: 'Networking',
    href: '/shop/network-equipment',
    explore: {
      heading: 'Explore Networking',
      items: [
        { label: 'Network Equipment', href: '/shop/network-equipment' },
        { label: 'AV Switches', href: '/shop/av-switches' },
        { label: 'Trade enquiries', href: '/business' },
      ],
    },
    shop: {
      heading: 'Shop Networking',
      items: [
        { label: 'Shop all Networking', href: '/shop?tab=networking' },
        { label: 'Latest arrivals', href: '/shop/network-equipment?sort=newest' },
        { label: 'Enterprise switches', href: '/shop/network-equipment?grade=enterprise' },
        { label: 'Bulk orders', href: '/business/quote' },
      ],
    },
    more: {
      heading: 'More from Networking',
      items: [
        { label: 'AV Care warranty', href: '/av-care' },
        { label: 'Trade accounts', href: '/business' },
        { label: 'Volume pricing', href: '/business/quote' },
        { label: 'Spec sheets', href: '/support/spec-sheets' },
      ],
    },
  },
  {
    key: 'storage',
    label: 'Storage',
    href: '/shop/hard-drive',
    explore: {
      heading: 'Explore Storage',
      items: [
        { label: 'Hard Drives', href: '/shop/hard-drive' },
        { label: 'Enterprise drives', href: '/shop/hard-drive?grade=enterprise' },
        { label: 'SSDs', href: '/shop/hard-drive?type=ssd' },
      ],
    },
    shop: {
      heading: 'Shop Storage',
      items: [
        { label: 'Shop all Storage', href: '/shop/hard-drive' },
        { label: 'Latest arrivals', href: '/shop/hard-drive?sort=newest' },
        { label: '1 TB and up', href: '/shop/hard-drive?capMin=1000' },
        { label: 'Under £100', href: '/shop/hard-drive?priceMax=100' },
      ],
    },
    more: {
      heading: 'More from Storage',
      items: [
        { label: 'AV Care warranty', href: '/av-care' },
        { label: 'Data recovery', href: '/support/data-recovery' },
        { label: 'Trade enquiries', href: '/business' },
        { label: 'Spec sheets', href: '/support/spec-sheets' },
      ],
    },
  },
  {
    key: 'accessories',
    label: 'Accessories',
    href: '/shop/parts',
    explore: {
      heading: 'Explore Accessories',
      items: [
        { label: 'Parts', href: '/shop/parts' },
        { label: 'Printers', href: '/shop/printers' },
        { label: 'Power Supply + Chargers', href: '/shop/power-supply-chargers' },
        { label: 'Other', href: '/shop/other' },
      ],
    },
    shop: {
      heading: 'Shop Accessories',
      items: [
        { label: 'Shop all Accessories', href: '/shop?tab=accessories' },
        { label: 'Latest arrivals', href: '/shop/parts?sort=newest' },
        { label: 'Cables + adapters', href: '/shop/parts?type=cable' },
        { label: 'Under £50', href: '/shop/parts?priceMax=50' },
      ],
    },
    more: {
      heading: 'More from Accessories',
      items: [
        { label: 'AV Care warranty', href: '/av-care' },
        { label: 'Trade accounts', href: '/business' },
        { label: 'Bulk orders', href: '/business/quote' },
        { label: 'Gift cards', href: '/gift-cards' },
      ],
    },
  },
];

const BRAND_LINKS = [
  { label: 'Builders', href: '/builders' },
  { label: 'Journal', href: '/journal' },
  { label: 'Support', href: '/support' },
];

export function Nav({ activeBuilds = 0 }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.count());
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  useEffect(() => setHydrated(true), []);

  // Close mega menu when the route changes (after clicking a link).
  useEffect(() => {
    setActiveTab(null);
    setMenuOpen(false);
  }, [pathname]);

  // Escape closes the mega menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTab(null);
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const count = hydrated ? cartCount : 0;

  const openTab = useCallback((key: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveTab(key);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveTab(null), 180);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const active = activeTab ? MEGA_TABS.find((t) => t.key === activeTab) : null;

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b border-ink-10 bg-paper/95 backdrop-blur-sm"
        onMouseLeave={scheduleClose}
      >
        <div className="mx-auto flex h-[68px] max-w-page items-center justify-between gap-6 px-6 md:px-12">
          <Link
            href="/"
            aria-label="Birmingham AV \u2014 home"
            className="flex items-center"
            onMouseEnter={scheduleClose}
          >
            <Image
              src="/brand/logo.png"
              alt="Birmingham AV"
              width={294}
              height={136}
              priority
              className="h-12 w-auto md:h-14"
            />
          </Link>

          <div
            className="hidden items-center gap-8 text-[13px] lg:flex"
            onMouseLeave={scheduleClose}
          >
            {MEGA_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  onMouseEnter={() => openTab(tab.key)}
                  onFocus={() => openTab(tab.key)}
                  aria-expanded={isActive}
                  className={`bav-hover-opa text-ink no-underline transition-colors ${
                    isActive ? 'text-brand-green' : ''
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
            <span className="h-3 w-px bg-ink-10" aria-hidden />
            {BRAND_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={scheduleClose}
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
              className="bav-hover-opa flex items-center text-ink no-underline"
            >
              <IconSearch />
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className="bav-hover-opa hidden items-center text-ink no-underline md:flex"
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
              className="ml-1 flex cursor-pointer border-none bg-transparent p-1 text-ink lg:hidden"
            >
              <IconMenu />
            </button>
          </div>
        </div>

        {/* Mega panel */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-full z-40 overflow-hidden transition-all duration-300 ease-out ${
            active ? 'pointer-events-auto opacity-100' : 'opacity-0'
          }`}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{ maxHeight: active ? 520 : 0 }}
        >
          <div className="border-b border-ink-10 bg-paper/98 backdrop-blur-md">
            <div className="mx-auto grid max-w-page grid-cols-3 gap-12 px-6 py-12 md:px-12">
              {active && (
                <>
                  <MegaColumn column={active.explore} primary />
                  <MegaColumn column={active.shop} />
                  <MegaColumn column={active.more} />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop blur on page below */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-x-0 top-[68px] bottom-0 z-30 transition-opacity duration-300 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          background: 'rgba(247, 245, 242, 0.35)',
        }}
      />

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex animate-fade-up flex-col overflow-y-auto bg-paper px-6 pb-8 pt-5">
          <div className="flex h-12 items-center justify-between">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              aria-label="Birmingham AV \u2014 home"
              className="flex items-center"
            >
              <Image
                src="/brand/logo.png"
                alt="Birmingham AV"
                width={294}
                height={136}
                priority
                className="h-11 w-auto"
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

          <div className="mt-8 flex flex-col gap-6">
            {MEGA_TABS.map((tab) => (
              <details
                key={tab.key}
                className="group border-b border-ink-10 pb-4"
              >
                <summary className="flex cursor-pointer items-center justify-between font-display text-[32px] leading-none tracking-[-0.025em] text-ink">
                  {tab.label}
                  <span className="font-mono text-[11px] text-ink-60 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="mt-4 flex flex-col gap-3 pl-1 text-[15px]">
                  {tab.explore.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="text-ink no-underline"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-ink-10 pt-6">
            {BRAND_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-[28px] leading-none tracking-[-0.02em] text-ink no-underline"
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

function MegaColumn({ column, primary }: { column: MegaColumn; primary?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="bav-label font-mono text-[11px] uppercase tracking-[0.12em] text-ink-60">
        {column.heading}
      </span>
      <ul className="flex flex-col gap-2.5">
        {column.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`no-underline transition-colors hover:text-brand-green ${
                primary
                  ? 'font-display text-[22px] leading-[1.15] tracking-[-0.015em] text-ink'
                  : 'text-[14px] leading-[1.4] text-ink/85'
              }`}
            >
              {item.label}
              {item.hint ? (
                <span className="ml-2 font-mono text-[11px] text-ink-60">{item.hint}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconUser({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="5" />
    </svg>
  );
}
function IconBag({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12l1 4H5l1-4Z" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function IconMenu({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function IconClose({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
