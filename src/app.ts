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

type RoleConfig = {
  label: string;
  badge: string;
  description: string;
  defaultView: ViewId;
  allowedViews: ViewId[];
  homeTitle: string;
  actions: Array<{ title: string; detail: string; target: ViewId; cta: string }>;
};

type CountryCode = "US" | "UK" | "DE" | "FR" | "CA" | "AU";

type IntegrationProvider =
  | "shopify"
  | "meta_ads"
  | "tiktok_ads"
  | "instagram"
  | "logistics"
  | "support";

type IntegrationStatus = "demo" | "connected" | "error";

type Integration = {
  id: string;
  provider: IntegrationProvider;
  name: string;
  hint: string;
  status: IntegrationStatus;
  placeholder: string;
};

type Kpi = {
  label: string;
  value: string;
  delta: string;
  direction: "up" | "down";
};

type CountryMetric = {
  country: CountryCode;
  spendCents: number;
  revenueCents: number;
  cpaCents: number;
  roasBps: number;
};

type Creator = {
  handle: string;
  platform: "TikTok" | "Instagram";
  country: CountryCode;
  followers: number;
  aiScore: number;
  status: string;
  tags: string[];
};

type CreatorVideo = {
  id: string;
  title: string;
  url: string;
  organicViews: number;
  hookScore: number;
  completionRateBps: number;
  adScaleScore: number;
  adStatus: "not_ready" | "test_pool" | "testing" | "scaling";
  paidRevenueCents: number;
  grossProfitCents: number;
  spendCents: number;
};

type CreatorDetail = {
  creatorId: string;
  recommendation: string;
  nextAction: string;
  totalCostCents: number;
  sampleCostCents: number;
  creatorFeeCents: number;
  organicRevenueCents: number;
  paidRevenueCents: number;
  grossProfitCents: number;
  roiBps: number;
  journey: string[];
  videos: CreatorVideo[];
};

type Creative = {
  title: string;
  source: "organic" | "creator" | "ad";
  hookScore: number;
  completionScore: number;
  clickScore: number;
  scaleScore: number;
  status: string;
};

type AdMetric = {
  creative: string;
  country: CountryCode;
  spendCents: number;
  revenueCents: number;
  grossProfitCents: number;
  cpaCents: number;
  roasBps: number;
  decision: string;
};

type Approval = {
  title: string;
  risk: "low" | "medium" | "high";
  owner: "老板" | "BD" | "投流" | "客服";
  detail: string;
};

type SupportRisk = "low" | "medium" | "high";

type SupportThread = {
  id: string;
  channel: "独立站客服" | "独立站留言" | "邮件" | "飞书提醒";
  customer: string;
  language: "中文" | "英文";
  status: "AI 托管中" | "待人工接管" | "可发草稿";
  risk: SupportRisk;
  lastMessage: string;
  translated: string;
  aiDraft: string;
  collected: string[];
  nextAction: string;
  orderRef?: string;
};

const viewTitles: Record<ViewId, string> = {
  dashboard: "经营看板",
  integrations: "数据接入",
  creators: "达人 BD",
  creatorDetail: "达人详情",
  creatives: "内容中心",
  ads: "广告驾驶舱",
  supportHub: "统一客服工作台",
  orders: "订单履约",
  actions: "AI 确认中心",
  privacy: "GDPR 合规",
};

let currentRole: RoleId = "owner";

const roleConfigs: Record<RoleId, RoleConfig> = {
  owner: {
    label: "老板 / 经营者",
    badge: "成交额 / 投产比",
    description: "经营者视图：看 GMV、真实 ROAS、预算风险和高影响动作。",
    defaultView: "dashboard",
    allowedViews: ["dashboard", "supportHub", "creators", "creatorDetail", "ads", "orders", "actions"],
    homeTitle: "老板今日决策台",
    actions: [
      { title: "确认 US 广告预算 +20%", detail: "真实毛利 ROAS 4.22x，但会增加日消耗，需要老板确认。", target: "actions", cta: "去确认" },
      { title: "查看夜间客服风险", detail: "AI 离线托管收集了 6 条潜在成交和 2 条售后风险，需客服上班后接管。", target: "supportHub", cta: "看客服日报" },
      { title: "复盘达人投流回本", detail: "@watchwithmia 已产生投流 GMV，可判断是否续约。", target: "creators", cta: "看达人 ROI" },
    ],
  },
  bd: {
    label: "BD / 达人运营",
    badge: "Creator Tasks",
    description: "BD 视图：看达人待办、建联话术、寄样、授权和视频产出。",
    defaultView: "creators",
    allowedViews: ["dashboard", "creators", "creatorDetail", "creatives", "actions"],
    homeTitle: "BD 今日达人待办",
    actions: [
      { title: "发送 @londonfits 首封 DM", detail: "AI 已准备个性化英文建联话术，发送前需人工确认。", target: "actions", cta: "处理话术" },
      { title: "确认 @watchwithmia 寄样地址", detail: "样品未确认会影响视频产出节奏。", target: "creatorDetail", cta: "看合作链路" },
      { title: "归档已授权视频", detail: "已授权素材需要进入内容中心，供投流团队测试。", target: "creatives", cta: "看内容中心" },
    ],
  },
  media: {
    label: "投流 / 广告投手",
    badge: "CPA / Creative",
    description: "投流视图：看素材、国家、人群、CPA、真实毛利 ROAS 和预算动作。",
    defaultView: "ads",
    allowedViews: ["dashboard", "creatives", "ads", "actions"],
    homeTitle: "投流今日操作台",
    actions: [
      { title: "放量 Luxury gift under $100", detail: "US 真实 ROAS 4.22x，建议小幅加预算并继续观察。", target: "actions", cta: "确认预算" },
      { title: "暂停 DE 低效素材", detail: "CPA 高于目标，AI 建议重剪前 3 秒。", target: "ads", cta: "看素材表现" },
      { title: "从达人视频生成广告测试", detail: "高分 Creator Asset 可复制到 US / CA 测试池。", target: "creatives", cta: "看素材池" },
    ],
  },
  support: {
    label: "客服 / 履约",
    badge: "客服 / 订单",
    description: "客服视图：看统一消息、AI 草稿、离线托管日报、订单物流、售后风险和 GDPR 请求。",
    defaultView: "supportHub",
    allowedViews: ["dashboard", "supportHub", "orders", "actions", "privacy"],
    homeTitle: "客服今日处理台",
    actions: [
      { title: "处理离线托管日报", detail: "昨晚 AI 只回复低风险问题，并收集订单号、邮箱、截图和问题类型。", target: "supportHub", cta: "看统一客服" },
      { title: "确认 AS-1028 刻字信息", detail: "客户刻字疑似需要二次确认，AI 已准备英文回复草稿。", target: "orders", cta: "看订单" },
      { title: "处理 UK 物流延迟", detail: "AS-1041 出现 carrier delay，需要提前安抚客户。", target: "actions", cta: "处理售后" },
    ],
  },
  admin: {
    label: "管理员 / 系统",
    badge: "Access / Audit",
    description: "管理员视图：看平台接入、权限、同步状态、合规和审计。",
    defaultView: "integrations",
    allowedViews: ["dashboard", "integrations", "supportHub", "creators", "creatorDetail", "creatives", "ads", "orders", "actions", "privacy"],
    homeTitle: "系统管理员控制台",
    actions: [
      { title: "配置平台连接", detail: "API token 只进后端，前端只显示连接状态。", target: "integrations", cta: "接入平台" },
      { title: "检查客服托管边界", detail: "确认 AI 不会自动承诺退款、补偿、改价、取消订单或发送真实消息。", target: "supportHub", cta: "看客服规则" },
      { title: "检查 AI 动作审计", detail: "预算、发信、客服回复都必须留下确认记录。", target: "actions", cta: "看动作" },
    ],
  },
};

const integrations: Integration[] = [
  { id: "shopify", provider: "shopify", name: "Shopify / 独立站", hint: "同步订单、商品、客户、退款和店铺 webhook。", status: "demo", placeholder: "your-store.myshopify.com" },
  { id: "meta", provider: "meta_ads", name: "Meta Ads", hint: "同步广告花费、素材、国家、人群和归因数据。", status: "demo", placeholder: "act_1234567890" },
  { id: "tiktok", provider: "tiktok_ads", name: "TikTok Ads", hint: "同步短视频投流、广告组、素材表现和转化数据。", status: "demo", placeholder: "advertiser_id_123456" },
  { id: "instagram", provider: "instagram", name: "Instagram Graph", hint: "同步达人资料、互动表现、授权内容和主页线索。", status: "demo", placeholder: "instagram_business_account_id" },
  { id: "logistics", provider: "logistics", name: "物流 API", hint: "同步生产、发货、签收、异常轨迹和售后预警。", status: "demo", placeholder: "carrier_profile_or_api_account" },
  { id: "support", provider: "support", name: "客服系统", hint: "同步定制确认、售后消息、满意度和人工接管记录。", status: "demo", placeholder: "zendesk_or_gorgias_workspace" },
];

const kpis: Kpi[] = [
  { label: "GMV", value: "$184,260", delta: "+18.4% vs last 7d", direction: "up" },
  { label: "真实 ROAS", value: "3.42x", delta: "+0.31 after profit sync", direction: "up" },
  { label: "CPA", value: "$28.60", delta: "-12.1% in US / CA", direction: "up" },
  { label: "待人工确认", value: "9", delta: "3 high impact actions", direction: "down" },
];

const countries: CountryMetric[] = [
  { country: "US", spendCents: 426000, revenueCents: 1689000, cpaCents: 2860, roasBps: 39600 },
  { country: "CA", spendCents: 138000, revenueCents: 496000, cpaCents: 2460, roasBps: 35900 },
  { country: "UK", spendCents: 210000, revenueCents: 642000, cpaCents: 3180, roasBps: 30600 },
  { country: "AU", spendCents: 126000, revenueCents: 354000, cpaCents: 3320, roasBps: 28100 },
  { country: "DE", spendCents: 104000, revenueCents: 244000, cpaCents: 4120, roasBps: 23500 },
  { country: "FR", spendCents: 97000, revenueCents: 212000, cpaCents: 4380, roasBps: 21900 },
];

const creators: Creator[] = [
  { handle: "@watchwithmia", platform: "TikTok", country: "US", followers: 184000, aiScore: 92, status: "寄样待确认", tags: ["gift guide", "couple", "custom watch"] },
  { handle: "@londonfits", platform: "Instagram", country: "UK", followers: 96000, aiScore: 86, status: "待发送 DM", tags: ["men style", "minimal", "ugc"] },
  { handle: "@timeless.au", platform: "TikTok", country: "AU", followers: 142000, aiScore: 81, status: "已授权素材", tags: ["unboxing", "wrist shot", "holiday"] },
  { handle: "@montreparis", platform: "Instagram", country: "FR", followers: 73000, aiScore: 74, status: "需二次跟进", tags: ["fashion", "couple gift", "engraving"] },
  { handle: "@de.stylelab", platform: "TikTok", country: "DE", followers: 121000, aiScore: 79, status: "等待报价", tags: ["streetwear", "premium", "male"] },
  { handle: "@northgift", platform: "Instagram", country: "CA", followers: 68000, aiScore: 88, status: "内容已发布", tags: ["holiday gifts", "ugc", "couples"] },
];

let selectedCreatorId = creators[0]?.handle ?? "";

const creatorDetails: CreatorDetail[] = [
  {
    creatorId: "@watchwithmia",
    recommendation: "建议进入小预算广告测试池。内容方向与 US 情侣礼物和定制腕表高度匹配，评论区购买意图强。",
    nextAction: "BD 确认寄样地址和素材授权范围，投流同事准备 US 小预算测试计划。",
    totalCostCents: 61000,
    sampleCostCents: 11000,
    creatorFeeCents: 50000,
    organicRevenueCents: 132000,
    paidRevenueCents: 768000,
    grossProfitCents: 284000,
    roiBps: 46500,
    journey: ["发现达人", "AI 评分 92", "生成英文 DM", "人工确认发送", "寄样待确认", "素材授权待签", "视频脚本确认", "发布后进入投流池"],
    videos: [
      { id: "v1", title: "3s close-up engraving hook", url: "TikTok draft / demo", organicViews: 52000, hookScore: 94, completionRateBps: 4100, adScaleScore: 91, adStatus: "test_pool", paidRevenueCents: 768000, grossProfitCents: 284000, spendCents: 182000 },
      { id: "v2", title: "Couple gift reveal", url: "TikTok draft / demo", organicViews: 28000, hookScore: 86, completionRateBps: 3600, adScaleScore: 83, adStatus: "testing", paidRevenueCents: 186000, grossProfitCents: 64000, spendCents: 61000 },
    ],
  },
  {
    creatorId: "@londonfits",
    recommendation: "建议先完成英文 DM 和报价确认，不直接进入投流。达人风格适合 UK 男士礼物，但缺少授权素材。",
    nextAction: "BD 发送首封 DM，确认是否接受样品置换或低预算 UGC 合作。",
    totalCostCents: 0,
    sampleCostCents: 0,
    creatorFeeCents: 0,
    organicRevenueCents: 0,
    paidRevenueCents: 0,
    grossProfitCents: 0,
    roiBps: 0,
    journey: ["发现达人", "AI 评分 86", "待生成 DM", "等待回复", "报价确认", "寄样", "视频发布", "ROI 复盘"],
    videos: [
      { id: "v3", title: "Minimal watch styling concept", url: "No video yet", organicViews: 0, hookScore: 0, completionRateBps: 0, adScaleScore: 0, adStatus: "not_ready", paidRevenueCents: 0, grossProfitCents: 0, spendCents: 0 },
    ],
  },
  {
    creatorId: "@timeless.au",
    recommendation: "建议保留素材授权，先在 AU 做低预算测试，再根据 CPA 决定是否复制到 CA。",
    nextAction: "投流同事创建 AU 测试广告组，BD 跟进二次合作报价。",
    totalCostCents: 43000,
    sampleCostCents: 10000,
    creatorFeeCents: 33000,
    organicRevenueCents: 82000,
    paidRevenueCents: 248000,
    grossProfitCents: 91000,
    roiBps: 21200,
    journey: ["发现达人", "AI 评分 81", "已建联", "已寄样", "已授权素材", "视频已发布", "进入 AU 测试", "等待 ROI 复盘"],
    videos: [
      { id: "v4", title: "Unboxing and wrist shot", url: "TikTok published / demo", organicViews: 47000, hookScore: 82, completionRateBps: 3900, adScaleScore: 84, adStatus: "testing", paidRevenueCents: 248000, grossProfitCents: 91000, spendCents: 62000 },
    ],
  },
];

const creatives: Creative[] = [
  { title: "3s close-up engraving hook", source: "creator", hookScore: 94, completionScore: 86, clickScore: 82, scaleScore: 91, status: "进入投流池" },
  { title: "His & hers anniversary reveal", source: "organic", hookScore: 88, completionScore: 79, clickScore: 85, scaleScore: 84, status: "小预算测试" },
  { title: "Factory customization process", source: "organic", hookScore: 66, completionScore: 72, clickScore: 58, scaleScore: 61, status: "AI 给优化建议" },
  { title: "Luxury gift under $100", source: "ad", hookScore: 90, completionScore: 83, clickScore: 89, scaleScore: 93, status: "建议放量" },
];

const ads: AdMetric[] = [
  { creative: "Luxury gift under $100", country: "US", spendCents: 182000, revenueCents: 768000, grossProfitCents: 284000, cpaCents: 2590, roasBps: 42200, decision: "预算 +20%，需确认" },
  { creative: "3s close-up engraving hook", country: "CA", spendCents: 62000, revenueCents: 248000, grossProfitCents: 91000, cpaCents: 2210, roasBps: 40000, decision: "复制到 US lookalike" },
  { creative: "Factory customization process", country: "DE", spendCents: 54000, revenueCents: 96000, grossProfitCents: 22000, cpaCents: 4870, roasBps: 17800, decision: "暂停并重剪前 3 秒" },
  { creative: "His & hers anniversary reveal", country: "UK", spendCents: 79000, revenueCents: 236000, grossProfitCents: 78000, cpaCents: 3120, roasBps: 29900, decision: "保留，测试新落地页" },
];

const approvals: Approval[] = [
  { title: "Meta US Campaign 预算 +20%", risk: "high", owner: "老板", detail: "基于真实毛利 ROAS 4.22x，但会增加日消耗 $360，需要人工确认。" },
  { title: "给 @londonfits 发送英文 DM", risk: "medium", owner: "BD", detail: "AI 已生成个性化话术，发送前需确认品牌口吻和样品承诺。" },
  { title: "暂停 DE 低效素材", risk: "low", owner: "投流", detail: "CPA 高于目标 38%，素材 3 秒吸引力低于 70 分。" },
  { title: "订单 AS-1028 定制信息确认", risk: "medium", owner: "客服", detail: "客户刻字字段疑似包含拼写错误，建议发确认邮件。" },
];

const supportThreads: SupportThread[] = [
  {
    id: "thread-livechat-01",
    channel: "独立站客服",
    customer: "Emily R.",
    language: "英文",
    status: "AI 托管中",
    risk: "low",
    lastMessage: "Can I get this watch with a short engraving for my husband?",
    translated: "我能不能给我丈夫买这块表，并刻一段短文字？",
    aiDraft: "可以的。请把想刻的英文内容发给我们，并确认收货国家。客服上班后会再次帮您确认刻字格式。",
    collected: ["购买意向：礼物", "语言：英文", "需求：刻字", "缺少：国家和邮箱"],
    nextAction: "继续收集邮箱、国家和刻字内容，暂不承诺具体发货时间。",
  },
  {
    id: "thread-email-02",
    channel: "邮件",
    customer: "AS-1041 / Mark",
    language: "英文",
    status: "待人工接管",
    risk: "high",
    lastMessage: "My package is late. I want a refund if it does not arrive tomorrow.",
    translated: "我的包裹延迟了。如果明天不到，我想退款。",
    aiDraft: "我已经记录您的订单和物流问题。退款、补偿和具体到达时间需要人工客服核实后处理，客服上班后会优先跟进。",
    collected: ["订单号：AS-1041", "问题类型：物流延迟", "诉求：可能退款", "风险：退款承诺"],
    nextAction: "转人工，核对物流轨迹和退款政策。AI 禁止承诺退款或补偿。",
    orderRef: "AS-1041",
  },
  {
    id: "thread-form-03",
    channel: "独立站留言",
    customer: "Lina / Germany",
    language: "英文",
    status: "可发草稿",
    risk: "medium",
    lastMessage: "Do you ship to Germany and can I pay by PayPal?",
    translated: "你们发德国吗？可以用 PayPal 付款吗？",
    aiDraft: "我们已收到您的咨询。请留下邮箱，客服会确认当前德国可用配送方式和付款方式后回复您。",
    collected: ["国家：德国", "问题：配送和付款方式", "缺少：邮箱"],
    nextAction: "客服确认德国配送和付款方式后发送正式回复。",
  },
  {
    id: "thread-feishu-04",
    channel: "飞书提醒",
    customer: "内部提醒 / 店铺表单",
    language: "中文",
    status: "待人工接管",
    risk: "medium",
    lastMessage: "客户上传了刻字截图，图片内容需要确认是否能生产。",
    translated: "客户上传了刻字截图，图片内容需要确认是否能生产。",
    aiDraft: "已记录图片确认需求。需要客服和生产同事共同确认后再回复客户。",
    collected: ["问题：图片定制确认", "需要：生产确认", "风险：生产能力承诺"],
    nextAction: "客服把截图转给生产确认，不允许 AI 直接承诺可以生产。",
    orderRef: "AS-1028",
  },
];

const handoffItems = [
  { label: "离线会话", value: "14", detail: "独立站 8 条，邮件 4 条，表单 2 条" },
  { label: "潜在成交", value: "6", detail: "礼物刻字、德国配送、PayPal 咨询优先处理" },
  { label: "售后风险", value: "2", detail: "物流延迟和退款诉求必须人工接管" },
  { label: "AI 自动回复", value: "9", detail: "全部为低风险欢迎、收集信息、上班时间说明" },
];

let selectedSupportThreadId = supportThreads[0]?.id ?? "";

const fmtMoney = (cents: number): string => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmtRoas = (bps: number): string => `${(bps / 10000).toFixed(2)}x`;
const fmtPercent = (bps: number): string => `${(bps / 100).toFixed(1)}%`;

const $ = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const showToast = (message: string): void => {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
};

const switchView = (view: ViewId): void => {
  if (!roleConfigs[currentRole].allowedViews.includes(view)) {
    showToast(`${roleConfigs[currentRole].label} 暂无该模块权限。`);
    view = roleConfigs[currentRole].defaultView;
  }
  document.querySelectorAll(".view").forEach((node) => node.classList.remove("is-visible"));
  document.querySelectorAll(".nav-item").forEach((node) => node.classList.remove("is-active"));
  $(`#${view}`).classList.add("is-visible");
  document.querySelector<HTMLButtonElement>(`.nav-item[data-view="${view}"]`)?.classList.add("is-active");
  $("#viewTitle").textContent = viewTitles[view];
  document.body.dataset.currentView = view;
};

const renderRoleHome = (): void => {
  const config = roleConfigs[currentRole];
  $("#roleHomeTitle").textContent = config.homeTitle;
  $("#roleHomeBadge").textContent = config.badge;
  $("#roleDescription").textContent = config.description;
  $("#roleActionGrid").innerHTML = config.actions
    .map(
      (item) => `
      <article class="role-action-card">
        <strong>${item.title}</strong>
        <p>${item.detail}</p>
        <button class="ghost-button" data-view-link="${item.target}">${item.cta}</button>
      </article>
    `,
    )
    .join("");
};

const applyRole = (role: RoleId, keepCurrentView = false): void => {
  currentRole = role;
  const config = roleConfigs[role];
  document.querySelectorAll<HTMLElement>(".nav-item[data-view]").forEach((item) => {
    const itemView = item.dataset.view as ViewId;
    const allowed = config.allowedViews.includes(itemView);
    item.hidden = !allowed;
  });
  renderRoleHome();
  const visibleView = document.querySelector(".view.is-visible")?.id as ViewId | undefined;
  const nextView = keepCurrentView && visibleView && config.allowedViews.includes(visibleView) ? visibleView : config.defaultView;
  switchView(nextView);
};

const renderKpis = (): void => {
  $("#kpiGrid").innerHTML = kpis
    .map(
      (item) => `
      <article class="metric-card">
        <p class="eyebrow">${item.label}</p>
        <strong>${item.value}</strong>
        <small class="${item.direction === "up" ? "trend-up" : "trend-down"}">${item.delta}</small>
      </article>
    `,
    )
    .join("");
};

const renderCountries = (): void => {
  $("#countryTable").innerHTML = `
    <div class="table-row header"><span>国家</span><span>花费</span><span>收入</span><span>CPA</span><span>ROAS</span></div>
    ${countries
      .map(
        (row) => `
      <div class="table-row">
        <strong>${row.country}</strong>
        <span>${fmtMoney(row.spendCents)}</span>
        <span>${fmtMoney(row.revenueCents)}</span>
        <span>${fmtMoney(row.cpaCents)}</span>
        <span>${fmtRoas(row.roasBps)}</span>
      </div>
    `,
      )
      .join("")}
  `;
};

const renderActions = (): void => {
  $("#dailyActions").innerHTML = approvals
    .slice(0, 3)
    .map(
      (item) => `
      <article class="approval-card">
        <header>
          <strong>${item.title}</strong>
          <span class="status-pill status-${item.risk === "low" ? "connected" : "demo"}">${item.owner}</span>
        </header>
        <p>${item.detail}</p>
      </article>
    `,
    )
    .join("");
};

const renderConnectors = (): void => {
  const saved = JSON.parse(localStorage.getItem("atomi.integrations") || "{}") as Record<string, string>;
  $("#connectorGrid").innerHTML = integrations
    .map((item) => {
      const value = saved[item.id] || "";
      return `
        <article class="connector-card">
          <div class="section-head">
            <div>
              <h3>${item.name}</h3>
            </div>
            <span class="status-pill status-demo">Demo</span>
          </div>
          <p class="muted">${item.hint}</p>
          <label>
            <span>账号或连接标识</span>
            <input data-integration="${item.id}" value="${value}" placeholder="${item.placeholder}" />
          </label>
        </article>
      `;
    })
    .join("");
};

const renderCreators = (): void => {
  $("#creatorGrid").innerHTML = creators
    .map(
      (item) => `
      <article class="data-card">
        <header>
          <strong>${item.handle}</strong>
          <span class="status-pill status-demo">${item.aiScore}</span>
        </header>
        <p class="muted">${item.platform} · ${item.country} · ${item.followers.toLocaleString("en-US")} followers</p>
        <p>${item.status}</p>
        <div class="score-bar"><span style="width:${item.aiScore}%"></span></div>
        <div class="tag-row">${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
        <button class="ghost-button card-action" data-creator-detail="${item.handle}">查看合作链路</button>
      </article>
    `,
    )
    .join("");
};

const renderCreatorDetail = (creatorId = selectedCreatorId): void => {
  selectedCreatorId = creatorId;
  const creator = creators.find((item) => item.handle === creatorId) ?? creators[0];
  const detail = creatorDetails.find((item) => item.creatorId === creator.handle) ?? creatorDetails[0];
  $("#creatorDetailTitle").textContent = `${creator.handle} 合作链路`;
  $("#creatorDetailBody").innerHTML = `
    <div class="creator-detail-grid">
      <section class="panel creator-profile">
        <div class="section-head">
          <div>
            <p class="eyebrow">达人概览</p>
            <h3>${creator.handle}</h3>
          </div>
          <span class="score-pill">${creator.aiScore}/100</span>
        </div>
        <p class="muted">${creator.platform} · ${creator.country} · ${creator.followers.toLocaleString("en-US")} followers · ${creator.status}</p>
        <p>${detail.recommendation}</p>
        <div class="tag-row">${creator.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      </section>

      <section class="panel">
        <p class="eyebrow">下一步 BD 动作</p>
        <h3>${detail.nextAction}</h3>
        <div class="approval-card inline-action">
          <strong>建议动作</strong>
          <p>生成 follow-up / 授权确认 / 寄样提醒，进入人工确认后再发送。</p>
          <button class="primary-button" id="creatorNextAction">生成下一步话术</button>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">BD 动作流</p>
          <h3>从发现到视频产出</h3>
        </div>
      </div>
      <div class="journey-track">
        ${detail.journey.map((step, index) => `<div class="journey-step"><span>${index + 1}</span><strong>${step}</strong></div>`).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">视频产出与投流联动</p>
          <h3>达人视频先变成 Creative Asset，再进入广告测试</h3>
        </div>
        <button class="ghost-button" data-view-link="creatives">查看内容中心</button>
      </div>
      <div class="video-grid">
        ${detail.videos
          .map(
            (video) => `
          <article class="creative-card">
            <header>
              <strong>${video.title}</strong>
              <span class="status-pill status-demo">${video.adStatus}</span>
            </header>
            <p>${video.url}</p>
            <div class="tag-row">
              <span class="tag">Organic ${video.organicViews.toLocaleString("en-US")}</span>
              <span class="tag">Hook ${video.hookScore}</span>
              <span class="tag">完播 ${fmtPercent(video.completionRateBps)}</span>
              <span class="tag">Scale ${video.adScaleScore}</span>
            </div>
            <div class="roi-strip">
              <span>Spend ${fmtMoney(video.spendCents)}</span>
              <span>Paid GMV ${fmtMoney(video.paidRevenueCents)}</span>
              <span>Gross Profit ${fmtMoney(video.grossProfitCents)}</span>
            </div>
          </article>
        `,
          )
          .join("")}
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">达人 ROI 摘要</p>
          <h3>完整广告 ROI 仍在广告驾驶舱统一分析</h3>
        </div>
        <button class="primary-button" data-view-link="ads">查看完整广告 ROI</button>
      </div>
      <div class="roi-summary">
        <article><span>总成本</span><strong>${fmtMoney(detail.totalCostCents)}</strong></article>
        <article><span>寄样成本</span><strong>${fmtMoney(detail.sampleCostCents)}</strong></article>
        <article><span>达人费用</span><strong>${fmtMoney(detail.creatorFeeCents)}</strong></article>
        <article><span>自然 GMV</span><strong>${fmtMoney(detail.organicRevenueCents)}</strong></article>
        <article><span>投流 GMV</span><strong>${fmtMoney(detail.paidRevenueCents)}</strong></article>
        <article><span>毛利 ROI</span><strong>${fmtRoas(detail.roiBps)}</strong></article>
      </div>
    </section>
  `;

  $("#creatorNextAction").addEventListener("click", () => {
    showToast("已生成 BD 下一步话术，发送前仍需人工确认。");
  });
};

const renderCreatives = (): void => {
  $("#creativeBoard").innerHTML = creatives
    .map((item) => {
      const avg = Math.round((item.hookScore + item.completionScore + item.clickScore + item.scaleScore) / 4);
      return `
        <article class="creative-card">
          <header>
            <strong>${item.title}</strong>
            <span class="status-pill status-${avg >= 85 ? "connected" : "demo"}">${avg}</span>
          </header>
          <p>${item.status}</p>
          <div class="tag-row">
            <span class="tag">Hook ${item.hookScore}</span>
            <span class="tag">Completion ${item.completionScore}</span>
            <span class="tag">Click ${item.clickScore}</span>
            <span class="tag">Scale ${item.scaleScore}</span>
          </div>
        </article>
      `;
    })
    .join("");
};

const renderAds = (): void => {
  $("#adTable").innerHTML = `
    <div class="table-row header"><span>素材</span><span>国家</span><span>花费</span><span>收入</span><span>毛利</span><span>CPA</span><span>ROAS</span><span>AI 决策</span></div>
    ${ads
      .map(
        (row) => `
      <div class="table-row">
        <strong>${row.creative}</strong>
        <span>${row.country}</span>
        <span>${fmtMoney(row.spendCents)}</span>
        <span>${fmtMoney(row.revenueCents)}</span>
        <span>${fmtMoney(row.grossProfitCents)}</span>
        <span>${fmtMoney(row.cpaCents)}</span>
        <span>${fmtRoas(row.roasBps)}</span>
        <span>${row.decision}</span>
      </div>
    `,
      )
      .join("")}
  `;
};

const renderSupportHub = (threadId = selectedSupportThreadId): void => {
  selectedSupportThreadId = threadId;
  const activeThread = supportThreads.find((item) => item.id === selectedSupportThreadId) ?? supportThreads[0];
  const riskClass = activeThread.risk === "high" ? "error" : activeThread.risk === "low" ? "connected" : "demo";

  $("#supportOverview").innerHTML = handoffItems
    .map(
      (item) => `
      <article class="metric-card">
        <p class="eyebrow">${item.label}</p>
        <strong>${item.value}</strong>
        <small>${item.detail}</small>
      </article>
    `,
    )
    .join("");

  $("#supportThreads").innerHTML = supportThreads
    .map((item) => {
      const itemRiskClass = item.risk === "high" ? "error" : item.risk === "low" ? "connected" : "demo";
      return `
        <button class="support-thread-card ${item.id === activeThread.id ? "is-active" : ""}" data-support-thread="${item.id}">
          <span class="support-channel">${item.channel}</span>
          <strong>${item.customer}</strong>
          <small>${item.translated}</small>
          <span class="status-pill status-${itemRiskClass}">${item.risk === "high" ? "高风险" : item.risk === "medium" ? "中风险" : "低风险"}</span>
        </button>
      `;
    })
    .join("");

  $("#supportDetail").innerHTML = `
    <article class="support-detail-card">
      <header>
        <div>
          <p class="eyebrow">${activeThread.channel} · ${activeThread.language}</p>
          <h3>${activeThread.customer}</h3>
        </div>
        <span class="status-pill status-${riskClass}">${activeThread.status}</span>
      </header>

      <div class="message-box">
        <span>客户原文</span>
        <p>${activeThread.lastMessage}</p>
      </div>
      <div class="message-box">
        <span>精准口语翻译</span>
        <p>${activeThread.translated}</p>
      </div>
      <div class="message-box ai-draft">
        <span>AI 回复草稿</span>
        <p>${activeThread.aiDraft}</p>
      </div>

      <div class="collected-list">
        ${activeThread.collected.map((item) => `<span>${item}</span>`).join("")}
      </div>

      <div class="support-next-action">
        <strong>下一步：</strong>
        <span>${activeThread.nextAction}</span>
      </div>

      <footer>
        <button class="ghost-button" data-escalate-support="${activeThread.id}">转人工</button>
        <button class="primary-button" data-draft-support="${activeThread.id}">保存草稿</button>
      </footer>
    </article>
  `;

  $("#handoffReport").innerHTML = [
    ["今日优先处理", "物流延迟、退款诉求、生产能力确认，全部需要人工接管。"],
    ["可继续托管", "欢迎语、询问订单号、收集邮箱、收集截图、说明客服上班时间。"],
    ["禁止自动回复", "退款、补偿、改价、取消订单、承诺具体发货或到达时间。"],
  ]
    .map(
      ([title, detail]) => `
      <article class="handoff-card">
        <strong>${title}</strong>
        <p>${detail}</p>
      </article>
    `,
    )
    .join("");
};

const renderOrders = (): void => {
  const steps = [
    ["下单", "订单与渠道归因入库，金额用整数分存储。"],
    ["定制确认", "AI 抽取图案、刻字、颜色、尺寸，异常字段进入客服待办。"],
    ["生产与质检", "生产状态和图片文件进入 S3，CloudFront 分发给客服预览。"],
    ["物流与售后", "物流 API 追踪签收，延迟、丢件、退货风险自动预警。"],
  ];
  $("#orderTimeline").innerHTML = steps
    .map(
      ([title, detail]) => `
      <article class="order-step">
        <p class="eyebrow">${title}</p>
        <h3>${title}</h3>
        <p>${detail}</p>
      </article>
    `,
    )
    .join("");
};

const renderApprovals = (): void => {
  $("#approvalList").innerHTML = approvals
    .map(
      (item) => `
      <article class="approval-card">
        <header>
          <strong>${item.title}</strong>
          <span class="status-pill status-${item.risk === "high" ? "error" : item.risk === "low" ? "connected" : "demo"}">${item.risk}</span>
        </header>
        <p>${item.owner} · ${item.detail}</p>
        <footer>
          <button class="ghost-button" data-reject="${item.title}">驳回</button>
          <button class="primary-button" data-approve="${item.title}">确认</button>
        </footer>
      </article>
    `,
    )
    .join("");
};

const bindEvents = (): void => {
  document.querySelectorAll<HTMLElement>("[data-view], [data-view-link]").forEach((node) => {
    node.addEventListener("click", () => {
      const view = (node.dataset.view || node.dataset.viewLink) as ViewId;
      switchView(view);
    });
  });

  $("#modeToggle").addEventListener("change", (event) => {
    const live = (event.target as HTMLInputElement).checked;
    $("#modeLabel").textContent = live ? "真实模式" : "Demo 模式";
    showToast(live ? "已切换真实模式：请先完成平台连接和权限配置。" : "已切回 Demo 模式：使用模拟数据演示。");
  });

  $("#roleSelect").addEventListener("change", (event) => {
    const role = (event.target as HTMLSelectElement).value as RoleId;
    applyRole(role);
    showToast(`已切换为 ${roleConfigs[role].label} 视图。`);
  });

  $("#saveIntegrations").addEventListener("click", () => {
    const values: Record<string, string> = {};
    document.querySelectorAll<HTMLInputElement>("[data-integration]").forEach((input) => {
      values[input.dataset.integration || ""] = input.value.trim();
    });
    localStorage.setItem("atomi.integrations", JSON.stringify(values));
    renderConnectors();
    showToast("连接信息已保存到本地演示环境。真实版需后端加密存储 secrets。");
  });

  $("#csvInput").addEventListener("change", async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = text.split(/\r?\n/).slice(0, 6).join("\n");
    $("#csvPreview").textContent = rows || "CSV 为空";
    showToast("CSV 已读取，可进入字段映射与数据校验流程。");
  });

  $("#refreshButton").addEventListener("click", () => showToast("模拟数据已刷新。真实版会触发受限速保护的同步任务。"));
  $("#generateDm").addEventListener("click", () => showToast("已生成英文 DM 草稿，等待 BD 确认后发送。"));
  $("#scoreCreative").addEventListener("click", () => showToast("素材评分已更新，高分素材进入投流池。"));
  $("#draftBudget").addEventListener("click", () => showToast("预算建议已进入 AI 确认中心，不会自动改广告预算。"));
  $("#probeIntegrations").addEventListener("click", () => showToast("已进入连接准备流程。真实版会跳转官方授权页，Demo 不会写入真实密钥。"));
  $("#simulateSupportMessage").addEventListener("click", () => showToast("已模拟一条独立站客服消息进入队列，真实版需走渠道 webhook 和审计日志。"));
  $("#structureOrders").addEventListener("click", () => showToast("定制字段已结构化，异常订单进入客服队列。"));
  $("#approveAll").addEventListener("click", () => showToast("低风险动作已批准，高风险预算动作仍需老板确认。"));
  $("#runGdpr").addEventListener("click", () => {
    const identity = ($("#gdprIdentity") as HTMLInputElement).value.trim();
    const mode = ($("#gdprMode") as HTMLSelectElement).value;
    $("#gdprResult").textContent = identity
      ? `已为 ${identity} 创建 GDPR ${mode === "delete" ? "全链路删除" : "匿名化"}工单：将覆盖订单、客服、广告受众、AI 训练样本和审计日志。`
      : "请先输入 email / phone / customerId。";
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const actionTarget =
      target.closest<HTMLElement>(
        "[data-approve], [data-reject], [data-creator-detail], [data-view-link], [data-support-thread], [data-draft-support], [data-escalate-support]",
      ) ?? target;
    const approved = actionTarget.dataset.approve;
    const rejected = actionTarget.dataset.reject;
    const creatorId = actionTarget.dataset.creatorDetail;
    const viewLink = actionTarget.dataset.viewLink as ViewId | undefined;
    const supportThreadId = actionTarget.dataset.supportThread;
    const supportDraftId = actionTarget.dataset.draftSupport;
    const supportEscalateId = actionTarget.dataset.escalateSupport;
    if (approved) showToast(`已确认：${approved}`);
    if (rejected) showToast(`已驳回：${rejected}`);
    if (viewLink) switchView(viewLink);
    if (supportThreadId) renderSupportHub(supportThreadId);
    if (supportDraftId) showToast("AI 回复草稿已保存，真实发送前必须由客服确认。");
    if (supportEscalateId) showToast("已标记转人工，客服上班后会在托管日报中优先处理。");
    if (creatorId) {
      renderCreatorDetail(creatorId);
      switchView("creatorDetail");
    }
  });
};

const init = (): void => {
  renderKpis();
  renderCountries();
  renderActions();
  renderConnectors();
  renderCreators();
  renderCreatorDetail();
  renderCreatives();
  renderAds();
  renderSupportHub();
  renderOrders();
  renderApprovals();
  applyRole(currentRole, true);
  bindEvents();
};

init();
