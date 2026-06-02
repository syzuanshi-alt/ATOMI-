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
    note: context.authNote,
  });
}
