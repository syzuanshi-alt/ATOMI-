import "server-only";
import { NextResponse } from "next/server";
import { can, canApproveAiAction, type Permission } from "@/lib/permissions";
import { getRequestContext } from "@/lib/request-context";
import type { AiAction } from "@/lib/types";
import type { AppRole } from "@/lib/request-context";

export type { AppRole };
export { getDemoRole, getRequestContext } from "@/lib/request-context";

export const requirePermission = (request: Request, permission: Permission): NextResponse | null => {
  const context = getRequestContext(request);
  const role = context.role;
  if (can(role, permission)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "forbidden",
      mode: context.mode,
      tenantId: context.tenantId,
      actorRef: context.actorRef,
      authSource: context.authSource,
      role,
      requiredPermission: permission,
      message: "当前岗位没有权限执行该操作。",
    },
    { status: 403 },
  );
};

export const requireAiActionApproval = (request: Request, action: AiAction): NextResponse | null => {
  const context = getRequestContext(request);
  const role = context.role;
  if (canApproveAiAction(role, action)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "forbidden",
      mode: context.mode,
      tenantId: context.tenantId,
      actorRef: context.actorRef,
      authSource: context.authSource,
      role,
      actionType: action.actionType,
      ownerRole: action.ownerRole,
      message: "当前岗位不能确认这类 AI 动作。",
    },
    { status: 403 },
  );
};
