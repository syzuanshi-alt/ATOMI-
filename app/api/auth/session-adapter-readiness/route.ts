import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth";
import { getSessionAdapterReadiness } from "@/lib/auth/session-adapter";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  const adapter = getSessionAdapterReadiness(context);

  return NextResponse.json({
    mode: context.mode,
    source: "session_adapter_readiness",
    noteZh: "当前只是 Session 适配层准备状态，不代表真实登录已经接入。",
    currentActor: {
      tenantId: context.tenantId,
      userId: context.userId,
      actorRef: context.actorRef,
      role: context.role,
      authSource: context.authSource,
    },
    adapter,
    sessionContextReadinessEndpoint: "/api/auth/session-context-readiness",
    guardrails: {
      notRealLogin: true,
      noAuthDependencyInstalled: !adapter.authDependencyInstalled,
      demoHeaderStillDemoOnly: true,
      productionMustDisableDemoHeader: true,
      noRealUsersLoaded: true,
      noRealPlatformConnection: true,
    },
  });
}
