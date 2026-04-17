import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2', className)} aria-label="Birmingham AV">
      <span className="relative block h-12 w-12 md:h-14 md:w-14">
        <Image
          src="/brand/logo.png"
          alt="Birmingham AV"
          fill
          priority={priority}
          sizes="56px"
          className="object-contain"
        />
      </span>
    </Link>
  );
}
