import { NextResponse } from "next/server";
import { z } from "zod";
import { callProvider } from "@/lib/connectors/base";
import { requirePermission } from "@/lib/auth";
import { query } from "@/lib/db";
import { getDemoSnapshot } from "@/lib/demo-data";
import { getSupportRepositoryStatus, withSupportRepositoryStatus } from "@/lib/repositories/support-repository";
import type { IntegrationStatus, Provider } from "@/lib/types";

type IntegrationReadiness = {
  placeholderExample: string;
  requiredFields: string[];
  safeTestInputs: string[];
  forbiddenInputs: string[];
  allowedActions: string[];
  firstPhaseGoal: string;
  nextStepZh: string;
};

const integrationSchema = z.object({
  provider: z.enum(["shopify", "meta_ads", "tiktok_ads", "instagram_graph", "logistics", "support", "csv"]),
  accountRef: z.string().min(2),
});

const POSTGRES_DEMO_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const providerOrder: Provider[] = ["shopify", "meta_ads", "tiktok_ads", "instagram_graph", "logistics", "support"];
const providerSet = new Set<Provider>([...providerOrder, "csv"]);

type IntegrationRow = {
  id: string;
  provider: string;
  status: string;
  accountRef: string | null;
  lastSyncAt: Date | string | null;
  hasEncryptedSecret: boolean;
  rateLimitState: Record<string, unknown>;
  circuitState: Record<string, unknown>;
};

const providerReadiness: Record<Provider, IntegrationReadiness> = {
  shopify: {
    placeholderExample: "your-store.myshopify.com",
    requiredFields: ["店铺域名", "测试订单号", "商品 SKU 样例"],
    safeTestInputs: ["测试店铺域名", "SANDBOX 订单号", "演示商品 SKU"],
    forbiddenInputs: ["真实 Shopify Admin Token", "真实客户订单", "真实客户邮箱或手机号"],
    allowedActions: ["连接前置检查", "读取 Demo 订单样例", "整理字段映射"],
    firstPhaseGoal: "先验证独立站订单、客户、商品字段能进入统一数据模型。",
    nextStepZh: "先用测试店铺域名和假订单号做字段映射，不接真实店铺密钥。",
  },
  meta_ads: {
    placeholderExample: "act_1234567890",
    requiredFields: ["广告账户 ID", "币种", "时区", "测试日期范围"],
    safeTestInputs: ["演示广告账户 ID", "假投放数据", "测试日期范围"],
    forbiddenInputs: ["真实 Meta Access Token", "真实广告花费明细", "真实客户受众数据"],
    allowedActions: ["读取 Demo 广告指标", "整理 ROAS/CPA 字段", "标记素材表现风险"],
    firstPhaseGoal: "先验证广告驾驶舱需要哪些指标，不做真实广告账号写入。",
    nextStepZh: "先固化指标字段，再确认 Meta 官方权限和只读范围。",
  },
  tiktok_ads: {
    placeholderExample: "advertiser_id_123456789",
    requiredFields: ["Advertiser ID（广告主 ID）", "币种", "时区", "投放目标"],
    safeTestInputs: ["演示广告主 ID", "假素材 ID", "测试投放指标"],
    forbiddenInputs: ["真实 TikTok Ads Token", "真实消耗数据", "真实用户转化数据"],
    allowedActions: ["读取 Demo 投流指标", "整理素材和广告关联", "生成投流分析草稿"],
    firstPhaseGoal: "先把 TikTok 投流数据结构对齐素材投流中心。",
    nextStepZh: "先用假数据跑通字段，真实权限等二期再确认。",
  },
  instagram_graph: {
    placeholderExample: "17841400000000000",
    requiredFields: ["Business Account ID（商业账号 ID）", "内容类型", "互动指标", "测试日期范围"],
    safeTestInputs: ["演示商业账号 ID", "假帖子 ID", "测试互动数据"],
    forbiddenInputs: ["真实 Instagram Graph Token", "真实私信", "真实粉丝隐私数据"],
    allowedActions: ["读取 Demo 内容表现", "整理互动指标", "关联达人或素材记录"],
    firstPhaseGoal: "先验证社媒内容和素材表现如何进入运营看板。",
    nextStepZh: "先只做内容指标字段，不接真实私信。",
  },
  logistics: {
    placeholderExample: "SANDBOX-CARRIER-PROFILE",
    requiredFields: ["物流账号 / API Profile（接口配置）", "测试运单号", "承运商", "轨迹节点"],
    safeTestInputs: ["SANDBOX 运单号", "测试承运商", "假物流轨迹"],
    forbiddenInputs: ["真实物流 API 密钥", "真实客户收货地址", "真实手机号"],
    allowedActions: ["读取 Demo 物流轨迹", "标记异常包裹", "关联客服会话"],
    firstPhaseGoal: "先让客服能看到订单物流状态，减少人工查询。",
    nextStepZh: "先做假运单轨迹和异常状态，不连接真实物流账号。",
  },
  support: {
    placeholderExample: "support-workspace-demo",
    requiredFields: ["客服工作区", "渠道类型", "问题分类", "人工接管规则"],
    safeTestInputs: ["演示客服工作区", "模拟客户消息", "测试问题分类"],
    forbiddenInputs: ["真实客服账号密钥", "真实客户聊天记录", "个人微信自动化信息"],
    allowedActions: ["接收模拟消息", "生成 AI 草稿", "生成离线托管日报"],
    firstPhaseGoal: "先把独立站、表单、邮件等低难度渠道汇入统一客服台。",
    nextStepZh: "先接模拟渠道和邮件样例，高风险渠道只做权限清单。",
  },
  csv: {
    placeholderExample: "orders-demo.csv",
    requiredFields: ["文件名", "数据类型", "列名", "上传人"],
    safeTestInputs: ["Demo CSV 文件", "假订单号", "假邮箱 .test"],
    forbiddenInputs: ["真实客户 CSV", "真实收货地址", "真实手机号或邮箱"],
    allowedActions: ["上传 Demo 文件", "检查字段", "生成导入预览"],
    firstPhaseGoal: "先用 CSV 快速验证订单、物流、素材数据的字段结构。",
    nextStepZh: "先做上传前检查和字段预览，不导入真实客户文件。",
  },
};

const normalizeProvider = (provider: string): Provider | null => {
  return providerSet.has(provider as Provider) ? (provider as Provider) : null;
};

const normalizeStatus = (status: string): IntegrationStatus => {
  const allowedStatuses = new Set<IntegrationStatus>(["not_connected", "connected", "error", "rate_limited", "demo"]);
  return allowedStatuses.has(status as IntegrationStatus) ? (status as IntegrationStatus) : "error";
};

const buildCsvUpload = (dataState: "demo" | "postgres_sandbox", dataStateLabelZh: string) => ({
  enabled: true,
  provider: "csv",
  title: "CSV 上传（表格上传）",
  status: "waiting_upload",
  statusLabelZh: "等待上传",
  dataState,
  dataStateLabelZh,
  acceptedFormats: [".csv"],
  maxFileSizeMb: 10,
  requiredColumns: ["数据类型", "业务日期", "订单号或素材 ID", "金额或状态字段"],
  ...providerReadiness.csv,
});

const getIntegrationStaticInfo = (provider: Provider) => {
  const snapshotIntegration = getDemoSnapshot().integrations.find((item) => item.provider === provider);
  return {
    name: snapshotIntegration?.name ?? provider,
    hint: snapshotIntegration?.hint ?? "数据接入配置。",
    inputLabel: snapshotIntegration?.inputLabel ?? "账号标识",
  };
};

const readPostgresIntegrations = async () => {
  const rows = await query<IntegrationRow>(
    `
      select
        id::text as id,
        provider,
        status,
        account_ref as "accountRef",
        last_sync_at as "lastSyncAt",
        encrypted_secret is not null as "hasEncryptedSecret",
        rate_limit_state as "rateLimitState",
        circuit_state as "circuitState"
      from integrations
      where tenant_id = $1
      order by case provider
        when 'shopify' then 1
        when 'meta_ads' then 2
        when 'tiktok_ads' then 3
        when 'instagram_graph' then 4
        when 'logistics' then 5
        when 'support' then 6
        else 99
      end
    `,
    [POSTGRES_DEMO_TENANT_ID],
  );

  return rows
    .map((row) => {
      const provider = normalizeProvider(row.provider);
      if (!provider || provider === "csv") {
        return null;
      }

      return {
        id: row.id,
        provider,
        ...getIntegrationStaticInfo(provider),
        status: normalizeStatus(row.status),
        statusLabelZh: "Demo 连接",
        accountRef: row.accountRef,
        lastSyncAt: row.lastSyncAt ? new Date(row.lastSyncAt).toISOString() : null,
        hasEncryptedSecret: row.hasEncryptedSecret,
        dataState: "postgres_sandbox" as const,
        dataStateLabelZh: "PostgreSQL 沙箱数据",
        rateLimitState: row.rateLimitState,
        circuitState: row.circuitState,
        ...providerReadiness[provider],
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
};

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "integrations.manage");
  if (forbidden) return forbidden;

  const repositoryStatus = getSupportRepositoryStatus();
  if (repositoryStatus.activeMode === "postgres") {
    const integrations = await readPostgresIntegrations();
    const encryptedSecretCount = integrations.filter((integration) => integration.hasEncryptedSecret).length;

    return NextResponse.json(
      withSupportRepositoryStatus({
        mode: "postgres",
        source: "postgres_sandbox",
        note: "数据接入配置来自本地 PostgreSQL 沙箱 integrations 表，只用于验证字段、状态和护栏，不读取真实平台，不保存真实密钥。",
        summary: {
          totalIntegrations: integrations.length,
          demoConnections: integrations.filter((integration) => integration.status === "demo").length,
          realConnections: 0,
          csvUploadEnabled: true,
          writableRealPlatforms: 0,
          encryptedSecretCount,
        },
        integrations,
        csvUpload: buildCsvUpload("postgres_sandbox", "PostgreSQL 沙箱数据"),
        guardrails: {
          noRealSecrets: true,
          demoModeOnly: true,
          noRealPlatformWrite: true,
          noCustomerDataUpload: true,
          officialApiOnlyForRealIntegrations: true,
          manualReviewBeforeLiveMode: true,
        },
        auditEvents: [
          {
            id: `audit_integration_read_${Date.now()}`,
            action: "integrations.read",
            actorRef: "demo:admin",
            result: "postgres_sandbox_read",
            persistenceTable: "audit_logs",
            note: "当前只返回接口审计事件，未写入真实生产审计。",
            createdAt: new Date().toISOString(),
          },
        ],
        nextActions: [
          "先用 PostgreSQL 沙箱数据确认 6 个接入卡片的字段是否够用。",
          "真实平台连接必须先准备密钥加密、同步日志、失败重试和人工审核。",
          "当前接口不会读取 Shopify、Meta、TikTok、物流或客服平台的真实数据。",
        ],
      }),
    );
  }

  const snapshot = getDemoSnapshot();
  const integrations = snapshot.integrations.map((integration) => ({
    ...integration,
    statusLabelZh: "Demo 连接",
    dataState: "demo",
    dataStateLabelZh: "Demo 数据",
    ...providerReadiness[integration.provider],
  }));

  return NextResponse.json({
    mode: "demo",
    source: "demo_snapshot",
    note: "数据接入配置草案只用于准备字段和演示连接状态，不读取真实平台，不保存真实密钥。",
    summary: {
      totalIntegrations: integrations.length,
      demoConnections: integrations.filter((integration) => integration.status === "demo").length,
      realConnections: 0,
      csvUploadEnabled: true,
      writableRealPlatforms: 0,
    },
    integrations,
    csvUpload: buildCsvUpload("demo", "Demo 数据"),
    guardrails: {
      noRealSecrets: true,
      demoModeOnly: true,
      noRealPlatformWrite: true,
      noCustomerDataUpload: true,
      officialApiOnlyForRealIntegrations: true,
      manualReviewBeforeLiveMode: true,
    },
    nextActions: [
      "先用 Demo 数据确认 6 个接入卡片的字段是否够用。",
      "CSV 只允许上传假数据文件，真实客户数据等权限和审计完善后再处理。",
      "真实平台连接必须先准备官方 API 权限、密钥存储方案、审计日志和人工审核。",
    ],
  });
}

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "integrations.manage");
  if (forbidden) return forbidden;

  const body = integrationSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const result = await callProvider(
    {
      provider: body.data.provider,
      endpoint: "connection_probe",
      accountRef: body.data.accountRef,
    },
    async () => ({
      status: "connected",
      note: "Demo probe only. Replace fetcher after AS provides real API credentials.",
    }),
  );

  return NextResponse.json(result);
}
