import Link from 'next/link';
import Image from 'next/image';

export type TileProduct = {
  productId: string;
  sku: string;
  slug: string;
  title: string;
  subtitle: string | null;
  priceGbp: number;
  compareAtGbp: number | null;
  conditionGrade: string;
  warrantyMonths: number;
  isFeatured: boolean;
  stockQty: number;
  imageUrl: string | null;
  categorySlug: string;
  builderCode: string;
};

export function buildNumberFromSku(sku: string): string {
  const m = sku.match(/(\d+)\s*$/);
  if (!m || !m[1]) return '000';
  return m[1].padStart(3, '0').slice(-3);
}

export function ProductTile({ product: p }: { product: TileProduct }) {
  const n = buildNumberFromSku(p.sku);
  const outOfStock = p.stockQty === 0;
  return (
    <Link href={`/product/${p.slug}`} className="bav-tile block text-ink no-underline">
      <div className="bav-canvas relative mb-4 aspect-[4/5]">
        {p.imageUrl ? (
          <Image
            src={p.imageUrl}
            alt={p.title}
            fill
            sizes="(max-width: 900px) 50vw, 30vw"
            className="relative z-[5] object-cover"
          />
        ) : (
          <div className="bav-tile-num absolute inset-0 flex items-center justify-center font-display font-light leading-none tracking-[-0.05em] select-none text-[clamp(96px,9vw,160px)]">
            <span className="italic">№</span>
            {n}
          </div>
        )}
        {p.isFeatured && (
          <div className="bav-label absolute left-3 top-3 z-10 text-ink">Featured</div>
        )}
        {outOfStock && (
          <div className="bav-label absolute bottom-3 left-3 z-10 bg-ink-10 px-2 py-1 text-ink">
            Out of stock
          </div>
        )}
      </div>
      <div className="mb-1 line-clamp-2 text-[15px] font-medium leading-[1.35]">{p.title}</div>
      {p.subtitle && (
        <div className="bav-label mb-2 truncate text-ink-60">{p.subtitle}</div>
      )}
      <div className="flex items-baseline gap-[10px]">
        {p.compareAtGbp && (
          <span className="font-mono text-[13px] tabular-nums text-ink-30 line-through">
            £{p.compareAtGbp.toLocaleString('en-GB')}
          </span>
        )}
        <span className="font-mono text-[17px] tabular-nums">
          £{p.priceGbp.toLocaleString('en-GB')}
        </span>
      </div>
    </Link>
  );
}
