"use client";

import {
  Bell,
  ClipboardCheck,
  Database,
  Gauge,
  Handshake,
  LockKeyhole,
  Megaphone,
  MessageSquareText,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Video,
  Watch,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  AiReplySuggestion,
  CustomerIdentity,
  GrowthSnapshot,
  HandoffReport,
  MessageTranslation,
  Provider,
  SupportChannel,
  SupportCustomer,
  SupportMessage,
  SupportRiskLevel,
  SupportThread,
} from "@/lib/types";

type ViewId =
  | "dashboard"
  | "integrations"
  | "creators"
  | "creatorDetail"
  | "creatives"
  | "ads"
  | "supportHub"
  | "orders"
  | "actions"
  | "privacy";

type RoleId = "owner" | "bd" | "media" | "support" | "admin";

type GrowthAppProps = {
  initialSnapshot: GrowthSnapshot;
};

type SupportThreadsResponse = {
  mode: "demo";
  note: string;
  threads: SupportThread[];
  customers: SupportCustomer[];
  identities: CustomerIdentity[];
};

type SupportThreadDetailResponse = {
  mode: "demo";
  note: string;
  thread: SupportThread;
  customer: SupportCustomer | null;
  identities: CustomerIdentity[];
  messages: SupportMessage[];
  translations: MessageTranslation[];
  aiReplySuggestions: AiReplySuggestion[];
};

type HandoffReportResponse = {
  mode: "demo";
  note: string;
  reports: HandoffReport[];
  highRiskThreads: SupportThread[];
  needsHumanThreads: SupportThread[];
};

type AiDraftResponse = {
  mode: "demo";
  persisted: false;
  note: string;
  draft: AiReplySuggestion;
  guardrail: string;
};

const views: Array<{ id: ViewId; label: string; icon: React.ReactNode }> = [
  { id: "dashboard", label: "经营看板", icon: <Gauge size={17} /> },
  { id: "integrations", label: "数据接入", icon: <Database size={17} /> },
  { id: "supportHub", label: "统一客服", icon: <MessageSquareText size={17} /> },
  { id: "creators", label: "达人 BD（商务拓展）", icon: <Handshake size={17} /> },
  { id: "creatives", label: "内容中心", icon: <Video size={17} /> },
  { id: "ads", label: "广告驾驶舱", icon: <Megaphone size={17} /> },
  { id: "orders", label: "订单履约", icon: <PackageCheck size={17} /> },
  { id: "actions", label: "AI（人工智能）确认中心", icon: <ClipboardCheck size={17} /> },
  { id: "privacy", label: "GDPR（欧盟隐私合规）", icon: <ShieldCheck size={17} /> },
];

const titles: Record<ViewId, string> = {
  dashboard: "经营看板",
  integrations: "数据接入",
  creators: "达人 BD（商务拓展）",
  creatorDetail: "达人详情",
  creatives: "内容中心",
  ads: "广告驾驶舱",
  supportHub: "统一客服工作台",
  orders: "订单履约",
  actions: "AI（人工智能）确认中心",
  privacy: "GDPR（欧盟隐私合规）",
};

const roleConfigs: Record<
  RoleId,
  {
    label: string;
    badge: string;
    description: string;
    defaultView: ViewId;
    allowedViews: ViewId[];
    homeTitle: string;
    actions: Array<{ title: string; detail: string; target: ViewId; cta: string }>;
  }
> = {
  owner: {
    label: "老板 / 经营者",
    badge: "成交额 / 投产比",
    description: "经营者视图：看 GMV（成交额）、真实 ROAS（广告回报）、预算风险和高影响动作。",
    defaultView: "dashboard",
    allowedViews: ["dashboard", "supportHub", "creators", "creatorDetail", "ads", "orders", "actions"],
    homeTitle: "老板今日决策台",
    actions: [
      { title: "确认 US（美国）广告预算 +20%", detail: "真实毛利 ROAS（广告回报）4.22x，但会增加日消耗，需要老板确认。", target: "actions", cta: "去确认" },
      { title: "查看夜间客服风险", detail: "AI（人工智能）离线托管收集了 6 条潜在成交和 2 条售后风险，需客服上班后接管。", target: "supportHub", cta: "看客服日报" },
      { title: "复盘达人投流回本", detail: "@watchwithmia 已产生投流 GMV（成交额），可判断是否续约。", target: "creators", cta: "看达人 ROI（投入产出）" },
    ],
  },
  bd: {
    label: "BD（商务拓展）/ 达人运营",
    badge: "达人任务（Creator Tasks）",
    description: "BD 视图：看达人待办、建联话术、寄样、授权和视频产出。",
    defaultView: "creators",
    allowedViews: ["dashboard", "creators", "creatorDetail", "creatives", "actions"],
    homeTitle: "BD 今日达人待办",
    actions: [
      { title: "发送 @londonfits 首封 DM（私信）", detail: "AI（人工智能）已准备个性化英文建联话术，发送前需人工确认。", target: "actions", cta: "处理话术" },
      { title: "确认 @watchwithmia 寄样地址", detail: "样品未确认会影响视频产出节奏。", target: "creatorDetail", cta: "看合作链路" },
      { title: "归档已授权视频", detail: "已授权素材需要进入内容中心，供投流团队测试。", target: "creatives", cta: "看内容中心" },
    ],
  },
  media: {
    label: "投流 / 广告投手",
    badge: "CPA（获客成本）/ Creative（素材）",
    description: "投流视图：看素材、国家、人群、CPA（获客成本）、真实毛利 ROAS（广告回报）和预算动作。",
    defaultView: "ads",
    allowedViews: ["dashboard", "creatives", "ads", "actions"],
    homeTitle: "投流今日操作台",
    actions: [
      { title: "放量 Luxury gift under $100（百美元内轻奢礼物）", detail: "US（美国）真实 ROAS（广告回报）4.22x，建议小幅加预算并继续观察。", target: "actions", cta: "确认预算" },
      { title: "暂停 DE（德国）低效素材", detail: "CPA（获客成本）高于目标，AI（人工智能）建议重剪前 3 秒。", target: "ads", cta: "看素材表现" },
      { title: "从达人视频生成广告测试", detail: "高分 Creator Asset（达人素材）可复制到 US（美国）/ CA（加拿大）测试池。", target: "creatives", cta: "看素材池" },
    ],
  },
  support: {
    label: "客服 / 履约",
    badge: "客服 / 订单",
    description: "客服视图：看统一消息、AI（人工智能）草稿、离线托管日报、订单物流、售后风险和 GDPR（欧盟隐私合规）请求。",
    defaultView: "supportHub",
    allowedViews: ["dashboard", "supportHub", "orders", "actions", "privacy"],
    homeTitle: "客服今日处理台",
    actions: [
      { title: "处理离线托管日报", detail: "昨晚 AI（人工智能）只回复低风险问题，并收集订单号、邮箱、截图和问题类型。", target: "supportHub", cta: "看统一客服" },
      { title: "确认 AS-1028 刻字信息", detail: "客户刻字疑似需要二次确认，AI（人工智能）已准备英文回复草稿。", target: "orders", cta: "看订单" },
      { title: "处理 UK（英国）物流延迟", detail: "AS-1041 出现 carrier delay（承运商延迟），需要提前安抚客户。", target: "actions", cta: "处理售后" },
    ],
  },
  admin: {
    label: "管理员 / 系统",
    badge: "权限 / 审计（Access / Audit）",
    description: "管理员视图：看平台接入、权限、同步状态、合规和审计。",
    defaultView: "integrations",
    allowedViews: ["dashboard", "integrations", "supportHub", "creators", "creatorDetail", "creatives", "ads", "orders", "actions", "privacy"],
    homeTitle: "系统管理员控制台",
    actions: [
      { title: "配置平台连接", detail: "API token（接口密钥）只进后端，前端只显示连接状态。", target: "integrations", cta: "接入平台" },
      { title: "检查客服托管边界", detail: "确认 AI（人工智能）不会自动承诺退款、补偿、改价、取消订单或发送真实消息。", target: "supportHub", cta: "看客服规则" },
      { title: "检查 AI（人工智能）动作审计", detail: "预算、发信、客服回复都必须留下确认记录。", target: "actions", cta: "看动作" },
    ],
  },
};

const providerPlaceholders: Record<Provider, string> = {
  shopify: "your-store.myshopify.com",
  meta_ads: "act_1234567890",
  tiktok_ads: "advertiser_id_123456",
  instagram_graph: "instagram_business_account_id",
  logistics: "carrier_profile_or_api_account",
  support: "zendesk_or_gorgias_workspace",
  csv: "csv",
};

const supportRiskLabel: Record<SupportRiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

const supportStatusLabel: Record<SupportThread["status"], string> = {
  open: "待回复",
  ai_managed: "AI（人工智能）托管中",
  needs_human: "待人工接管",
  replied: "已回复",
  closed: "已关闭",
};

const supportChannelLabel: Record<SupportChannel, string> = {
  independent_site_chat: "独立站在线客服（Live Chat）",
  independent_site_form: "独立站表单/留言（Form）",
  email: "邮件客服（Email）",
  feishu: "飞书内部通知（Feishu）",
  enterprise_wechat: "企业微信/微信客服",
  whatsapp: "WhatsApp Business（企业消息）",
  douyin_im: "抖音 IM（即时消息）",
  tiktok_social: "TikTok 社媒私信",
};

const supportLanguageLabel: Record<SupportCustomer["language"], string> = {
  "zh-CN": "中文",
  "en-US": "英文（美国）",
  "en-GB": "英文（英国）",
  "de-DE": "德文",
  "fr-FR": "法文",
};

const countryLabel: Record<string, string> = {
  US: "US（美国）",
  UK: "UK（英国）",
  DE: "DE（德国）",
  FR: "FR（法国）",
  CA: "CA（加拿大）",
  AU: "AU（澳大利亚）",
  GLOBAL: "全球（GLOBAL）",
  OTHER: "其他地区（OTHER）",
};

const creatorStatusLabel: Record<string, string> = {
  discovered: "已发现",
  contacted: "已建联",
  sample_sent: "已寄样",
  authorized: "已授权",
  posted: "已发布",
  reviewed: "已复盘",
};

const creativeStatusLabel: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  testing: "测试中",
  scaling: "放量中",
  paused: "已暂停",
};

const videoStatusLabel: Record<string, string> = {
  not_ready: "未就绪",
  test_pool: "测试池",
  testing: "测试中",
  scaling: "放量中",
};

const orderStatusLabel: Record<string, string> = {
  custom_confirm: "定制信息待确认",
  production: "生产中",
  shipped: "已发货",
  delivered: "已签收",
  after_sale: "售后处理中",
};

const orderRiskLabel: Record<string, string> = {
  engraving_confirm: "风险：刻字待确认",
  carrier_delay: "风险：承运商延迟",
};

const supportDraftReviewNote: Record<string, string> = {
  ars_1: "中文审核说明：客户问 AS-1041 物流时效，草稿只表示已收到订单号并等待客服核查，不承诺具体送达时间。",
  ars_3: "中文审核说明：客户问是否能刻两个姓名首字母，草稿只引导客户提供刻字内容，并说明生产前会再次确认。",
};

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

const roas = (bps: number) => `${(bps / 10000).toFixed(2)}x`;
const percent = (bps: number) => `${(bps / 100).toFixed(1)}%`;

const creatorDetailByHandle = {
  "@watchwithmia": {
    recommendation: "建议进入小预算广告测试池。内容方向与 US（美国）情侣礼物和定制腕表高度匹配，评论区购买意图强。",
    nextAction: "BD（商务拓展）确认寄样地址和素材授权范围，投流同事准备 US（美国）小预算测试计划。",
    totalCostCents: 61000,
    sampleCostCents: 11000,
    creatorFeeCents: 50000,
    organicRevenueCents: 132000,
    paidRevenueCents: 768000,
    grossProfitCents: 284000,
    roiBps: 46500,
    journey: ["发现达人", "AI（人工智能）评分 92", "生成英文 DM（私信）", "人工确认发送", "寄样待确认", "素材授权待签", "视频脚本确认", "发布后进入投流池"],
    videos: [
      { title: "3 秒刻字特写开头（3s close-up engraving hook）", url: "TikTok 草稿 / Demo 演示", organicViews: 52000, hookScore: 94, completionRateBps: 4100, adScaleScore: 91, adStatus: "test_pool", paidRevenueCents: 768000, grossProfitCents: 284000, spendCents: 182000 },
      { title: "情侣礼物展示（Couple gift reveal）", url: "TikTok 草稿 / Demo 演示", organicViews: 28000, hookScore: 86, completionRateBps: 3600, adScaleScore: 83, adStatus: "testing", paidRevenueCents: 186000, grossProfitCents: 64000, spendCents: 61000 },
    ],
  },
  "@londonfits": {
    recommendation: "建议先完成英文 DM（私信）和报价确认，不直接进入投流。达人风格适合 UK（英国）男士礼物，但缺少授权素材。",
    nextAction: "BD（商务拓展）发送首封 DM（私信），确认是否接受样品置换或低预算 UGC（用户原创内容）合作。",
    totalCostCents: 0,
    sampleCostCents: 0,
    creatorFeeCents: 0,
    organicRevenueCents: 0,
    paidRevenueCents: 0,
    grossProfitCents: 0,
    roiBps: 0,
    journey: ["发现达人", "AI（人工智能）评分 86", "待生成 DM（私信）", "等待回复", "报价确认", "寄样", "视频发布", "ROI（投入产出）复盘"],
    videos: [
      { title: "极简腕表穿搭概念（Minimal watch styling concept）", url: "暂无视频", organicViews: 0, hookScore: 0, completionRateBps: 0, adScaleScore: 0, adStatus: "not_ready", paidRevenueCents: 0, grossProfitCents: 0, spendCents: 0 },
    ],
  },
  "@timeless.au": {
    recommendation: "建议保留素材授权，先在 AU（澳大利亚）做低预算测试，再根据 CPA（获客成本）决定是否复制到 CA（加拿大）。",
    nextAction: "投流同事创建 AU（澳大利亚）测试广告组，BD（商务拓展）跟进二次合作报价。",
    totalCostCents: 43000,
    sampleCostCents: 10000,
    creatorFeeCents: 33000,
    organicRevenueCents: 82000,
    paidRevenueCents: 248000,
    grossProfitCents: 91000,
    roiBps: 21200,
    journey: ["发现达人", "AI（人工智能）评分 81", "已建联", "已寄样", "已授权素材", "视频已发布", "进入 AU（澳大利亚）测试", "等待 ROI（投入产出）复盘"],
    videos: [
      { title: "开箱与上手镜头（Unboxing and wrist shot）", url: "TikTok 已发布 / Demo 演示", organicViews: 47000, hookScore: 82, completionRateBps: 3900, adScaleScore: 84, adStatus: "testing", paidRevenueCents: 248000, grossProfitCents: 91000, spendCents: 62000 },
    ],
  },
};

export function GrowthApp({ initialSnapshot }: GrowthAppProps) {
  const [view, setView] = useState<ViewId>("dashboard");
  const [role, setRole] = useState<RoleId>("owner");
  const [selectedCreatorHandle, setSelectedCreatorHandle] = useState(initialSnapshot.creators[0]?.handle ?? "@watchwithmia");
  const [liveMode, setLiveMode] = useState(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [toast, setToast] = useState("");
  const [gdprIdentity, setGdprIdentity] = useState("");
  const [gdprMode, setGdprMode] = useState<"anonymize" | "delete">("anonymize");
  const [csvPreview, setCsvPreview] = useState("等待上传");
  const [supportThreads, setSupportThreads] = useState(initialSnapshot.supportThreads);
  const [supportCustomers, setSupportCustomers] = useState(initialSnapshot.supportCustomers);
  const [supportIdentities, setSupportIdentities] = useState(initialSnapshot.customerIdentities);
  const [supportDetail, setSupportDetail] = useState<SupportThreadDetailResponse | null>(null);
  const [handoffReports, setHandoffReports] = useState(initialSnapshot.handoffReports);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState("");
  const [selectedSupportThreadId, setSelectedSupportThreadId] = useState(initialSnapshot.supportThreads[0]?.id ?? "");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const pendingHighRisk = useMemo(
    () => snapshot.aiActions.filter((item) => item.status === "pending" && item.riskLevel === "high").length,
    [snapshot.aiActions],
  );
  const selectedCreator = snapshot.creators.find((item) => item.handle === selectedCreatorHandle) ?? snapshot.creators[0];
  const selectedCreatorDetail =
    creatorDetailByHandle[selectedCreatorHandle as keyof typeof creatorDetailByHandle] ?? creatorDetailByHandle["@watchwithmia"];
  const selectedSupportThread = supportThreads.find((item) => item.id === selectedSupportThreadId) ?? supportThreads[0];
  const selectedSupportCustomer =
    (supportDetail?.customer ?? supportCustomers.find((item) => item.id === selectedSupportThread?.customerId)) ?? null;
  const selectedSupportMessages =
    supportDetail?.messages ?? snapshot.supportMessages.filter((item) => item.threadId === selectedSupportThread?.id);
  const selectedSupportMessage = selectedSupportMessages.at(-1) ?? null;
  const selectedSupportTranslations =
    supportDetail?.translations ?? snapshot.messageTranslations.filter((item) => item.messageId === selectedSupportMessage?.id);
  const selectedSupportTranslation = selectedSupportTranslations.at(-1) ?? null;
  const selectedSupportDraft =
    (supportDetail?.aiReplySuggestions.at(-1) ??
      snapshot.aiReplySuggestions.find((item) => item.threadId === selectedSupportThread?.id)) ??
    null;
  const selectedSupportIdentity =
    supportDetail?.identities[0] ?? supportIdentities.find((item) => item.customerId === selectedSupportThread?.customerId) ?? null;
  const latestHandoffReport = handoffReports[0] ?? null;
  const handoffItems = [
    {
      label: "离线会话",
      value: String(latestHandoffReport?.newThreadsCount ?? supportThreads.length),
      detail: latestHandoffReport
        ? `${latestHandoffReport.windowStart} 到 ${latestHandoffReport.windowEnd}`
        : "当前使用首屏 Demo 会话兜底。",
    },
    {
      label: "待人工处理",
      value: String(latestHandoffReport?.needsHumanCount ?? supportThreads.filter((item) => item.status === "needs_human").length),
      detail: "退款、投诉、物流异常和生产能力确认必须人工接管。",
    },
    {
      label: "高风险会话",
      value: String(latestHandoffReport?.highRiskCount ?? supportThreads.filter((item) => item.riskLevel === "high").length),
      detail: "高风险不允许 AI（人工智能）自动发送客户回复。",
    },
    {
      label: "AI（人工智能）自动回复",
      value: String(latestHandoffReport?.aiRepliesCount ?? snapshot.aiReplySuggestions.filter((item) => item.canAutoSend).length),
      detail: "只允许低风险欢迎、收集信息和上班时间说明。",
    },
  ];
  const roleConfig = roleConfigs[role];
  const visibleViews = views.filter((item) => roleConfig.allowedViews.includes(item.id));

  const goTo = (target: ViewId) => {
    if (!roleConfig.allowedViews.includes(target)) {
      showToast(`${roleConfig.label} 暂无该模块权限。`);
      setView(roleConfig.defaultView);
      return;
    }
    setView(target);
  };

  const roleHeaders = () => ({
    "x-demo-role": role,
  });

  useEffect(() => {
    if (view !== "supportHub") return;

    let disposed = false;

    const loadSupportOverview = async () => {
      setSupportLoading(true);
      setSupportError("");

      try {
        const [threadsResponse, handoffResponse] = await Promise.all([
          fetch("/api/support/threads", { headers: { "x-demo-role": role } }),
          fetch("/api/support/handoff-report", { headers: { "x-demo-role": role } }),
        ]);

        if (!threadsResponse.ok || !handoffResponse.ok) {
          setSupportError("当前岗位暂无统一客服数据权限，或 Demo API 暂时不可用。");
          return;
        }

        const threadsResult = (await threadsResponse.json()) as SupportThreadsResponse;
        const handoffResult = (await handoffResponse.json()) as HandoffReportResponse;

        if (disposed) return;

        setSupportThreads(threadsResult.threads);
        setSupportCustomers(threadsResult.customers);
        setSupportIdentities(threadsResult.identities);
        setHandoffReports(handoffResult.reports);
        setSelectedSupportThreadId((current) =>
          threadsResult.threads.some((item) => item.id === current) ? current : threadsResult.threads[0]?.id ?? "",
        );
      } catch {
        if (!disposed) {
          setSupportError("统一客服 Demo API 加载失败，请先确认本地 Next 服务是否运行。");
        }
      } finally {
        if (!disposed) {
          setSupportLoading(false);
        }
      }
    };

    void loadSupportOverview();

    return () => {
      disposed = true;
    };
  }, [role, view]);

  useEffect(() => {
    if (view !== "supportHub" || !selectedSupportThreadId) return;

    let disposed = false;

    const loadSupportDetail = async () => {
      try {
        const response = await fetch(`/api/support/threads/${selectedSupportThreadId}`, {
          headers: { "x-demo-role": role },
        });

        if (!response.ok) {
          setSupportDetail(null);
          return;
        }

        const result = (await response.json()) as SupportThreadDetailResponse;
        if (!disposed) {
          setSupportDetail(result);
        }
      } catch {
        if (!disposed) {
          setSupportDetail(null);
        }
      }
    };

    void loadSupportDetail();

    return () => {
      disposed = true;
    };
  }, [role, selectedSupportThreadId, view]);

  const refreshSnapshot = async () => {
    const response = await fetch("/api/snapshot", {
      headers: roleHeaders(),
    });
    setSnapshot((await response.json()) as GrowthSnapshot);
    showToast("经营快照已刷新。真实版会从队列同步平台数据。");
  };

  const decideAction = async (actionId: string, decision: "approved" | "rejected") => {
    const response = await fetch("/api/ai-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...roleHeaders() },
      body: JSON.stringify({ actionId, decision }),
    });
    if (response.status === 403) {
      const result = (await response.json()) as { message?: string };
      showToast(result.message ?? "当前岗位没有权限确认该动作。");
      return;
    }
    if (response.ok) {
      setSnapshot((current) => ({
        ...current,
        aiActions: current.aiActions.map((item) => (item.id === actionId ? { ...item, status: decision } : item)),
      }));
      showToast(decision === "approved" ? "动作已确认，进入执行队列。" : "动作已驳回，并写入审计记录。");
    }
  };

  const simulateSupportMessage = async () => {
    const response = await fetch("/api/support/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...roleHeaders() },
      body: JSON.stringify({
        channel: "independent_site_chat",
        customerName: "演示客户",
        externalUserId: "site_chat_demo",
        originalText: "请问可以发加拿大吗？还能刻字吗？",
        language: "zh-CN",
      }),
    });

    if (response.status === 403) {
      const result = (await response.json()) as { message?: string };
      showToast(result.message ?? "当前岗位没有权限模拟客服消息。");
      return;
    }

    if (!response.ok) {
      showToast("模拟消息失败，请检查 Demo API。");
      return;
    }

    const result = (await response.json()) as { thread: SupportThread; message: SupportMessage; draft: AiReplySuggestion };
    setSupportThreads((current) => [result.thread, ...current.filter((item) => item.id !== result.thread.id)]);
    setSupportDetail({
      mode: "demo",
      note: "前端临时展示的模拟消息。真实模式必须写入数据库、审计日志和渠道原始 payload。",
      thread: result.thread,
      customer: {
        id: result.thread.customerId,
        displayName: "演示客户",
        primaryEmail: null,
        primaryPhone: null,
        country: "CA",
        language: result.thread.language,
      },
      identities: [],
      messages: [result.message],
      translations: [],
      aiReplySuggestions: [result.draft],
    });
    setSelectedSupportThreadId(result.thread.id);
    showToast("已模拟一条独立站客服消息进入队列。真实版必须走 Webhook（平台回调）和审计日志。");
  };

  const generateSupportDraft = async () => {
    if (!selectedSupportThread) {
      showToast("请先选择一条客服会话。");
      return;
    }

    const response = await fetch("/api/support/ai-drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...roleHeaders() },
      body: JSON.stringify({
        threadId: selectedSupportThread.id,
        messageId: selectedSupportMessage?.id,
      }),
    });

    if (response.status === 403) {
      const result = (await response.json()) as { message?: string };
      showToast(result.message ?? "当前岗位没有权限生成客服回复草稿。");
      return;
    }

    if (!response.ok) {
      showToast("AI（人工智能）草稿生成失败，请检查会话和消息是否存在。");
      return;
    }

    const result = (await response.json()) as AiDraftResponse;
    setSupportDetail((current) =>
      current
        ? {
            ...current,
            aiReplySuggestions: [...current.aiReplySuggestions.filter((item) => item.id !== result.draft.id), result.draft],
          }
        : current,
    );
    showToast(result.guardrail);
  };

  const createGdprRequest = async () => {
    const response = await fetch("/api/gdpr", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...roleHeaders() },
      body: JSON.stringify({ identity: gdprIdentity, mode: gdprMode }),
    });
    const result = (await response.json()) as { id?: string; affectedSystems?: string[] };
    showToast(result.id ? `GDPR（欧盟隐私合规）工单已创建：覆盖 ${result.affectedSystems?.length ?? 0} 个系统。` : "请先输入有效客户标识。");
  };

  return (
    <div className={`app-shell view-${view}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Watch size={24} />
          </div>
          <div>
            <p className="eyebrow">AI（人工智能）电商自动化</p>
            <h1>运营平台</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="主导航">
          {visibleViews.map((item) => (
            <button key={item.id} className={`nav-item ${view === item.id ? "is-active" : ""}`} onClick={() => goTo(item.id)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <section className="mode-panel">
          <div>
            <p className="eyebrow">当前模式</p>
            <strong>{liveMode ? "真实模式" : "Demo 模式"}</strong>
          </div>
          <label className="switch">
            <input type="checkbox" checked={liveMode} onChange={(event) => setLiveMode(event.target.checked)} />
            <span />
          </label>
        </section>

        <section className="role-panel">
          <p className="eyebrow">岗位视图</p>
          <label>
            <span>当前登录身份</span>
            <select
              value={role}
              onChange={(event) => {
                const nextRole = event.target.value as RoleId;
                setRole(nextRole);
                setView(roleConfigs[nextRole].defaultView);
              }}
            >
              <option value="owner">老板 / 经营者</option>
              <option value="bd">BD / 达人运营</option>
              <option value="media">投流 / 广告投手</option>
              <option value="support">客服 / 履约</option>
              <option value="admin">管理员 / 系统</option>
            </select>
          </label>
          <p className="muted">{roleConfig.description}</p>
        </section>

        <section className="mini-status">
          <p className="eyebrow">今日闭环</p>
          <div className="progress-row">
            <span>同步与评分</span>
            <strong>86%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: "86%" }} />
          </div>
          <p className="muted">高分素材进入投流池，低分素材已生成优化建议。</p>
        </section>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">短视频 → 达人 → 投流 → 独立站 → 订单履约</p>
            <h2>{titles[view]}</h2>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={refreshSnapshot} aria-label="刷新">
              <RefreshCcw size={18} />
            </button>
            <button className="primary-button" onClick={() => goTo("integrations")}>
              连接平台
            </button>
          </div>
        </header>

        {view === "dashboard" && (
          <>
            <section className="hero-ops">
              <div className="hero-copy">
                <p className="eyebrow">AI（人工智能）电商自动化运营平台</p>
                <h3>先用 Demo 跑通经营、客服、订单和投流闭环，再逐步接入真实平台。</h3>
                <p>一期重点做可交付后台、统一客服托管、订单物流同步和 AI（人工智能）审核边界。真实账号、真实密钥、真实客户消息必须进入后端权限和人工审核流程。</p>
              </div>
              <div className="signal-stack">
                <div className="signal-card">
                  <Sparkles />
                  <span>AI（人工智能）动作（AI Action）</span>
                  <strong>{snapshot.aiActions.length}</strong>
                </div>
                <div className="signal-card">
                  <Bell />
                  <span>高风险（High Risk）</span>
                  <strong>{pendingHighRisk}</strong>
                </div>
              </div>
            </section>

            <section className="kpi-grid">
              {snapshot.kpis.map((item) => (
                <article className="metric-card" key={item.label}>
                  <p className="eyebrow">{item.label}</p>
                  <strong>{item.value}</strong>
                  <small className={`tone-${item.tone}`}>{item.delta}</small>
                </article>
              ))}
            </section>

            <section className="panel role-home">
              <div className="section-head">
                <div>
                  <p className="eyebrow">岗位首页</p>
                  <h3>{roleConfig.homeTitle}</h3>
                </div>
                <span className="status-pill status-demo">{roleConfig.badge}</span>
              </div>
              <div className="role-action-grid">
                {roleConfig.actions.map((item) => (
                  <article className="role-action-card" key={item.title}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <button className="ghost-button" onClick={() => goTo(item.target)}>
                      {item.cta}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <div className="split-grid">
              <section className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">国家表现</p>
                    <h3>预算应该流向哪里</h3>
                  </div>
                  <button className="ghost-button" onClick={() => goTo("ads")}>
                    查看广告
                  </button>
                </div>
                <DataRows
                  columns={["国家", "花费", "收入", "毛利", "CPA（获客成本）", "ROAS（广告回报）"]}
                  rows={snapshot.countryMetrics.map((row) => [
                    countryLabel[row.country] ?? row.country,
                    money(row.spendCents),
                    money(row.revenueCents),
                    money(row.grossProfitCents),
                    money(row.cpaCents),
                    roas(row.roasBps),
                  ])}
                />
              </section>

              <section className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">AI（人工智能）每日建议</p>
                    <h3>需要确认的动作</h3>
                  </div>
                  <button className="ghost-button" onClick={() => goTo("actions")}>
                    全部处理
                  </button>
                </div>
                <div className="action-list">
                  {snapshot.aiActions.slice(0, 3).map((item) => (
                    <article className="approval-card" key={item.id}>
                      <header>
                        <strong>{item.title}</strong>
                        <span className={`status-pill risk-${item.riskLevel}`}>{supportRiskLabel[item.riskLevel]}</span>
                      </header>
                      <p>{item.detail}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {view === "integrations" && (
          <>
            <div className="integration-page-head">
              <div>
                <h2>数据接入</h2>
                <p>连接跨境电商运营数据源，先用 Demo/模拟数据验证流程，再进入真实接口授权。</p>
              </div>
              <div className="integration-actions">
                <button className="primary-button" onClick={() => showToast("已进入连接准备流程。真实版会跳转官方授权页，Demo 不会写入真实密钥。")}>
                  连接平台
                </button>
                <button className="ghost-button" onClick={() => showToast("连接信息已保存到当前演示环境。真实版会写入后端加密存储。")}>
                  保存连接
                </button>
              </div>
            </div>
            <div className="connector-grid">
              {snapshot.integrations.map((item) => (
                <article className="connector-card" key={item.id}>
                  <header>
                    <div>
                      <h3>{item.name}</h3>
                    </div>
                    <span className={`status-pill status-${item.accountRef ? "connected" : "demo"}`}>
                      {item.accountRef ? "已连接" : "Demo"}
                    </span>
                  </header>
                  <p className="muted">{item.hint}</p>
                  <ConnectForm label={item.inputLabel} placeholder={providerPlaceholders[item.provider]} />
                </article>
              ))}
            </div>
            <section className="panel upload-panel csv-upload-card">
              <div className="csv-upload-head">
                <div>
                  <h3>CSV（表格文件）数据上传</h3>
                  <p className="muted">用于前期没有接口权限时导入订单、广告、物流或客服历史数据，帮助快速跑通 Demo 流程。</p>
                </div>
                <label className="ghost-button csv-upload-button" htmlFor="csvInputNext">
                  选择文件
                </label>
              </div>
              <input
                id="csvInputNext"
                className="sr-only"
                type="file"
                accept=".csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  setCsvPreview(text.split(/\r?\n/).slice(0, 6).join("\n") || "CSV（表格文件）为空");
                  showToast("CSV（表格文件）已读取，可进入字段映射与数据校验流程。");
                }}
              />
              <label className="file-drop" htmlFor="csvInputNext">
                <span>拖拽 CSV（表格文件）到这里，或点击右上角选择文件</span>
                <small>支持订单、物流、广告、客服历史数据；真实客户资料上线前必须脱敏。</small>
              </label>
              <div className="csv-upload-status">{csvPreview}</div>
            </section>
          </>
        )}

        {view === "creators" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">达人 BD 管理</p>
                <h3>达人发现、评分、建联、寄样、ROI（投入产出）复盘</h3>
              </div>
              <button className="primary-button" onClick={() => showToast("已生成英文 DM（私信）草稿，等待 BD（商务拓展）确认后发送。")}>
                生成英文建联话术
              </button>
            </div>
            <div className="data-grid">
              {snapshot.creators.map((item) => (
                <article className="data-card" key={item.id}>
                  <header>
                    <strong>{item.handle}</strong>
                    <span className="score-pill">{item.aiScore}</span>
                  </header>
                  <p className="muted">
                    {item.platform} · {countryLabel[item.country] ?? item.country} · {item.followers.toLocaleString("en-US")} 粉丝（followers）
                  </p>
                  <p>{creatorStatusLabel[item.status] ?? item.status}</p>
                  <div className="score-bar">
                    <span style={{ width: `${item.aiScore}%` }} />
                  </div>
                  <TagRow tags={item.tags} />
                  <button
                    className="ghost-button card-action"
                    onClick={() => {
                      setSelectedCreatorHandle(item.handle);
                      goTo("creatorDetail");
                    }}
                  >
                    查看合作链路
                  </button>
                </article>
              ))}
            </div>
          </>
        )}

        {view === "creatorDetail" && selectedCreator && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">达人详情</p>
                <h3>{selectedCreator.handle} 合作链路</h3>
              </div>
              <div className="topbar-actions">
                <button className="ghost-button" onClick={() => goTo("creators")}>
                  返回达人列表
                </button>
                <button className="primary-button" onClick={() => goTo("ads")}>
                  查看完整广告 ROI（投入产出）
                </button>
              </div>
            </div>

            <div className="creator-detail-grid">
              <section className="panel creator-profile">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">达人概览</p>
                    <h3>{selectedCreator.handle}</h3>
                  </div>
                  <span className="score-pill">{selectedCreator.aiScore}/100</span>
                </div>
                <p className="muted">
                  {selectedCreator.platform} · {countryLabel[selectedCreator.country] ?? selectedCreator.country} ·{" "}
                  {selectedCreator.followers.toLocaleString("en-US")} 粉丝（followers） · {creatorStatusLabel[selectedCreator.status] ?? selectedCreator.status}
                </p>
                <p>{selectedCreatorDetail.recommendation}</p>
                <TagRow tags={selectedCreator.tags} />
              </section>

              <section className="panel">
                <p className="eyebrow">下一步 BD 动作</p>
                <h3>{selectedCreatorDetail.nextAction}</h3>
                <div className="approval-card inline-action">
                  <strong>建议动作</strong>
                  <p>生成跟进话术（follow-up）、授权确认或寄样提醒，进入人工确认后再发送。</p>
                  <button className="primary-button" onClick={() => showToast("已生成 BD 下一步话术，发送前仍需人工确认。")}>
                    生成下一步话术
                  </button>
                </div>
              </section>
            </div>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">BD 动作流</p>
                  <h3>从发现到视频产出</h3>
                </div>
              </div>
              <div className="journey-track">
                {selectedCreatorDetail.journey.map((step, index) => (
                  <div className="journey-step" key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">视频产出与投流联动</p>
                  <h3>达人视频先变成 Creative Asset（可投放素材），再进入广告测试</h3>
                </div>
                <button className="ghost-button" onClick={() => goTo("creatives")}>
                  查看内容中心
                </button>
              </div>
              <div className="video-grid">
                {selectedCreatorDetail.videos.map((video) => (
                  <article className="creative-card" key={video.title}>
                    <header>
                      <strong>{video.title}</strong>
                      <span className="status-pill status-demo">{videoStatusLabel[video.adStatus] ?? video.adStatus}</span>
                    </header>
                    <p>{video.url}</p>
                    <TagRow
                      tags={[
                        `Organic（自然流量）${video.organicViews.toLocaleString("en-US")}`,
                        `Hook（开头吸引力）${video.hookScore}`,
                        `完播 ${percent(video.completionRateBps)}`,
                        `Scale（放量）${video.adScaleScore}`,
                      ]}
                    />
                    <div className="roi-strip">
                      <span>Spend（花费）{money(video.spendCents)}</span>
                      <span>Paid GMV（广告成交额）{money(video.paidRevenueCents)}</span>
                      <span>Gross Profit（毛利）{money(video.grossProfitCents)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">达人 ROI（投入产出）摘要</p>
                  <h3>完整广告 ROI（投入产出）仍在广告驾驶舱统一分析</h3>
                </div>
                <button className="primary-button" onClick={() => goTo("ads")}>
                  查看完整广告 ROI（投入产出）
                </button>
              </div>
              <div className="roi-summary">
                <article>
                  <span>总成本</span>
                  <strong>{money(selectedCreatorDetail.totalCostCents)}</strong>
                </article>
                <article>
                  <span>寄样成本</span>
                  <strong>{money(selectedCreatorDetail.sampleCostCents)}</strong>
                </article>
                <article>
                  <span>达人费用</span>
                  <strong>{money(selectedCreatorDetail.creatorFeeCents)}</strong>
                </article>
                <article>
                  <span>自然 GMV（自然成交额）</span>
                  <strong>{money(selectedCreatorDetail.organicRevenueCents)}</strong>
                </article>
                <article>
                  <span>投流 GMV（广告成交额）</span>
                  <strong>{money(selectedCreatorDetail.paidRevenueCents)}</strong>
                </article>
                <article>
                  <span>毛利 ROI（投入产出）</span>
                  <strong>{roas(selectedCreatorDetail.roiBps)}</strong>
                </article>
              </div>
            </section>
          </>
        )}

        {view === "creatives" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">素材投流中心</p>
                  <h3>短视频素材评分与投流池</h3>
                </div>
              <button className="primary-button" onClick={() => showToast("素材评分已更新，高分素材进入投流池。")}>
                AI（人工智能）重新评分
              </button>
            </div>
            <div className="creative-board">
              {snapshot.creatives.map((item) => {
                const avg = Math.round((item.hookScore + item.completionScore + item.clickScore + item.scaleScore) / 4);
                return (
                  <article className="creative-card" key={item.id}>
                    <header>
                      <strong>{item.title}</strong>
                      <span className="score-pill">{avg}</span>
                    </header>
                    <p>
                      {item.platform} · {countryLabel[item.country] ?? item.country} · {creativeStatusLabel[item.status] ?? item.status}
                    </p>
                    <TagRow
                      tags={[
                        `Hook（开头吸引力）${item.hookScore}`,
                        `Completion（完播）${item.completionScore}`,
                        `Click（点击）${item.clickScore}`,
                        `Scale（放量）${item.scaleScore}`,
                      ]}
                    />
                  </article>
                );
              })}
            </div>
          </>
        )}

        {view === "ads" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">广告驾驶舱</p>
                <h3>按素材、国家、人群、订单、利润评估真实价值</h3>
              </div>
              <button className="primary-button" onClick={() => showToast("预算建议已进入 AI（人工智能）确认中心，不会自动改广告预算。")}>
                生成预算建议
              </button>
            </div>
            <section className="panel">
              <DataRows
                wide
                columns={["素材", "国家", "花费", "收入", "毛利", "CPA（获客成本）", "ROAS（广告回报）", "AI（人工智能）决策"]}
                rows={snapshot.adMetrics.map((row) => [
                  row.creative,
                  countryLabel[row.country] ?? row.country,
                  money(row.spendCents),
                  money(row.revenueCents),
                  money(row.grossProfitCents),
                  money(row.cpaCents),
                  roas(row.roasBps),
                  row.recommendation,
                ])}
              />
            </section>
          </>
        )}

        {view === "supportHub" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">统一客服工作台 · Demo API（演示接口）</p>
                <h3>多渠道消息先统一接收，AI（人工智能）只托管低风险问题</h3>
              </div>
              <button className="primary-button" onClick={simulateSupportMessage}>
                模拟新消息
              </button>
            </div>

            {supportError && <div className="alert-strip">{supportError}</div>}

            <section className="support-summary-grid">
              {handoffItems.map((item) => (
                <article className="metric-card" key={item.label}>
                  <p className="eyebrow">{item.label}</p>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </article>
              ))}
            </section>

            <div className="support-layout">
              <section className="panel support-thread-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">消息队列</p>
                    <h3>按风险和成交机会排序</h3>
                  </div>
                  <span className="status-pill status-demo">{supportLoading ? "加载中" : "Demo API"}</span>
                </div>
                <div className="support-thread-list">
                  {supportThreads.map((thread) => (
                    <button
                      className={`support-thread-card ${thread.id === selectedSupportThread?.id ? "is-active" : ""}`}
                      key={thread.id}
                      onClick={() => setSelectedSupportThreadId(thread.id)}
                    >
                      <span className="support-channel">{supportChannelLabel[thread.channel]}</span>
                      <strong>{supportCustomers.find((item) => item.id === thread.customerId)?.displayName ?? thread.subject}</strong>
                      <small>{thread.subject}</small>
                      <span className={`status-pill risk-${thread.riskLevel}`}>{supportRiskLabel[thread.riskLevel]}</span>
                    </button>
                  ))}
                  {!supportThreads.length && <p className="muted">暂无客服会话。请先模拟新消息或检查 Demo API。</p>}
                </div>
              </section>

              <section className="panel support-detail-panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">AI（人工智能）草稿与人工接管</p>
                    <h3>自动回复只允许低风险引导</h3>
                  </div>
                  <span className="status-pill status-demo">
                    {selectedSupportThread ? supportStatusLabel[selectedSupportThread.status] : "未选择会话"}
                  </span>
                </div>

                {selectedSupportThread ? (
                  <article className="support-detail-card">
                    <header>
                      <div>
                        <p className="eyebrow">
                          {supportChannelLabel[selectedSupportThread.channel]} · {supportLanguageLabel[selectedSupportThread.language]}
                        </p>
                        <h3>{selectedSupportCustomer?.displayName ?? selectedSupportIdentity?.displayName ?? selectedSupportThread.subject}</h3>
                      </div>
                      <span className={`status-pill risk-${selectedSupportThread.riskLevel}`}>
                        {supportRiskLabel[selectedSupportThread.riskLevel]}
                      </span>
                    </header>
                    <div className="message-box">
                      <span>客户原文（Original message）</span>
                      <p>{selectedSupportMessage?.originalText ?? "暂无消息原文。"}</p>
                    </div>
                    <div className="message-box">
                      <span>中文翻译（Chinese translation）</span>
                      <p>
                        {selectedSupportTranslation?.translatedText ??
                          (selectedSupportThread.language === "zh-CN"
                            ? selectedSupportMessage?.originalText
                            : "暂无中文翻译；真实模式会写入 message_translations（消息翻译记录）。")}
                      </p>
                    </div>
                    <div className="message-box ai-draft">
                      <span>AI（人工智能）回复草稿</span>
                      <p>{selectedSupportDraft?.draftText ?? "尚未生成 AI（人工智能）回复草稿。"}</p>
                      {selectedSupportDraft && (
                        <small>{supportDraftReviewNote[selectedSupportDraft.id] ?? `中文审核说明：${selectedSupportDraft.reason}`}</small>
                      )}
                    </div>
                    <TagRow
                      tags={[
                        `状态：${supportStatusLabel[selectedSupportThread.status]}`,
                        selectedSupportThread.orderRef ? `订单号：${selectedSupportThread.orderRef}` : "订单号：未收集",
                        `自动发送：${selectedSupportDraft?.canAutoSend ? "允许低风险托管候选" : "不允许自动发送"}`,
                        `渠道账号：${selectedSupportIdentity?.externalUserId ?? "Demo 未绑定"}`,
                      ]}
                    />
                    <div className="support-next-action">
                      <strong>下一步：</strong>
                      <span>
                        {selectedSupportThread.riskLevel === "high"
                          ? "必须转人工，AI（人工智能）不允许承诺退款、补偿、取消订单或具体到达时间。"
                          : selectedSupportDraft?.canAutoSend
                            ? "低风险草稿可进入托管候选，但真实发送仍需记录到审计日志。"
                            : "先收集订单号、邮箱、截图和问题类型，再由客服确认。"}
                      </span>
                    </div>
                    <footer>
                      <button className="ghost-button" onClick={() => showToast("已标记转人工，客服上班后会在托管日报中优先处理。")}>
                        转人工
                      </button>
                      <button className="primary-button" onClick={generateSupportDraft}>
                        生成 AI（人工智能）草稿
                      </button>
                    </footer>
                  </article>
                ) : (
                  <article className="support-detail-card">
                    <p className="muted">请选择一条会话查看客户原文、中文翻译和 AI（人工智能）回复草稿。</p>
                  </article>
                )}
              </section>
            </div>

            <section className="panel handoff-panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">离线托管日报</p>
                  <h3>客服上班后先看这张清单</h3>
                </div>
                <button className="ghost-button" onClick={() => goTo("actions")}>
                  查看 AI（人工智能）审核
                </button>
              </div>
              {latestHandoffReport && <p className="muted">{latestHandoffReport.summary}</p>}
              <div className="handoff-grid">
                {[
                  ["今日优先处理", "物流延迟、退款诉求、生产能力确认，全部需要人工接管。"],
                  ["可继续托管", "欢迎语、询问订单号、收集邮箱、收集截图、说明客服上班时间。"],
                  ["禁止自动回复", "退款、补偿、改价、取消订单、承诺具体发货或到达时间。"],
                ].map(([title, detail]) => (
                  <article className="handoff-card" key={title}>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {view === "orders" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">订单物流中心</p>
                <h3>定制信息结构化与履约预警</h3>
              </div>
              <button className="primary-button" onClick={() => showToast("定制字段已结构化，异常订单进入客服队列。")}>
                结构化定制信息
              </button>
            </div>
            <div className="order-timeline">
              {snapshot.orders.map((item) => (
                <article className="order-step" key={item.id}>
                  <p className="eyebrow">{item.externalOrderId}</p>
                  <h3>{orderStatusLabel[item.fulfillmentStatus] ?? item.fulfillmentStatus}</h3>
                  <p>
                    {countryLabel[item.country] ?? item.country} · {item.channel} · {money(item.revenueCents)}
                  </p>
                  <TagRow
                    tags={[
                      item.customization.engraving ? `刻字：${item.customization.engraving}` : "刻字：无",
                      item.customization.color ? `颜色：${item.customization.color}` : "颜色：待确认",
                      item.customization.size ? `尺寸：${item.customization.size}` : "",
                      item.customization.imageRequired ? "需要图片确认" : "",
                      ...item.riskFlags.map((flag) => orderRiskLabel[flag] ?? `风险：${flag}`),
                    ]}
                  />
                </article>
              ))}
            </div>
          </>
        )}

        {view === "actions" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">人工审核 Human-in-the-loop（人在回路）</p>
                <h3>改预算、发消息、处理售后必须人工确认</h3>
              </div>
              <button className="primary-button" onClick={() => showToast("低风险动作可批量处理，高风险预算动作仍需老板确认。")}>
                批量处理低风险
              </button>
            </div>
            <div className="approval-list">
              {snapshot.aiActions.map((item) => (
                <article className="approval-card" key={item.id}>
                  <header>
                    <strong>{item.title}</strong>
                    <span className={`status-pill risk-${item.riskLevel}`}>{supportRiskLabel[item.riskLevel]}</span>
                  </header>
                  <p>{item.detail}</p>
                  <footer>
                    <button className="ghost-button" onClick={() => decideAction(item.id, "rejected")}>
                      驳回
                    </button>
                    <button className="primary-button" onClick={() => decideAction(item.id, "approved")}>
                      确认
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          </>
        )}

        {view === "privacy" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">GDPR（欧盟隐私合规）/ 审计</p>
                <h3>客户数据查询、删除、匿名化与审计</h3>
              </div>
              <button className="primary-button" onClick={createGdprRequest}>
                生成删除工单
              </button>
            </div>
            <section className="panel gdpr-tool">
              <label>
                <span>客户标识</span>
                <input value={gdprIdentity} onChange={(event) => setGdprIdentity(event.target.value)} placeholder="email（邮箱）/ phone（手机号）/ customerId（客户ID）" />
              </label>
              <label>
                <span>处理方式</span>
                <select value={gdprMode} onChange={(event) => setGdprMode(event.target.value as "anonymize" | "delete")}>
                  <option value="anonymize">匿名化保留订单统计</option>
                  <option value="delete">全链路删除个人数据</option>
                </select>
              </label>
              <div className="gdpr-result">
                <LockKeyhole size={18} />
                <span>将覆盖订单、客服、广告受众、AI（人工智能）训练样本和审计日志。</span>
              </div>
            </section>
          </>
        )}
      </main>

      <div className={`toast ${toast ? "is-visible" : ""}`}>{toast}</div>
    </div>
  );
}

function ConnectForm({ label, placeholder }: { label: string; placeholder: string }) {
  const [value, setValue] = useState("");
  return (
    <label className="connector-form">
      <span>{label}</span>
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function DataRows({ columns, rows, wide = false }: { columns: string[]; rows: string[][]; wide?: boolean }) {
  return (
    <div className={`data-table ${wide ? "is-wide" : ""}`}>
      <div className="table-row header" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div className="table-row" key={row.join("|")} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {row.map((cell, index) => (index === 0 ? <strong key={cell}>{cell}</strong> : <span key={`${cell}-${index}`}>{cell}</span>))}
        </div>
      ))}
    </div>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="tag-row">
      {tags.filter(Boolean).map((tag) => (
        <span className="tag" key={tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}
