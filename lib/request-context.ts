import "server-only";
import type { Role } from "@/lib/types";

export type AppRole = Role | "admin";
export type RequestMode = "demo";
export type RequestAuthSource = "header" | "cookie" | "default";

export type AppRequestContext = {
  mode: RequestMode;
  isDemo: true;
  tenantId: string;
  userId: string;
  actorRef: string;
  role: AppRole;
  authSource: RequestAuthSource;
  authNote: string;
};

const DEMO_TENANT_ID = "demo_tenant_atomi_watch";

const roleAliases: Record<string, AppRole> = {
  owner: "gm",
  gm: "gm",
  bd: "bd",
  media: "media_buyer",
  media_buyer: "media_buyer",
  support: "support",
  admin: "admin",
};

const normalizeDemoRole = (value: string | null | undefined): AppRole | null => {
  if (!value) {
    return null;
  }

  return roleAliases[value.trim().toLowerCase()] ?? null;
};

const readCookieValue = (request: Request, name: string): string | null => {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch {
    return null;
  }
};

export const getRequestContext = (request: Request): AppRequestContext => {
  const headerRole = normalizeDemoRole(request.headers.get("x-demo-role"));
  const cookieRole = normalizeDemoRole(readCookieValue(request, "demo_role"));
  const role = headerRole ?? cookieRole ?? "gm";
  const authSource: RequestAuthSource = headerRole ? "header" : cookieRole ? "cookie" : "default";

  return {
    mode: "demo",
    isDemo: true,
    tenantId: DEMO_TENANT_ID,
    userId: `demo_user_${role}`,
    actorRef: `demo:${role}`,
    role,
    authSource,
    authNote:
      "Demo 模式使用 x-demo-role 请求头或 demo_role Cookie；真实模式必须替换为正式登录 Session（会话）和租户权限校验。",
  };
};

export const getDemoRole = (request: Request): AppRole => getRequestContext(request).role;
