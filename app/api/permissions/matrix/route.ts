import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth";
import { getApiPermissionChecks, getRolePermissionMatrix } from "@/lib/permissions";

export async function GET(request: Request) {
  const context = getRequestContext(request);

  return NextResponse.json({
    mode: context.mode,
    source: "demo_permission_matrix",
    noteZh: "当前权限矩阵只描述 Demo 模式的角色权限，不代表真实登录系统已经完成。",
    authBoundaryZh: "Demo 模式使用 x-demo-role 请求头或 demo_role Cookie；真实登录必须替换为正式登录 Session（会话）、租户成员关系和服务端权限校验。",
    currentActor: {
      tenantId: context.tenantId,
      userId: context.userId,
      actorRef: context.actorRef,
      role: context.role,
      authSource: context.authSource,
    },
    roles: getRolePermissionMatrix(),
    apiPermissionChecks: getApiPermissionChecks(),
    guardrails: {
      demoRoleOnly: true,
      notRealLogin: true,
      noRealPlatformWrite: true,
      noCredentialSaved: true,
      noCustomerMessageSent: true,
      highRiskManualReviewRequired: true,
    },
  });
}
