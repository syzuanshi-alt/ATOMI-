import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth";
import { getSessionContextReadiness } from "@/lib/auth/session-context";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  const sessionContext = getSessionContextReadiness(context);

  return NextResponse.json({
    mode: context.mode,
    source: "session_context_readiness",
    noteZh: "当前只定义真实 Session 映射到统一请求上下文的草案，不接真实登录供应商。",
    currentContext: {
      tenantId: context.tenantId,
      userId: context.userId,
      actorRef: context.actorRef,
      role: context.role,
      authSource: context.authSource,
    },
    sessionContext,
    guardrails: {
      notRealLogin: true,
      noRealSessionCookieAccepted: true,
      businessApisUseUnifiedContext: true,
      productionMustDisableDemoHeader: true,
      noAuthDependencyInstalled: true,
      noRealUsersLoaded: true,
    },
  });
}
