import type { AiAction, Role } from "@/lib/types";

export type Permission =
  | "dashboard.read"
  | "integrations.manage"
  | "creators.read"
  | "creators.manage"
  | "creatives.read"
  | "creatives.manage"
  | "ads.read"
  | "ads.recommend"
  | "orders.read"
  | "orders.manage"
  | "actions.read"
  | "actions.approve"
  | "privacy.manage";

export const rolePermissions: Record<Role | "admin", Permission[]> = {
  gm: ["dashboard.read", "creators.read", "ads.read", "orders.read", "actions.read", "actions.approve"],
  bd: ["dashboard.read", "creators.read", "creators.manage", "creatives.read", "actions.read", "actions.approve"],
  media_buyer: ["dashboard.read", "creatives.read", "creatives.manage", "ads.read", "ads.recommend", "actions.read", "actions.approve"],
  support: ["dashboard.read", "orders.read", "orders.manage", "actions.read", "actions.approve", "privacy.manage"],
  admin: [
    "dashboard.read",
    "integrations.manage",
    "creators.read",
    "creators.manage",
    "creatives.read",
    "creatives.manage",
    "ads.read",
    "ads.recommend",
    "orders.read",
    "orders.manage",
    "actions.read",
    "actions.approve",
    "privacy.manage",
  ],
};

export const can = (role: Role | "admin", permission: Permission): boolean => {
  return rolePermissions[role].includes(permission);
};

export const canApproveAiAction = (role: Role | "admin", action: AiAction): boolean => {
  if (role === "admin") {
    return true;
  }

  if (!can(role, "actions.approve")) {
    return false;
  }

  if (action.actionType === "budget_change") {
    return role === "gm";
  }

  if (action.actionType === "creator_message") {
    return role === "bd";
  }

  if (action.actionType === "creative_pause") {
    return role === "media_buyer" || role === "gm";
  }

  if (action.actionType === "support_reply" || action.actionType === "gdpr") {
    return role === "support";
  }

  return false;
};
