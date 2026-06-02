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
