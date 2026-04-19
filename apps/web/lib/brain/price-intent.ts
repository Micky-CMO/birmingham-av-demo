/**
 * Detects when a user query wants live catalogue pricing + extracts
 * the product-shaped signals so we can query Prisma and inject real
 * prices into the LLM context alongside the KB retrieval.
 *
 * Handles shapes like:
 *   "how much is an RTX 4090"
 *   "price on the 8TB NVMe"
 *   "what would an AMD Ryzen build cost"
 *   "cheapest gaming PC you have"
 */

export type PriceIntent = {
  isPriceQuery: boolean;
  keywords: string[];
  categories: string[];
  /** Heuristic price-ceiling the user mentioned, e.g. "under £1,500". */
  maxGbp?: number;
  minGbp?: number;
  /** Confidence 0–1 — used to decide whether to run the live query. */
  confidence: number;
};

const PRICE_SIGNALS = [
  'price', 'cost', 'how much', 'how many pounds', 'cheapest', 'cheap', 'budget',
  'under £', 'under ', 'less than', 'around £', 'approximately', 'roughly',
  'expensive', 'ballpark', 'quote', 'estimate',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'gaming-pc-bundles': ['gaming pc', 'gaming build', 'gaming rig'],
  'laptops': ['laptop', 'laptops', 'notebook', 'ultrabook'],
  'monitors': ['monitor', 'monitors', 'display screen', '4k screen'],
  'network-equipment': ['router', 'switch', 'wifi', 'wi-fi', 'access point', 'networking'],
  'hard-drive': ['hard drive', 'ssd', 'nvme', 'storage drive'],
  'parts': ['gpu', 'graphics card', 'rtx', 'rx ', 'cpu', 'processor', 'motherboard', 'ram', 'memory kit', 'case', 'cooler', 'aio'],
  'power-supply-chargers': ['psu', 'power supply', 'charger'],
  'projectors': ['projector', 'projection'],
  'printers': ['printer'],
};

const COMPONENT_TOKENS = [
  'rtx', 'gtx', 'rx ', 'arc ', // GPU families
  'ryzen', 'threadripper', 'core i', 'xeon', 'epyc', // CPU families
  'ddr4', 'ddr5', // RAM
  'nvme', 'ssd', 'm.2', // storage
  '4090', '4080', '4070', '5090', '5080', '5070', // RTX generations
  '7800x', '7900x', '7950x', '9800x', '9900x', '9950x',
];

function extractGbp(q: string): { min?: number; max?: number } {
  const lower = q.toLowerCase();
  const result: { min?: number; max?: number } = {};

  const under = lower.match(/(?:under|less than|below|max|up to)\s*£?(\d[\d,]*)/);
  if (under?.[1]) result.max = parseInt(under[1].replace(/,/g, ''), 10);

  const over = lower.match(/(?:over|more than|above|at least|min)\s*£?(\d[\d,]*)/);
  if (over?.[1]) result.min = parseInt(over[1].replace(/,/g, ''), 10);

  const around = lower.match(/(?:around|about|roughly|approximately|circa)\s*£?(\d[\d,]*)/);
  if (around?.[1]) {
    const v = parseInt(around[1].replace(/,/g, ''), 10);
    result.min = Math.max(0, Math.round(v * 0.85));
    result.max = Math.round(v * 1.15);
  }

  return result;
}

export function detectPriceIntent(query: string): PriceIntent {
  const lower = query.toLowerCase();
  const hasPriceSignal = PRICE_SIGNALS.some((s) => lower.includes(s));

  const categories = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, kws]) => kws.some((k) => lower.includes(k)))
    .map(([slug]) => slug);

  const keywords = COMPONENT_TOKENS.filter((t) => lower.includes(t));

  // £ symbol is a very strong price signal on its own.
  const hasPoundSymbol = query.includes('£');

  let confidence = 0;
  if (hasPriceSignal) confidence += 0.55;
  if (hasPoundSymbol) confidence += 0.3;
  if (categories.length > 0) confidence += 0.15;
  if (keywords.length > 0) confidence += 0.1;
  confidence = Math.min(1, confidence);

  const { min, max } = extractGbp(lower);

  return {
    isPriceQuery: confidence >= 0.3,
    keywords,
    categories,
    minGbp: min,
    maxGbp: max,
    confidence,
  };
}
