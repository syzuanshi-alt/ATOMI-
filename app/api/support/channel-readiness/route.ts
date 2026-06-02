import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getSupportRepositoryStatus, withSupportRepositoryStatus } from "@/lib/repositories/support-repository";
import type { SupportChannel, SupportRiskLevel } from "@/lib/types";

type ChannelDifficulty = "low" | "medium" | "high";
type ChannelPhase = "phase_1_test" | "phase_2_prepare" | "phase_3_official_permission";
type ChannelReadinessStatus =
  | "ready_for_demo"
  | "needs_config"
  | "official_permission_required"
  | "blocked_for_phase_1";

type ChannelReadiness = {
  id: SupportChannel;
  displayNameZh: string;
  englishNameZh: string;
  difficulty: ChannelDifficulty;
  difficultyLabelZh: string;
  riskLevel: SupportRiskLevel;
  riskLabelZh: string;
  phase: ChannelPhase;
  phaseLabelZh: string;
  status: ChannelReadinessStatus;
  statusLabelZh: string;
  businessGoal: string;
  requiredInputs: string[];
  missingInputs: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  acceptanceCriteria: string[];
  nextStepZh: string;
};

const difficultyLabels: Record<ChannelDifficulty, string> = {
  low: "低难度",
  medium: "中等难度",
  high: "高难度",
};

const riskLabels: Record<SupportRiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

const phaseLabels: Record<ChannelPhase, string> = {
  phase_1_test: "一期测试",
  phase_2_prepare: "二期准备",
  phase_3_official_permission: "三期官方权限",
};

const statusLabels: Record<ChannelReadinessStatus, string> = {
  ready_for_demo: "可进入 Demo 测试",
  needs_config: "需要先准备配置",
  official_permission_required: "需要官方接口权限",
  blocked_for_phase_1: "一期暂不接入",
};

const buildChannel = (
  channel: Omit<
    ChannelReadiness,
    "difficultyLabelZh" | "riskLabelZh" | "phaseLabelZh" | "statusLabelZh"
  >,
): ChannelReadiness => ({
  ...channel,
  difficultyLabelZh: difficultyLabels[channel.difficulty],
  riskLabelZh: riskLabels[channel.riskLevel],
  phaseLabelZh: phaseLabels[channel.phase],
  statusLabelZh: statusLabels[channel.status],
});

const channels: ChannelReadiness[] = [
  buildChannel({
    id: "independent_site_chat",
    displayNameZh: "独立站在线客服",
    englishNameZh: "Website Live Chat（网站在线聊天）",
    difficulty: "low",
    riskLevel: "low",
    phase: "phase_1_test",
    status: "ready_for_demo",
    businessGoal: "先模拟独立站访客咨询进入统一客服工作台，用来验证 AI 托管、翻译、草稿和人工接管流程。",
    requiredInputs: ["独立站测试页面地址", "演示客服入口位置", "测试用访客昵称", "测试问题样例"],
    missingInputs: ["真实聊天插件密钥暂不需要", "真实客户资料暂不需要"],
    allowedActions: ["接收模拟消息", "生成 AI 回复草稿", "标记风险等级", "生成离线托管日报"],
    forbiddenActions: ["连接真实客户聊天账号", "自动发送真实客户消息", "保存真实客户隐私数据"],
    acceptanceCriteria: ["模拟消息可进入统一客服会话", "低风险问题能生成草稿", "高风险内容进入人工审核", "所有动作有审计记录"],
    nextStepZh: "先做模拟入口和固定测试问题，不接真实插件。",
  }),
  buildChannel({
    id: "independent_site_form",
    displayNameZh: "独立站表单/留言",
    englishNameZh: "Website Form（网站表单）",
    difficulty: "low",
    riskLevel: "low",
    phase: "phase_1_test",
    status: "ready_for_demo",
    businessGoal: "把留言、询盘、售后表单统一进入客服中台，先验证字段收集和人工跟进顺序。",
    requiredInputs: ["表单字段清单", "问题类型选项", "测试邮箱或测试手机号格式", "截图上传规则"],
    missingInputs: ["真实表单 webhook 密钥暂不需要", "真实客户联系方式暂不需要"],
    allowedActions: ["接收模拟表单", "按问题类型分流", "生成跟进摘要", "写入 Demo 审计"],
    forbiddenActions: ["写入真实客户资料", "绕过人工审核关闭售后问题", "承诺退款或补偿"],
    acceptanceCriteria: ["表单字段能映射到客户会话", "缺失联系方式时 AI 只做补充询问", "售后类问题默认人工跟进"],
    nextStepZh: "先定义表单字段，再做模拟提交接口。",
  }),
  buildChannel({
    id: "email",
    displayNameZh: "邮件客服",
    englishNameZh: "Email Support（邮件客服）",
    difficulty: "low",
    riskLevel: "medium",
    phase: "phase_1_test",
    status: "needs_config",
    businessGoal: "把客户邮件整理成统一会话，先做读取、摘要、草稿，不做自动真实发送。",
    requiredInputs: ["测试邮箱", "收件规则", "邮件分类规则", "邮件签名模板"],
    missingInputs: ["真实邮箱密码或授权码禁止写入项目", "真实客户邮件暂不导入"],
    allowedActions: ["读取测试样例", "生成邮件草稿", "翻译中英文邮件", "汇总未处理邮件"],
    forbiddenActions: ["自动群发邮件", "自动发送真实邮件", "在代码中保存邮箱密码"],
    acceptanceCriteria: ["邮件样例能转为会话", "草稿状态可审核", "发送动作必须停留在人工确认前"],
    nextStepZh: "先准备测试邮件样例和回复模板，不接真实邮箱。",
  }),
  buildChannel({
    id: "feishu",
    displayNameZh: "飞书内部通知",
    englishNameZh: "Feishu Notification（飞书通知）",
    difficulty: "low",
    riskLevel: "medium",
    phase: "phase_1_test",
    status: "needs_config",
    businessGoal: "把客服风险、离线日报、订单异常推送到内部协同，不替代 GitHub 和 Obsidian。",
    requiredInputs: ["飞书测试群", "多维表格字段", "通知模板", "负责人角色 A/B/C"],
    missingInputs: ["飞书正式应用密钥暂不写入", "客户真实表格暂不连接"],
    allowedActions: ["输出日报草稿", "输出风险提醒", "输出待审核任务", "记录模拟导出状态"],
    forbiddenActions: ["推送真实客户隐私", "把飞书当作代码执行主控", "绕过人工审核直接通知客户"],
    acceptanceCriteria: ["离线日报字段完整", "风险提醒能标出负责人", "导出状态能区分 Demo 和真实接口"],
    nextStepZh: "先固化字段和模板，再接飞书测试应用。",
  }),
  buildChannel({
    id: "enterprise_wechat",
    displayNameZh: "企业微信/微信客服",
    englishNameZh: "WeCom / WeChat Customer Service（企业微信/微信客服）",
    difficulty: "medium",
    riskLevel: "high",
    phase: "phase_2_prepare",
    status: "official_permission_required",
    businessGoal: "后续把企业微信客服消息纳入统一客服，但一期只做权限清单，不做个人微信自动化。",
    requiredInputs: ["企业微信主体", "官方客服接口权限", "客服账号权限", "消息留存合规规则"],
    missingInputs: ["官方接口权限待确认", "企业主体与客服账号待确认"],
    allowedActions: ["整理权限清单", "设计消息字段映射", "准备人工审核规则"],
    forbiddenActions: ["个人微信自动化", "扫码外挂", "自动发送高风险回复", "绕过企业微信官方接口"],
    acceptanceCriteria: ["只形成接入清单", "明确不接个人微信", "明确消息发送需要人工确认"],
    nextStepZh: "先做官方权限预研，等主体和权限确认后再排期。",
  }),
  buildChannel({
    id: "whatsapp",
    displayNameZh: "WhatsApp 客服",
    englishNameZh: "WhatsApp Business Platform（WhatsApp 商业平台）",
    difficulty: "medium",
    riskLevel: "high",
    phase: "phase_2_prepare",
    status: "official_permission_required",
    businessGoal: "面向海外客户做统一会话接入，先准备官方商业平台权限和模板消息规则。",
    requiredInputs: ["Meta Business 账号", "WhatsApp Business Platform 权限", "号码审核状态", "模板消息规则"],
    missingInputs: ["官方权限未确认", "号码和模板未审核"],
    allowedActions: ["整理字段映射", "模拟会话进入", "准备翻译和草稿流程"],
    forbiddenActions: ["非官方通道群发", "自动发送营销消息", "保存真实客户手机号到 Demo"],
    acceptanceCriteria: ["权限清单完整", "模板消息风险已标记", "真实发送仍被阻断"],
    nextStepZh: "先整理 Meta/WhatsApp 官方准备事项，不做真实连接。",
  }),
  buildChannel({
    id: "douyin_im",
    displayNameZh: "抖音 IM",
    englishNameZh: "Douyin IM（抖音即时消息）",
    difficulty: "high",
    riskLevel: "high",
    phase: "phase_3_official_permission",
    status: "blocked_for_phase_1",
    businessGoal: "后续根据官方开放能力接入抖音消息，一期不承诺打通。",
    requiredInputs: ["抖音开放平台权限", "店铺主体", "消息 API 可用范围", "平台合规要求"],
    missingInputs: ["官方权限待确认", "接口范围待确认", "合规边界待确认"],
    allowedActions: ["记录接入风险", "整理接口清单", "模拟抖音会话样例"],
    forbiddenActions: ["模拟真实平台登录", "抓取私信", "绕过官方接口", "自动回复真实客户"],
    acceptanceCriteria: ["一期只出现为待接入状态", "不影响低难度渠道测试", "所有风险写清楚"],
    nextStepZh: "只保留在路线图里，等一期稳定后再预研。",
  }),
  buildChannel({
    id: "tiktok_social",
    displayNameZh: "TikTok/其他社媒",
    englishNameZh: "TikTok / Social Channels（TikTok/其他社交媒体）",
    difficulty: "high",
    riskLevel: "high",
    phase: "phase_3_official_permission",
    status: "blocked_for_phase_1",
    businessGoal: "后续面向海外社媒消息做统一处理，一期只做路线图和字段预留。",
    requiredInputs: ["官方开发者权限", "账号主体", "消息权限范围", "跨境数据合规要求"],
    missingInputs: ["官方权限未确认", "真实账号授权未准备", "跨境数据合规未审查"],
    allowedActions: ["记录路线图", "准备字段模型", "设计人工审核边界"],
    forbiddenActions: ["非官方抓取消息", "自动私信客户", "保存真实社媒身份到 Demo"],
    acceptanceCriteria: ["不进入一期真实接入", "字段模型可预留", "风险等级保持高风险"],
    nextStepZh: "暂不开发真实连接，只保留未来扩展设计。",
  }),
];

const countBy = <T extends string>(items: ChannelReadiness[], pick: (item: ChannelReadiness) => T): Record<T, number> => {
  return items.reduce(
    (counts, item) => {
      const key = pick(item);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {} as Record<T, number>,
  );
};

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  const repositoryStatus = getSupportRepositoryStatus();
  const recommendedStartOrder = channels.map((channel) => channel.id);
  const phase1Channels = channels.filter((channel) => channel.phase === "phase_1_test");
  const blockedForPhase1Channels = channels.filter((channel) => channel.phase !== "phase_1_test");

  return NextResponse.json(
    withSupportRepositoryStatus({
      mode: repositoryStatus.activeMode,
      note: "客服渠道接入前置清单用于决定先接哪些低难度渠道，当前只输出准备事项和安全边界，不连接真实平台，不发送客户消息。",
      summary: {
        totalChannels: channels.length,
        lowDifficultyCount: channels.filter((channel) => channel.difficulty === "low").length,
        mediumDifficultyCount: channels.filter((channel) => channel.difficulty === "medium").length,
        highDifficultyCount: channels.filter((channel) => channel.difficulty === "high").length,
        phase1CandidatesCount: phase1Channels.length,
        blockedForPhase1Count: blockedForPhase1Channels.length,
        officialPermissionRequiredCount: channels.filter((channel) => channel.status === "official_permission_required").length,
      },
      difficultyBreakdown: countBy(channels, (channel) => channel.difficulty),
      riskBreakdown: countBy(channels, (channel) => channel.riskLevel),
      statusBreakdown: countBy(channels, (channel) => channel.status),
      recommendedStartOrder,
      phase1CandidateIds: phase1Channels.map((channel) => channel.id),
      blockedForPhase1Ids: blockedForPhase1Channels.map((channel) => channel.id),
      channels,
      guardrails: {
        noRealSecrets: true,
        noPersonalWechatAutomation: true,
        noAutoSendCustomerMessages: true,
        highRiskAutoReplyBlocked: true,
        humanReviewRequired: true,
        demoDataOnly: true,
        officialApiOnlyForRealIntegrations: true,
      },
      demoModeNotice:
        "当前接口是接入前置清单，不是平台代理连接器。所有 token、secret、邮箱密码、客户资料都不能写入 Demo 工程。",
      nextActions: [
        "先完成独立站在线客服和独立站表单的模拟接入。",
        "再准备邮件客服和飞书内部通知的测试字段。",
        "企业微信、WhatsApp、抖音、TikTok 等渠道等官方权限确认后再接。",
        "任何真实消息发送前都必须经过人工审核和审计记录。",
      ],
    }),
  );
}
