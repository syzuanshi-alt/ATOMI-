export type CountryCode = "US" | "UK" | "DE" | "FR" | "CA" | "AU";

export type Provider =
  | "shopify"
  | "meta_ads"
  | "tiktok_ads"
  | "instagram_graph"
  | "logistics"
  | "support"
  | "csv";

export type Role = "gm" | "bd" | "media_buyer" | "support";

export type IntegrationStatus = "not_connected" | "connected" | "error" | "rate_limited" | "demo";

export type Integration = {
  id: string;
  provider: Provider;
  name: string;
  status: IntegrationStatus;
  accountRef: string | null;
  lastSyncAt: string | null;
  hint: string;
};

export type MoneyCents = number;

export type Kpi = {
  label: string;
  value: string;
  delta: string;
  tone: "good" | "warn" | "bad";
};

export type CountryMetric = {
  country: CountryCode;
  spendCents: MoneyCents;
  revenueCents: MoneyCents;
  grossProfitCents: MoneyCents;
  cpaCents: MoneyCents;
  roasBps: number;
};

export type Creator = {
  id: string;
  platform: "TikTok" | "Instagram" | "YouTube";
  handle: string;
  country: CountryCode;
  followers: number;
  avgViews: number;
  engagementRateBps: number;
  aiScore: number;
  status: "discovered" | "contacted" | "sample_sent" | "authorized" | "posted" | "reviewed";
  tags: string[];
};

export type Creative = {
  id: string;
  title: string;
  source: "organic" | "creator" | "ad";
  platform: "TikTok" | "Instagram" | "Meta";
  country: CountryCode | "GLOBAL";
  hookScore: number;
  completionScore: number;
  clickScore: number;
  scaleScore: number;
  status: "draft" | "published" | "testing" | "scaling" | "paused";
};

export type AdMetric = {
  id: string;
  creative: string;
  country: CountryCode;
  audience: string;
  spendCents: MoneyCents;
  revenueCents: MoneyCents;
  grossProfitCents: MoneyCents;
  impressions: number;
  clicks: number;
  orders: number;
  cpaCents: MoneyCents;
  roasBps: number;
  recommendation: string;
};

export type OrderItem = {
  id: string;
  externalOrderId: string;
  country: CountryCode;
  channel: string;
  revenueCents: MoneyCents;
  customization: {
    engraving?: string;
    color?: string;
    size?: string;
    imageRequired?: boolean;
  };
  fulfillmentStatus: "custom_confirm" | "production" | "shipped" | "delivered" | "after_sale";
  riskFlags: string[];
};

export type AiAction = {
  id: string;
  ownerRole: Role;
  actionType: "budget_change" | "creator_message" | "creative_pause" | "support_reply" | "gdpr";
  title: string;
  detail: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type GrowthSnapshot = {
  generatedAt: string;
  kpis: Kpi[];
  countryMetrics: CountryMetric[];
  integrations: Integration[];
  creators: Creator[];
  creatives: Creative[];
  adMetrics: AdMetric[];
  orders: OrderItem[];
  aiActions: AiAction[];
};
