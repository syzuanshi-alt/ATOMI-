import { formatISO } from "date-fns";
import type { GrowthSnapshot } from "@/lib/types";

export const getDemoSnapshot = (): GrowthSnapshot => ({
  generatedAt: formatISO(new Date()),
  kpis: [
    { label: "GMV", value: "$184,260", delta: "+18.4% vs last 7d", tone: "good" },
    { label: "真实 ROAS", value: "3.42x", delta: "+0.31 after profit sync", tone: "good" },
    { label: "CPA", value: "$28.60", delta: "-12.1% in US / CA", tone: "good" },
    { label: "待人工确认", value: "9", delta: "3 high impact actions", tone: "warn" },
  ],
  countryMetrics: [
    { country: "US", spendCents: 426000, revenueCents: 1689000, grossProfitCents: 612000, cpaCents: 2860, roasBps: 39600 },
    { country: "CA", spendCents: 138000, revenueCents: 496000, grossProfitCents: 174000, cpaCents: 2460, roasBps: 35900 },
    { country: "UK", spendCents: 210000, revenueCents: 642000, grossProfitCents: 214000, cpaCents: 3180, roasBps: 30600 },
    { country: "AU", spendCents: 126000, revenueCents: 354000, grossProfitCents: 107000, cpaCents: 3320, roasBps: 28100 },
    { country: "DE", spendCents: 104000, revenueCents: 244000, grossProfitCents: 62000, cpaCents: 4120, roasBps: 23500 },
    { country: "FR", spendCents: 97000, revenueCents: 212000, grossProfitCents: 51000, cpaCents: 4380, roasBps: 21900 },
  ],
  integrations: [
    { id: "shopify", provider: "shopify", name: "Shopify / 独立站", status: "demo", accountRef: null, lastSyncAt: null, hint: "同步订单、商品、客户、退款和店铺 webhook。" },
    { id: "meta", provider: "meta_ads", name: "Meta Ads", status: "demo", accountRef: null, lastSyncAt: null, hint: "同步广告花费、素材、国家、人群和归因数据。" },
    { id: "tiktok", provider: "tiktok_ads", name: "TikTok Ads", status: "demo", accountRef: null, lastSyncAt: null, hint: "同步短视频投流、广告组、素材表现和转化数据。" },
    { id: "instagram", provider: "instagram_graph", name: "Instagram Graph", status: "demo", accountRef: null, lastSyncAt: null, hint: "同步达人资料、互动表现、授权内容和主页线索。" },
    { id: "logistics", provider: "logistics", name: "物流 API", status: "demo", accountRef: null, lastSyncAt: null, hint: "同步生产、发货、签收、异常轨迹和售后预警。" },
    { id: "support", provider: "support", name: "客服系统", status: "demo", accountRef: null, lastSyncAt: null, hint: "同步定制确认、售后消息、满意度和人工接管记录。" },
  ],
  creators: [
    { id: "cr_1", platform: "TikTok", handle: "@watchwithmia", country: "US", followers: 184000, avgViews: 52000, engagementRateBps: 684, aiScore: 92, status: "sample_sent", tags: ["gift guide", "couple", "custom watch"] },
    { id: "cr_2", platform: "Instagram", handle: "@londonfits", country: "UK", followers: 96000, avgViews: 31000, engagementRateBps: 512, aiScore: 86, status: "discovered", tags: ["men style", "minimal", "ugc"] },
    { id: "cr_3", platform: "TikTok", handle: "@timeless.au", country: "AU", followers: 142000, avgViews: 47000, engagementRateBps: 604, aiScore: 81, status: "authorized", tags: ["unboxing", "wrist shot", "holiday"] },
  ],
  creatives: [
    { id: "cv_1", title: "3s close-up engraving hook", source: "creator", platform: "TikTok", country: "US", hookScore: 94, completionScore: 86, clickScore: 82, scaleScore: 91, status: "scaling" },
    { id: "cv_2", title: "His & hers anniversary reveal", source: "organic", platform: "Instagram", country: "UK", hookScore: 88, completionScore: 79, clickScore: 85, scaleScore: 84, status: "testing" },
    { id: "cv_3", title: "Factory customization process", source: "organic", platform: "TikTok", country: "DE", hookScore: 66, completionScore: 72, clickScore: 58, scaleScore: 61, status: "paused" },
    { id: "cv_4", title: "Luxury gift under $100", source: "ad", platform: "Meta", country: "GLOBAL", hookScore: 90, completionScore: 83, clickScore: 89, scaleScore: 93, status: "scaling" },
  ],
  adMetrics: [
    { id: "ad_1", creative: "Luxury gift under $100", country: "US", audience: "Gift buyers LAL 2%", spendCents: 182000, revenueCents: 768000, grossProfitCents: 284000, impressions: 182000, clicks: 6420, orders: 70, cpaCents: 2590, roasBps: 42200, recommendation: "预算 +20%，需确认" },
    { id: "ad_2", creative: "3s close-up engraving hook", country: "CA", audience: "Couple gift interests", spendCents: 62000, revenueCents: 248000, grossProfitCents: 91000, impressions: 59000, clicks: 2240, orders: 28, cpaCents: 2210, roasBps: 40000, recommendation: "复制到 US lookalike" },
    { id: "ad_3", creative: "Factory customization process", country: "DE", audience: "Broad 25-44", spendCents: 54000, revenueCents: 96000, grossProfitCents: 22000, impressions: 51000, clicks: 1020, orders: 11, cpaCents: 4870, roasBps: 17800, recommendation: "暂停并重剪前 3 秒" },
  ],
  orders: [
    { id: "or_1", externalOrderId: "AS-1028", country: "US", channel: "Meta Ads", revenueCents: 12900, customization: { engraving: "A+M 2026", color: "Gold", size: "42mm" }, fulfillmentStatus: "custom_confirm", riskFlags: ["engraving_confirm"] },
    { id: "or_2", externalOrderId: "AS-1034", country: "CA", channel: "TikTok Creator", revenueCents: 9900, customization: { color: "Rose Gold", imageRequired: true }, fulfillmentStatus: "production", riskFlags: [] },
    { id: "or_3", externalOrderId: "AS-1041", country: "UK", channel: "Organic TikTok", revenueCents: 14900, customization: { engraving: "Forever", color: "Black", size: "40mm" }, fulfillmentStatus: "shipped", riskFlags: ["carrier_delay"] },
  ],
  aiActions: [
    { id: "act_1", ownerRole: "gm", actionType: "budget_change", title: "Meta US Campaign 预算 +20%", detail: "基于真实毛利 ROAS 4.22x，但会增加日消耗 $360，需要人工确认。", riskLevel: "high", status: "pending", createdAt: formatISO(new Date()) },
    { id: "act_2", ownerRole: "bd", actionType: "creator_message", title: "给 @londonfits 发送英文 DM", detail: "AI 已生成个性化话术，发送前需确认品牌口吻和样品承诺。", riskLevel: "medium", status: "pending", createdAt: formatISO(new Date()) },
    { id: "act_3", ownerRole: "media_buyer", actionType: "creative_pause", title: "暂停 DE 低效素材", detail: "CPA 高于目标 38%，素材 3 秒吸引力低于 70 分。", riskLevel: "low", status: "pending", createdAt: formatISO(new Date()) },
    { id: "act_4", ownerRole: "support", actionType: "support_reply", title: "订单 AS-1028 定制信息确认", detail: "客户刻字字段疑似包含拼写错误，建议发确认邮件。", riskLevel: "medium", status: "pending", createdAt: formatISO(new Date()) },
  ],
});
