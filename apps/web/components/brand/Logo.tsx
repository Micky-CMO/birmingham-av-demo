import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * The source PNG is a 300x300 square whose visible content is the BIRMINGHAM
 * wordmark stretched across the AV monogram. It is effectively a wordmark,
 * so we render it in a proper square at a size where the wordmark stays
 * legible on small phones and scales up on tablet/desktop.
 */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('inline-flex shrink-0 items-center gap-2', className)}
      aria-label="Birmingham AV"
    >
      <span className="relative block h-10 w-10 xs:h-11 xs:w-11 sm:h-14 sm:w-14 md:h-16 md:w-16">
        <Image
          src="/brand/logo.png"
          alt="Birmingham AV"
          fill
          priority={priority}
          sizes="(max-width: 380px) 40px, (max-width: 640px) 44px, (max-width: 768px) 56px, 64px"
          className="object-contain"
        />
      </span>
    </Link>
  );
}
