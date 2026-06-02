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
  inputLabel: string;
};

export type SupportChannel =
  | "independent_site_chat"
  | "independent_site_form"
  | "email"
  | "feishu"
  | "enterprise_wechat"
  | "whatsapp"
  | "douyin_im"
  | "tiktok_social";

export type SupportRiskLevel = "low" | "medium" | "high";

export type SupportThreadStatus = "open" | "ai_managed" | "needs_human" | "replied" | "closed";

export type SupportMessageDirection = "inbound" | "outbound";

export type SupportSenderType = "customer" | "ai" | "human" | "system";

export type SupportCustomer = {
  id: string;
  displayName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  country: CountryCode | "OTHER";
  language: "zh-CN" | "en-US" | "en-GB" | "de-DE" | "fr-FR";
};

export type CustomerIdentity = {
  id: string;
  customerId: string;
  channel: SupportChannel;
  externalUserId: string;
  displayName: string;
};

export type SupportThread = {
  id: string;
  customerId: string;
  channel: SupportChannel;
  subject: string;
  status: SupportThreadStatus;
  riskLevel: SupportRiskLevel;
  language: SupportCustomer["language"];
  orderRef: string | null;
  lastMessageAt: string;
};

export type SupportMessage = {
  id: string;
  threadId: string;
  channel: SupportChannel;
  direction: SupportMessageDirection;
  senderType: SupportSenderType;
  senderRef: string;
  originalText: string;
  createdAt: string;
};

export type MessageTranslation = {
  id: string;
  messageId: string;
  sourceLanguage: SupportCustomer["language"];
  targetLanguage: SupportCustomer["language"];
  translatedText: string;
  modelName: string;
  humanEdited: boolean;
};

export type AiReplySuggestion = {
  id: string;
  threadId: string;
  messageId: string | null;
  draftText: string;
  riskLevel: SupportRiskLevel;
  reason: string;
  status: "pending_review" | "approved" | "rejected" | "sent";
  canAutoSend: boolean;
  createdAt: string;
};

export type AiApprovalRecord = {
  id: string;
  sourceType: "ai_reply_suggestion" | "ai_action";
  sourceId: string;
  riskLevel: SupportRiskLevel;
  decision: "approved" | "rejected";
  approverRef: string;
  finalText: string | null;
  reviewNote: string | null;
  humanEdited: boolean;
  decidedAt: string;
};

export type HandoffReport = {
  id: string;
  reportDate: string;
  windowStart: string;
  windowEnd: string;
  newThreadsCount: number;
  aiRepliesCount: number;
  needsHumanCount: number;
  highRiskCount: number;
  priorityThreads: string[];
  summary: string;
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
  supportCustomers: SupportCustomer[];
  customerIdentities: CustomerIdentity[];
  supportThreads: SupportThread[];
  supportMessages: SupportMessage[];
  messageTranslations: MessageTranslation[];
  aiReplySuggestions: AiReplySuggestion[];
  aiApprovals: AiApprovalRecord[];
  handoffReports: HandoffReport[];
  creators: Creator[];
  creatives: Creative[];
  adMetrics: AdMetric[];
  orders: OrderItem[];
  aiActions: AiAction[];
};
