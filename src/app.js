const viewTitles = {
  dashboard: "经营看板",
  integrations: "数据接入",
  creators: "达人 CRM",
  creatorDetail: "达人详情",
  creatives: "内容中心",
  ads: "广告驾驶舱",
  orders: "订单履约",
  actions: "AI 确认中心",
  privacy: "GDPR",
};

let currentRole = "owner";

const roleConfigs = {
  owner: {
    label: "老板 / GM",
    badge: "GMV / ROAS",
    description: "经营者视图：看 GMV、真实 ROAS、预算风险和高影响动作。",
    defaultView: "dashboard",
    allowedViews: ["dashboard", "creators", "creatorDetail", "ads", "orders", "actions"],
    homeTitle: "老板今日决策台",
    actions: [
      { title: "确认 US 广告预算 +20%", detail: "真实毛利 ROAS 4.22x，但会增加日消耗，需要老板确认。", target: "actions", cta: "去确认" },
      { title: "复盘达人投流回本", detail: "@watchwithmia 已产生投流 GMV，可判断是否续约。", target: "creators", cta: "看达人 ROI" },
      { title: "查看国家利润排行", detail: "US / CA 当前 CPA 更低，DE / FR 需要控制测试预算。", target: "ads", cta: "看广告驾驶舱" },
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
    label: "投流 / Media Buyer",
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
    badge: "Orders / GDPR",
    description: "客服视图：看定制确认、生产物流、售后风险和 GDPR 请求。",
    defaultView: "orders",
    allowedViews: ["dashboard", "orders", "actions", "privacy"],
    homeTitle: "客服今日履约台",
    actions: [
      { title: "确认 AS-1028 刻字信息", detail: "客户刻字疑似需要二次确认，AI 已准备英文回复草稿。", target: "orders", cta: "看订单" },
      { title: "处理 UK 物流延迟", detail: "AS-1041 出现 carrier delay，需要提前安抚客户。", target: "actions", cta: "处理售后" },
      { title: "创建 GDPR 工单", detail: "支持 email / phone / customerId 查询后删除或匿名化。", target: "privacy", cta: "去 GDPR" },
    ],
  },
  admin: {
    label: "管理员 / 系统",
    badge: "Access / Audit",
    description: "管理员视图：看平台接入、权限、同步状态、合规和审计。",
    defaultView: "integrations",
    allowedViews: ["dashboard", "integrations", "creators", "creatorDetail", "creatives", "ads", "orders", "actions", "privacy"],
    homeTitle: "系统管理员控制台",
    actions: [
      { title: "配置平台连接", detail: "API token 只进后端，前端只显示连接状态。", target: "integrations", cta: "接入平台" },
      { title: "检查 AI 动作审计", detail: "预算、发信、客服回复都必须留下确认记录。", target: "actions", cta: "看动作" },
      { title: "验证 GDPR 删除链路", detail: "覆盖订单、客服、广告受众、AI 样本和审计日志。", target: "privacy", cta: "看合规" },
    ],
  },
};

const integrations = [
  { id: "shopify", provider: "shopify", name: "Shopify / 独立站", hint: "订单、商品、客户、退款 webhook", status: "demo", placeholder: "store.myshopify.com" },
  { id: "meta", provider: "meta_ads", name: "Meta Ads", hint: "广告花费、素材、国家、人群", status: "demo", placeholder: "act_********" },
  { id: "tiktok", provider: "tiktok_ads", name: "TikTok Ads", hint: "短视频投流与素材表现", status: "demo", placeholder: "advertiser_id" },
  { id: "instagram", provider: "instagram", name: "Instagram Graph", hint: "达人资料、互动、授权内容", status: "demo", placeholder: "business account id" },
  { id: "logistics", provider: "logistics", name: "物流 API", hint: "生产、发货、签收、异常轨迹", status: "demo", placeholder: "carrier api profile" },
  { id: "support", provider: "support", name: "客服系统", hint: "定制确认、售后、满意度", status: "demo", placeholder: "gorgias / zendesk" },
];

const kpis = [
  { label: "GMV", value: "$184,260", delta: "+18.4% vs last 7d", direction: "up" },
  { label: "真实 ROAS", value: "3.42x", delta: "+0.31 after profit sync", direction: "up" },
  { label: "CPA", value: "$28.60", delta: "-12.1% in US / CA", direction: "up" },
  { label: "待人工确认", value: "9", delta: "3 high impact actions", direction: "down" },
];

const countries = [
  { country: "US", spendCents: 426000, revenueCents: 1689000, cpaCents: 2860, roasBps: 39600 },
  { country: "CA", spendCents: 138000, revenueCents: 496000, cpaCents: 2460, roasBps: 35900 },
  { country: "UK", spendCents: 210000, revenueCents: 642000, cpaCents: 3180, roasBps: 30600 },
  { country: "AU", spendCents: 126000, revenueCents: 354000, cpaCents: 3320, roasBps: 28100 },
  { country: "DE", spendCents: 104000, revenueCents: 244000, cpaCents: 4120, roasBps: 23500 },
  { country: "FR", spendCents: 97000, revenueCents: 212000, cpaCents: 4380, roasBps: 21900 },
];

const creators = [
  { handle: "@watchwithmia", platform: "TikTok", country: "US", followers: 184000, aiScore: 92, status: "寄样待确认", tags: ["gift guide", "couple", "custom watch"] },
  { handle: "@londonfits", platform: "Instagram", country: "UK", followers: 96000, aiScore: 86, status: "待发送 DM", tags: ["men style", "minimal", "ugc"] },
  { handle: "@timeless.au", platform: "TikTok", country: "AU", followers: 142000, aiScore: 81, status: "已授权素材", tags: ["unboxing", "wrist shot", "holiday"] },
  { handle: "@montreparis", platform: "Instagram", country: "FR", followers: 73000, aiScore: 74, status: "需二次跟进", tags: ["fashion", "couple gift", "engraving"] },
  { handle: "@de.stylelab", platform: "TikTok", country: "DE", followers: 121000, aiScore: 79, status: "等待报价", tags: ["streetwear", "premium", "male"] },
  { handle: "@northgift", platform: "Instagram", country: "CA", followers: 68000, aiScore: 88, status: "内容已发布", tags: ["holiday gifts", "ugc", "couples"] },
];

let selectedCreatorId = creators[0]?.handle || "";

const creatorDetails = [
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

const creatives = [
  { title: "3s close-up engraving hook", source: "creator", hookScore: 94, completionScore: 86, clickScore: 82, scaleScore: 91, status: "进入投流池" },
  { title: "His & hers anniversary reveal", source: "organic", hookScore: 88, completionScore: 79, clickScore: 85, scaleScore: 84, status: "小预算测试" },
  { title: "Factory customization process", source: "organic", hookScore: 66, completionScore: 72, clickScore: 58, scaleScore: 61, status: "AI 给优化建议" },
  { title: "Luxury gift under $100", source: "ad", hookScore: 90, completionScore: 83, clickScore: 89, scaleScore: 93, status: "建议放量" },
];

const ads = [
  { creative: "Luxury gift under $100", country: "US", spendCents: 182000, revenueCents: 768000, grossProfitCents: 284000, cpaCents: 2590, roasBps: 42200, decision: "预算 +20%，需确认" },
  { creative: "3s close-up engraving hook", country: "CA", spendCents: 62000, revenueCents: 248000, grossProfitCents: 91000, cpaCents: 2210, roasBps: 40000, decision: "复制到 US lookalike" },
  { creative: "Factory customization process", country: "DE", spendCents: 54000, revenueCents: 96000, grossProfitCents: 22000, cpaCents: 4870, roasBps: 17800, decision: "暂停并重剪前 3 秒" },
  { creative: "His & hers anniversary reveal", country: "UK", spendCents: 79000, revenueCents: 236000, grossProfitCents: 78000, cpaCents: 3120, roasBps: 29900, decision: "保留，测试新落地页" },
];

const approvals = [
  { title: "Meta US Campaign 预算 +20%", risk: "high", owner: "老板", detail: "基于真实毛利 ROAS 4.22x，但会增加日消耗 $360，需要人工确认。" },
  { title: "给 @londonfits 发送英文 DM", risk: "medium", owner: "BD", detail: "AI 已生成个性化话术，发送前需确认品牌口吻和样品承诺。" },
  { title: "暂停 DE 低效素材", risk: "low", owner: "投流", detail: "CPA 高于目标 38%，素材 3 秒吸引力低于 70 分。" },
  { title: "订单 AS-1028 定制信息确认", risk: "medium", owner: "客服", detail: "客户刻字字段疑似包含拼写错误，建议发确认邮件。" },
];

const fmtMoney = (cents) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmtRoas = (bps) => `${(bps / 10000).toFixed(2)}x`;
const fmtPercent = (bps) => `${(bps / 100).toFixed(1)}%`;

const $ = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const showToast = (message) => {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
};

const switchView = (view) => {
  if (!roleConfigs[currentRole].allowedViews.includes(view)) {
    showToast(`${roleConfigs[currentRole].label} 暂无该模块权限。`);
    view = roleConfigs[currentRole].defaultView;
  }
  document.querySelectorAll(".view").forEach((node) => node.classList.remove("is-visible"));
  document.querySelectorAll(".nav-item").forEach((node) => node.classList.remove("is-active"));
  $(`#${view}`).classList.add("is-visible");
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add("is-active");
  $("#viewTitle").textContent = viewTitles[view];
};

const renderRoleHome = () => {
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

const applyRole = (role, keepCurrentView = false) => {
  currentRole = role;
  const config = roleConfigs[role];
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    const itemView = item.dataset.view;
    const allowed = config.allowedViews.includes(itemView);
    item.hidden = !allowed;
  });
  renderRoleHome();
  const visibleView = document.querySelector(".view.is-visible")?.id;
  const nextView = keepCurrentView && visibleView && config.allowedViews.includes(visibleView) ? visibleView : config.defaultView;
  switchView(nextView);
};

const renderKpis = () => {
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

const renderCountries = () => {
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

const renderActions = () => {
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

const renderConnectors = () => {
  const saved = JSON.parse(localStorage.getItem("atomi.integrations") || "{}");
  $("#connectorGrid").innerHTML = integrations
    .map((item) => {
      const value = saved[item.id] || "";
      const status = value ? "connected" : item.status;
      return `
        <article class="connector-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">${item.provider}</p>
              <h3>${item.name}</h3>
            </div>
            <span class="status-pill status-${status === "connected" ? "connected" : "demo"}">${status}</span>
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

const renderCreators = () => {
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

const renderCreatorDetail = (creatorId = selectedCreatorId) => {
  selectedCreatorId = creatorId;
  const creator = creators.find((item) => item.handle === creatorId) || creators[0];
  const detail = creatorDetails.find((item) => item.creatorId === creator.handle) || creatorDetails[0];
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

const renderCreatives = () => {
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

const renderAds = () => {
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

const renderOrders = () => {
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

const renderApprovals = () => {
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

const bindEvents = () => {
  document.querySelectorAll("[data-view], [data-view-link]").forEach((node) => {
    node.addEventListener("click", () => {
      const view = node.dataset.view || node.dataset.viewLink;
      switchView(view);
    });
  });

  $("#modeToggle").addEventListener("change", (event) => {
    const live = event.target.checked;
    $("#modeLabel").textContent = live ? "Live Mode" : "Demo Mode";
    showToast(live ? "已切换 Live Mode：请先完成平台连接。" : "已切回 Demo Mode：使用模拟数据演示。");
  });

  $("#roleSelect").addEventListener("change", (event) => {
    const role = event.target.value;
    applyRole(role);
    showToast(`已切换为 ${roleConfigs[role].label} 视图。`);
  });

  $("#saveIntegrations").addEventListener("click", () => {
    const values = {};
    document.querySelectorAll("[data-integration]").forEach((input) => {
      values[input.dataset.integration || ""] = input.value.trim();
    });
    localStorage.setItem("atomi.integrations", JSON.stringify(values));
    renderConnectors();
    showToast("连接信息已保存到本地演示环境。真实版需后端加密存储 secrets。");
  });

  $("#csvInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
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
  $("#structureOrders").addEventListener("click", () => showToast("定制字段已结构化，异常订单进入客服队列。"));
  $("#approveAll").addEventListener("click", () => showToast("低风险动作已批准，高风险预算动作仍需老板确认。"));
  $("#runGdpr").addEventListener("click", () => {
    const identity = $("#gdprIdentity").value.trim();
    const mode = $("#gdprMode").value;
    $("#gdprResult").textContent = identity
      ? `已为 ${identity} 创建 GDPR ${mode === "delete" ? "全链路删除" : "匿名化"}工单：将覆盖订单、客服、广告受众、AI 训练样本和审计日志。`
      : "请先输入 email / phone / customerId。";
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    const approved = target.dataset?.approve;
    const rejected = target.dataset?.reject;
    const creatorId = target.dataset?.creatorDetail;
    const viewLink = target.dataset?.viewLink;
    if (approved) showToast(`已确认：${approved}`);
    if (rejected) showToast(`已驳回：${rejected}`);
    if (viewLink) switchView(viewLink);
    if (creatorId) {
      renderCreatorDetail(creatorId);
      switchView("creatorDetail");
    }
  });
};

const init = () => {
  renderKpis();
  renderCountries();
  renderActions();
  renderConnectors();
  renderCreators();
  renderCreatorDetail();
  renderCreatives();
  renderAds();
  renderOrders();
  renderApprovals();
  applyRole(currentRole, true);
  bindEvents();
};

init();
