import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth";

const liveModeRequirements = [
  "正式登录 Session（会话）",
  "租户成员表 tenant_members",
  "角色表 roles",
  "权限表 permissions",
  "角色权限表 role_permissions",
  "服务端权限校验",
  "审计 actor 绑定真实用户",
];

const blockedForLiveMode = [
  "x-demo-role 请求头",
  "demo_role Cookie",
  "固定 Demo tenantId",
  "前端自报角色",
  "未落库的临时用户身份",
];

const recommendedAuthPlan = {
  recommended: "authjs_with_postgres_rbac",
  titleZh: "推荐：Auth.js + PostgreSQL RBAC",
  stage: "design_locked_not_installed",
  reasonZh:
    "当前项目已经有 PostgreSQL 租户、成员、角色、权限表。Auth.js 更适合先把登录 Session 接入现有数据库权限，不把客户身份强绑定到第三方用户系统，后续私有化或客户独立部署也更稳。",
  nextStep: "先做本地 Session 适配层和 PostgreSQL RBAC 读取，不直接接真实供应商。",
};

const authProviderOptions = [
  {
    id: "authjs_with_postgres_rbac",
    name: "Auth.js + PostgreSQL RBAC",
    verdictZh: "一期推荐",
    fitZh: "适合需要数据自控、多客户交付、后续可私有部署的 SaaS 后台。",
    tradeoffZh: "需要自己做好登录页面、Session 数据表、邮件登录或账号密码策略，开发量比 Clerk 大一点。",
    phase1ActionZh: "先只做接口和 Session 适配层设计，确认后再安装依赖和接登录。",
  },
  {
    id: "clerk",
    name: "Clerk",
    verdictZh: "可作为快速试点备选",
    fitZh: "适合快速做登录、用户管理和组织管理，开发速度快，后台管理现成。",
    tradeoffZh: "会绑定第三方用户系统，客户私有化、国内访问、成本和数据边界要提前确认。",
    phase1ActionZh: "如果优先快速演示真实登录，可单独开分支试接，不直接替换当前权限系统。",
  },
  {
    id: "custom_session",
    name: "自建 Session",
    verdictZh: "一期暂不推荐",
    fitZh: "适合强定制和完全私有化，但要求团队熟悉密码安全、Session 轮换、风控和审计。",
    tradeoffZh: "小白团队维护风险高，容易在安全细节上踩坑。",
    phase1ActionZh: "只保留为后续客户强私有化场景的方案，不作为当前 MVP 首选。",
  },
];

export async function GET(request: Request) {
  const context = getRequestContext(request);

  return NextResponse.json({
    mode: context.mode,
    source: "demo_auth_readiness",
    noteZh: "当前只检查真实登录前置条件，不接入真实登录供应商，不创建真实 Session。",
    currentAuth: {
      tenantId: context.tenantId,
      userId: context.userId,
      actorRef: context.actorRef,
      role: context.role,
      authSource: context.authSource,
    },
    demoAuthBoundary: {
      acceptedDemoInputs: ["x-demo-role 请求头", "demo_role Cookie"],
      invalidDemoRoleFallsBackToDefault: true,
      defaultRole: "gm",
      noteZh: "Demo 输入只用于本地演示和烟测。生产环境不能让前端请求头决定用户角色。",
    },
    recommendedAuthPlan,
    authProviderOptions,
    sessionAdapterReadinessEndpoint: "/api/auth/session-adapter-readiness",
    sessionContextReadinessEndpoint: "/api/auth/session-context-readiness",
    implementationOrderZh: [
      "保留当前 Demo Header，仅用于本地演示。",
      "新增真实 Session 适配层，但默认关闭真实登录。",
      "用 PostgreSQL tenant_members / roles / permissions / role_permissions 读取权限。",
      "所有业务 API 先从统一请求上下文读取用户、租户和角色。",
      "确认后再选择 Auth.js 或 Clerk 做真实登录接入。",
    ],
    liveModeRequirements,
    blockedForLiveMode,
    guardrails: {
      notRealLogin: true,
      liveSessionConfigured: false,
      productionMustDisableDemoHeader: true,
      tenantMembershipRequired: true,
      serverSidePermissionRequired: true,
      auditMustUseRealUser: true,
    },
  });
}
