import { ProductCard, type ProductCardModel } from './ProductCard';

export function TrendingRail({ products }: { products: ProductCardModel[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-[clamp(1.75rem,7vw,2.5rem)] font-semibold leading-tight tracking-[-0.025em] sm:text-h1">
          Trending now
        </h2>
      </div>
      <div className="mt-5 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mt-8 sm:-mx-6 sm:px-6">
        <div className="flex snap-x snap-mandatory gap-3 pb-2 sm:gap-4">
          {products.map((p) => (
            <div
              key={p.productId}
              className="w-[72vw] max-w-[260px] shrink-0 snap-start xs:w-[60vw] sm:w-[260px]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
