import { NextResponse } from "next/server";
import { requirePermission, getRequestContext } from "@/lib/auth";
import { getPostgresRbacReadiness } from "@/lib/rbac/postgres-rbac-readiness";

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "integrations.manage");
  if (forbidden) {
    return forbidden;
  }

  const context = getRequestContext(request);
  const readiness = await getPostgresRbacReadiness();

  return NextResponse.json({
    mode: context.mode,
    source: "postgres_rbac_readiness",
    noteZh: "当前只读取本地 PostgreSQL RBAC 沙箱状态，不代表真实登录系统已经完成。",
    currentActor: {
      tenantId: context.tenantId,
      userId: context.userId,
      actorRef: context.actorRef,
      role: context.role,
      authSource: context.authSource,
    },
    database: readiness.database,
    rbac: readiness.rbac,
    guardrails: {
      notRealLogin: true,
      readOnlyCheck: true,
      noRealUsers: readiness.rbac.sandboxUsersOnly,
      noRealPlatformConnection: true,
      noCredentialReturned: true,
      productionMustUseSession: true,
      productionMustDisableDemoHeader: true,
    },
  });
}
