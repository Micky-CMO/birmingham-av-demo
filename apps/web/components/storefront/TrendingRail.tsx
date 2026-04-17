import { ProductCard, type ProductCardModel } from './ProductCard';

export function TrendingRail({ products }: { products: ProductCardModel[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex items-end justify-between">
        <h2 className="text-h1 font-display">Trending now</h2>
      </div>
      <div className="mt-8 -mx-6 overflow-x-auto px-6 [scrollbar-width:none]">
        <div className="flex snap-x snap-mandatory gap-4 pb-2">
          {products.map((p) => (
            <div key={p.productId} className="w-[260px] shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
