// Cross-cutting types shared between web and mobile.

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type BuilderRow = {
  builderId: string;
  builderCode: string;
  displayName: string;
  avatarUrl: string | null;
  tier: 'probation' | 'standard' | 'preferred' | 'elite';
  warehouseNodeCode: string;
  unitsBuilt90d: number;
  unitsSold90d: number;
  revenueGbp90d: number;
  marginGbp90d: number;
  roiPct90d: number;
  rmaRate90d: number;
  rmaCount90d: number;
  qualityScore: number;
  avgBuildMinutes: number;
  avgResponseHours: number;
  trend14d: number[];
  flagged: boolean;
  flagReason: string | null;
  updatedAt: string;
};

export type BuilderSummary = {
  items: BuilderRow[];
  totals: {
    totalBuilders: number;
    totalUnitsSold: number;
    totalRevenueGbp: number;
    totalMarginGbp: number;
    overallRmaRate: number;
    flaggedCount: number;
  };
};

export type CartLineBuilder = {
  displayName: string;
  builderCode: string;
};

export type CartLine = {
  productId: string;
  title: string;
  slug: string;
  pricePerUnitGbp: number;
  qty: number;
  imageUrl: string | null;
  /**
   * Editorial build device (e.g. "073"). Joined from product at add-to-cart time
   * so the drawer and cart page can render the №build canvas without a round-trip.
   */
  buildNumber?: string;
  /** Product condition grade joined at add time: "New", "Like New", etc. */
  conditionGrade?: string;
  /** Builder snapshot joined at add time. Undefined for legacy lines. */
  builder?: CartLineBuilder;
};
