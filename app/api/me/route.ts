import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth";
import { rolePermissions } from "@/lib/permissions";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  return NextResponse.json({
    mode: context.mode,
    isDemo: context.isDemo,
    tenantId: context.tenantId,
    userId: context.userId,
    actorRef: context.actorRef,
    role: context.role,
    authSource: context.authSource,
    permissions: rolePermissions[context.role],
    permissionsMatrixEndpoint: "/api/permissions/matrix",
    rbacReadinessEndpoint: "/api/permissions/rbac-readiness",
    sessionAdapterReadinessEndpoint: "/api/auth/session-adapter-readiness",
    sessionContextReadinessEndpoint: "/api/auth/session-context-readiness",
    authReadinessEndpoint: "/api/auth/session-readiness",
    authBoundary: {
      demoRoleOnly: true,
      notRealLogin: true,
      realLoginRequiredForLiveMode: true,
    },
    note: context.authNote,
  });
}
