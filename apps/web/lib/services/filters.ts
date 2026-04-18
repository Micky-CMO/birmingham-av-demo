import { prisma } from '@/lib/db';

export type FilterAggregates = {
  categories: Array<{ slug: string; name: string }>;
  conditions: string[];
  cpuFamilies: string[];
  gpuFamilies: string[];
  ramSizes: number[];
  builders: Array<{ builderCode: string; displayName: string }>;
  priceCeiling: number;
};

/**
 * Compute filter dropdown contents from the live product set. CPU/GPU/RAM are
 * derived from product titles via regex (works whether or not Mongo enrichment
 * has run, so the filter UI is meaningful immediately after eBay ingestion).
 */
export async function getFilterAggregates(categorySlug?: string): Promise<FilterAggregates> {
  const where = { isActive: true, ...(categorySlug ? { category: { slug: categorySlug } } : {}) };

  const [categories, products, builders, priceMax, conditionGroups] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.product.findMany({ where, select: { title: true }, take: 5000 }),
    prisma.builder.findMany({
      where: { status: 'active' },
      orderBy: { displayName: 'asc' },
      select: { builderCode: true, displayName: true },
    }),
    prisma.product.aggregate({ where, _max: { priceGbp: true } }),
    prisma.product.groupBy({ by: ['conditionGrade'], where, _count: { conditionGrade: true } }),
  ]);

  const cpuSet = new Set<string>();
  const gpuSet = new Set<string>();
  const ramSet = new Set<number>();
  for (const { title } of products) {
    const cpu = title.match(/\b(i[3579](?:-\d{4,5}\w*)?|core i[3579](?:-\d{4,5}\w*)?|ryzen [3579]\b|m[1-4](?: pro| max| ultra)?|xeon|celeron)/i);
    if (cpu) cpuSet.add(normaliseCpu(cpu[0]));
    const gpu = title.match(/\b(rtx ?\d{3,4}(?:\s?ti)?|gtx ?\d{3,4}|rx ?\d{3,4}|radeon \w+)\b/i);
    if (gpu) gpuSet.add(normaliseGpu(gpu[0]));
    const ram = title.match(/\b(\d{1,3})\s*gb\s*(?:ram|ddr\d?)\b/i);
    if (ram) {
      const n = Number(ram[1]);
      if ([4, 8, 16, 32, 64, 128].includes(n)) ramSet.add(n);
    }
  }

  return {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
    conditions: conditionGroups
      .filter((g) => (g._count.conditionGrade ?? 0) > 0)
      .sort((a, b) => (b._count.conditionGrade ?? 0) - (a._count.conditionGrade ?? 0))
      .map((g) => g.conditionGrade),
    cpuFamilies: [...cpuSet].sort(),
    gpuFamilies: [...gpuSet].sort(),
    ramSizes: [...ramSet].sort((a, b) => a - b),
    builders: builders.map((b) => ({ builderCode: b.builderCode, displayName: b.displayName })),
    priceCeiling: Math.ceil((Number(priceMax._max.priceGbp ?? 5000) / 100)) * 100,
  };
}

function normaliseCpu(s: string): string {
  return s
    .toLowerCase()
    .replace(/^core\s+/, '')
    .replace(/\s+/g, ' ')
    .replace(/^(i[3579])(?:-\d{4,5}\w*)?$/, '$1')
    .replace(/ryzen (\d)\b.*/, 'Ryzen $1')
    .replace(/^([im]\d+)/, (_, x) => x.toUpperCase());
}

function normaliseGpu(s: string): string {
  return s
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/RTX ?(\d{3,4})/, 'RTX $1')
    .replace(/GTX ?(\d{3,4})/, 'GTX $1')
    .replace(/RX ?(\d{3,4})/, 'RX $1');
}
