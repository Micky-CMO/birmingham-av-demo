import { HeroVideo } from '@/components/storefront/HeroVideo';
import { StatsRail } from '@/components/storefront/StatsRail';
import { MarqueeTape } from '@/components/storefront/MarqueeTape';
import { CategoryGrid } from '@/components/storefront/CategoryGrid';
import { TrendingRail } from '@/components/storefront/TrendingRail';
import { WhyStrip } from '@/components/storefront/WhyStrip';
import { BuilderSpotlight } from '@/components/storefront/BuilderSpotlight';
import { ScrollReveal } from '@/components/fx/ScrollReveal';
import { listProducts } from '@/lib/services/products';
import { getSpotlightBuilder } from '@/lib/services/builders';
import { ProductListQuerySchema } from '@bav/lib/schemas';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const homeQuery = ProductListQuerySchema.parse({ sort: 'bestseller', pageSize: 8 });
  const [trendingResult, spotlight] = await Promise.allSettled([listProducts(homeQuery), getSpotlightBuilder()]);
  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value.items : [];
  const spotlightBuilder = spotlight.status === 'fulfilled' ? spotlight.value : null;

  return (
    <>
      <HeroVideo />
      <StatsRail />
      <ScrollReveal>
        <CategoryGrid />
      </ScrollReveal>
      <MarqueeTape />
      <ScrollReveal>
        <TrendingRail products={trending} />
      </ScrollReveal>
      <ScrollReveal>
        <WhyStrip />
      </ScrollReveal>
      {spotlightBuilder && (
        <ScrollReveal>
          <BuilderSpotlight builder={spotlightBuilder} />
        </ScrollReveal>
      )}
    </>
  );
}
