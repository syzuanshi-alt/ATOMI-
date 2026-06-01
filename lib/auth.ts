import "server-only";
import { NextResponse } from "next/server";
import { can, canApproveAiAction, type Permission } from "@/lib/permissions";
import type { AiAction, Role } from "@/lib/types";

export type AppRole = Role | "admin";

const roleAliases: Record<string, AppRole> = {
  owner: "gm",
  gm: "gm",
  bd: "bd",
  media: "media_buyer",
  media_buyer: "media_buyer",
  support: "support",
  admin: "admin",
};

export const getDemoRole = (request: Request): AppRole => {
  const headerRole = request.headers.get("x-demo-role");
  const cookieRole = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("demo_role="))
    ?.split("=")[1];

  return roleAliases[headerRole ?? ""] ?? roleAliases[cookieRole ?? ""] ?? "gm";
};

export const requirePermission = (request: Request, permission: Permission): NextResponse | null => {
  const role = getDemoRole(request);
  if (can(role, permission)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "forbidden",
      role,
      requiredPermission: permission,
      message: "当前岗位没有权限执行该操作。",
    },
    { status: 403 },
  );
};

export const requireAiActionApproval = (request: Request, action: AiAction): NextResponse | null => {
  const role = getDemoRole(request);
  if (canApproveAiAction(role, action)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "forbidden",
      role,
      actionType: action.actionType,
      ownerRole: action.ownerRole,
      message: "当前岗位不能确认这类 AI 动作。",
    },
    { status: 403 },
  );
};
