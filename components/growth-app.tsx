"use client";

import {
  BadgeCheck,
  Bell,
  Bot,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileUp,
  Gauge,
  Globe2,
  Handshake,
  LockKeyhole,
  Megaphone,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Video,
  Watch,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { GrowthSnapshot, Provider } from "@/lib/types";

type ViewId =
  | "dashboard"
  | "integrations"
  | "creators"
  | "creatorDetail"
  | "creatives"
  | "ads"
  | "orders"
  | "actions"
  | "privacy";

type RoleId = "owner" | "bd" | "media" | "support" | "admin";

type GrowthAppProps = {
  initialSnapshot: GrowthSnapshot;
};

const views: Array<{ id: ViewId; label: string; icon: React.ReactNode }> = [
  { id: "dashboard", label: "经营看板", icon: <Gauge size={17} /> },
  { id: "integrations", label: "数据接入", icon: <Database size={17} /> },
  { id: "creators", label: "达人 CRM", icon: <Handshake size={17} /> },
  { id: "creatives", label: "内容中心", icon: <Video size={17} /> },
  { id: "ads", label: "广告驾驶舱", icon: <Megaphone size={17} /> },
  { id: "orders", label: "订单履约", icon: <PackageCheck size={17} /> },
  { id: "actions", label: "AI 确认中心", icon: <ClipboardCheck size={17} /> },
  { id: "privacy", label: "GDPR", icon: <ShieldCheck size={17} /> },
];

const titles: Record<ViewId, string> = {
  dashboard: "经营看板",
  integrations: "数据接入",
  creators: "达人 CRM",
  creatorDetail: "达人详情",
  creatives: "内容中心",
  ads: "广告驾驶舱",
  orders: "订单履约",
  actions: "AI 确认中心",
  privacy: "GDPR 合规",
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

const providerPlaceholders: Record<Provider, string> = {
  shopify: "store.myshopify.com",
  meta_ads: "act_********",
  tiktok_ads: "advertiser_id",
  instagram_graph: "business account id",
  logistics: "carrier api profile",
  support: "gorgias / zendesk workspace",
  csv: "csv",
};

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

const roas = (bps: number) => `${(bps / 10000).toFixed(2)}x`;
const percent = (bps: number) => `${(bps / 100).toFixed(1)}%`;

const creatorDetailByHandle = {
  "@watchwithmia": {
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
      { title: "3s close-up engraving hook", url: "TikTok draft / demo", organicViews: 52000, hookScore: 94, completionRateBps: 4100, adScaleScore: 91, adStatus: "test_pool", paidRevenueCents: 768000, grossProfitCents: 284000, spendCents: 182000 },
      { title: "Couple gift reveal", url: "TikTok draft / demo", organicViews: 28000, hookScore: 86, completionRateBps: 3600, adScaleScore: 83, adStatus: "testing", paidRevenueCents: 186000, grossProfitCents: 64000, spendCents: 61000 },
    ],
  },
  "@londonfits": {
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
      { title: "Minimal watch styling concept", url: "No video yet", organicViews: 0, hookScore: 0, completionRateBps: 0, adScaleScore: 0, adStatus: "not_ready", paidRevenueCents: 0, grossProfitCents: 0, spendCents: 0 },
    ],
  },
  "@timeless.au": {
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
      { title: "Unboxing and wrist shot", url: "TikTok published / demo", organicViews: 47000, hookScore: 82, completionRateBps: 3900, adScaleScore: 84, adStatus: "testing", paidRevenueCents: 248000, grossProfitCents: 91000, spendCents: 62000 },
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
  const [csvPreview, setCsvPreview] = useState("等待上传...");

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

  const refreshSnapshot = async () => {
    const response = await fetch("/api/snapshot", {
      headers: roleHeaders(),
    });
    setSnapshot((await response.json()) as GrowthSnapshot);
    showToast("经营快照已刷新。真实版会从队列同步平台数据。");
  };

  const connectProvider = async (provider: Provider, accountRef: string) => {
    const response = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...roleHeaders() },
      body: JSON.stringify({ provider, accountRef }),
    });
    if (!response.ok) {
      showToast("连接校验失败，请检查账号标识。");
      return;
    }
    showToast("连接探测成功。真实密钥会由后端加密存储。");
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

  const createGdprRequest = async () => {
    const response = await fetch("/api/gdpr", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...roleHeaders() },
      body: JSON.stringify({ identity: gdprIdentity, mode: gdprMode }),
    });
    const result = (await response.json()) as { id?: string; affectedSystems?: string[] };
    showToast(result.id ? `GDPR 工单已创建：覆盖 ${result.affectedSystems?.length ?? 0} 个系统。` : "请先输入有效客户标识。");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Watch size={24} />
          </div>
          <div>
            <p className="eyebrow">ATOMI SHINE</p>
            <h1>AI Growth OS</h1>
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
            <strong>{liveMode ? "Live Mode" : "Demo Mode"}</strong>
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
              <option value="owner">老板 / GM</option>
              <option value="bd">BD / 达人运营</option>
              <option value="media">投流 / Media Buyer</option>
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
            <p className="eyebrow">Short video → creators → ads → store → fulfillment</p>
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
                <p className="eyebrow">全链路 AI 增长驾驶台</p>
                <h3>先用模拟数据看见增长闭环，再把平台账号接进真实经营系统。</h3>
                <p>每条 AI 建议都回到 GMV、ROAS、CPA、毛利和履约风险。改预算、发达人消息、售后回复默认进入人工确认。</p>
              </div>
              <div className="signal-stack">
                <div className="signal-card">
                  <Sparkles />
                  <span>AI Action</span>
                  <strong>{snapshot.aiActions.length}</strong>
                </div>
                <div className="signal-card">
                  <Bell />
                  <span>High Risk</span>
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
                  columns={["国家", "花费", "收入", "毛利", "CPA", "ROAS"]}
                  rows={snapshot.countryMetrics.map((row) => [
                    row.country,
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
                    <p className="eyebrow">AI 每日建议</p>
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
                        <span className={`status-pill risk-${item.riskLevel}`}>{item.riskLevel}</span>
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
            <div className="section-head">
              <div>
                <p className="eyebrow">Live Mode 准备区</p>
                <h3>客户填入平台或账号数据即可替换 Demo 数据</h3>
              </div>
            </div>
            <div className="connector-grid">
              {snapshot.integrations.map((item) => (
                <article className="connector-card" key={item.id}>
                  <header>
                    <div>
                      <p className="eyebrow">{item.provider}</p>
                      <h3>{item.name}</h3>
                    </div>
                    <span className="status-pill status-demo">{item.status}</span>
                  </header>
                  <p className="muted">{item.hint}</p>
                  <ConnectForm provider={item.provider} placeholder={providerPlaceholders[item.provider]} onConnect={connectProvider} />
                </article>
              ))}
            </div>
            <section className="panel upload-panel">
              <div>
                <p className="eyebrow">无 API 时的过渡方案</p>
                <h3>上传 CSV 先跑分析</h3>
                <p className="muted">支持订单、广告、达人、素材四类 CSV 映射。正式 API 接入前，也能展示真实经营诊断。</p>
              </div>
              <label className="file-drop">
                <FileUp />
                <span>选择 CSV 文件</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    setCsvPreview(text.split(/\r?\n/).slice(0, 6).join("\n") || "CSV 为空");
                    showToast("CSV 已读取，可进入字段映射与数据校验流程。");
                  }}
                />
              </label>
              <pre>{csvPreview}</pre>
            </section>
          </>
        )}

        {view === "creators" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">Creator CRM</p>
                <h3>达人发现、评分、建联、寄样、ROI 复盘</h3>
              </div>
              <button className="primary-button" onClick={() => showToast("已生成英文 DM 草稿，等待 BD 确认后发送。")}>
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
                    {item.platform} · {item.country} · {item.followers.toLocaleString("en-US")} followers
                  </p>
                  <p>{item.status}</p>
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
                <p className="eyebrow">Creator Detail</p>
                <h3>{selectedCreator.handle} 合作链路</h3>
              </div>
              <div className="topbar-actions">
                <button className="ghost-button" onClick={() => goTo("creators")}>
                  返回达人列表
                </button>
                <button className="primary-button" onClick={() => goTo("ads")}>
                  查看完整广告 ROI
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
                  {selectedCreator.platform} · {selectedCreator.country} · {selectedCreator.followers.toLocaleString("en-US")} followers ·{" "}
                  {selectedCreator.status}
                </p>
                <p>{selectedCreatorDetail.recommendation}</p>
                <TagRow tags={selectedCreator.tags} />
              </section>

              <section className="panel">
                <p className="eyebrow">下一步 BD 动作</p>
                <h3>{selectedCreatorDetail.nextAction}</h3>
                <div className="approval-card inline-action">
                  <strong>建议动作</strong>
                  <p>生成 follow-up / 授权确认 / 寄样提醒，进入人工确认后再发送。</p>
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
                  <h3>达人视频先变成 Creative Asset，再进入广告测试</h3>
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
                      <span className="status-pill status-demo">{video.adStatus}</span>
                    </header>
                    <p>{video.url}</p>
                    <TagRow
                      tags={[
                        `Organic ${video.organicViews.toLocaleString("en-US")}`,
                        `Hook ${video.hookScore}`,
                        `完播 ${percent(video.completionRateBps)}`,
                        `Scale ${video.adScaleScore}`,
                      ]}
                    />
                    <div className="roi-strip">
                      <span>Spend {money(video.spendCents)}</span>
                      <span>Paid GMV {money(video.paidRevenueCents)}</span>
                      <span>Gross Profit {money(video.grossProfitCents)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">达人 ROI 摘要</p>
                  <h3>完整广告 ROI 仍在广告驾驶舱统一分析</h3>
                </div>
                <button className="primary-button" onClick={() => goTo("ads")}>
                  查看完整广告 ROI
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
                  <span>自然 GMV</span>
                  <strong>{money(selectedCreatorDetail.organicRevenueCents)}</strong>
                </article>
                <article>
                  <span>投流 GMV</span>
                  <strong>{money(selectedCreatorDetail.paidRevenueCents)}</strong>
                </article>
                <article>
                  <span>毛利 ROI</span>
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
                <p className="eyebrow">Creative Center</p>
                <h3>短视频素材评分与投流池</h3>
              </div>
              <button className="primary-button" onClick={() => showToast("素材评分已更新，高分素材进入投流池。")}>
                AI 重新评分
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
                      {item.platform} · {item.country} · {item.status}
                    </p>
                    <TagRow tags={[`Hook ${item.hookScore}`, `Completion ${item.completionScore}`, `Click ${item.clickScore}`, `Scale ${item.scaleScore}`]} />
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
                <p className="eyebrow">Ads Cockpit</p>
                <h3>按素材、国家、人群、订单、利润评估真实价值</h3>
              </div>
              <button className="primary-button" onClick={() => showToast("预算建议已进入 AI 确认中心，不会自动改广告预算。")}>
                生成预算建议
              </button>
            </div>
            <section className="panel">
              <DataRows
                wide
                columns={["素材", "国家", "花费", "收入", "毛利", "CPA", "ROAS", "AI 决策"]}
                rows={snapshot.adMetrics.map((row) => [
                  row.creative,
                  row.country,
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

        {view === "orders" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">Order Center</p>
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
                  <h3>{item.fulfillmentStatus}</h3>
                  <p>
                    {item.country} · {item.channel} · {money(item.revenueCents)}
                  </p>
                  <TagRow tags={[item.customization.engraving ?? "no engraving", item.customization.color ?? "color pending", ...item.riskFlags]} />
                </article>
              ))}
            </div>
          </>
        )}

        {view === "actions" && (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">Human-in-the-loop</p>
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
                    <span className={`status-pill risk-${item.riskLevel}`}>{item.status}</span>
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
                <p className="eyebrow">GDPR & Audit</p>
                <h3>客户数据查询、删除、匿名化与审计</h3>
              </div>
              <button className="primary-button" onClick={createGdprRequest}>
                生成删除工单
              </button>
            </div>
            <section className="panel gdpr-tool">
              <label>
                <span>客户标识</span>
                <input value={gdprIdentity} onChange={(event) => setGdprIdentity(event.target.value)} placeholder="email / phone / customerId" />
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
                <span>将覆盖订单、客服、广告受众、AI 训练样本和审计日志。</span>
              </div>
            </section>
          </>
        )}
      </main>

      <div className={`toast ${toast ? "is-visible" : ""}`}>{toast}</div>
    </div>
  );
}

function ConnectForm({
  provider,
  placeholder,
  onConnect,
}: {
  provider: Provider;
  placeholder: string;
  onConnect: (provider: Provider, accountRef: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <label className="connector-form">
      <span>账号或连接标识</span>
      <div>
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
        <button onClick={() => onConnect(provider, value)} type="button" aria-label="连接">
          <ChevronRight size={18} />
        </button>
      </div>
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
