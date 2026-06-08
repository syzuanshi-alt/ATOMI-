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
  | "support.read"
  | "support.reply"
  | "support.autopilot.manage"
  | "actions.read"
  | "actions.approve"
  | "privacy.manage";

export const rolePermissions: Record<Role | "admin", Permission[]> = {
  gm: ["dashboard.read", "creators.read", "ads.read", "orders.read", "support.read", "actions.read", "actions.approve"],
  bd: ["dashboard.read", "creators.read", "creators.manage", "creatives.read", "actions.read", "actions.approve"],
  media_buyer: ["dashboard.read", "creatives.read", "creatives.manage", "ads.read", "ads.recommend", "actions.read", "actions.approve"],
  support: [
    "dashboard.read",
    "orders.read",
    "orders.manage",
    "support.read",
    "support.reply",
    "support.autopilot.manage",
    "actions.read",
    "actions.approve",
    "privacy.manage",
  ],
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
    "support.read",
    "support.reply",
    "support.autopilot.manage",
    "actions.read",
    "actions.approve",
    "privacy.manage",
  ],
};

export const appRoles = ["gm", "bd", "media_buyer", "support", "admin"] as const;

export type AppPermissionRole = (typeof appRoles)[number];

export const roleLabelsZh: Record<AppPermissionRole, string> = {
  gm: "老板 / 总经理",
  bd: "达人 BD",
  media_buyer: "投手 / 投流运营",
  support: "客服",
  admin: "系统管理员",
};

export const permissionLabelsZh: Record<Permission, string> = {
  "dashboard.read": "读取平台总控",
  "integrations.manage": "管理数据接入与凭证预检",
  "creators.read": "读取达人资料",
  "creators.manage": "管理达人资料",
  "creatives.read": "读取素材数据",
  "creatives.manage": "管理素材数据",
  "ads.read": "读取投流数据",
  "ads.recommend": "生成投流建议",
  "orders.read": "读取订单数据",
  "orders.manage": "管理订单信息",
  "support.read": "读取客服会话",
  "support.reply": "生成或处理客服回复",
  "support.autopilot.manage": "管理 AI 客服托管",
  "actions.read": "读取 AI 动作",
  "actions.approve": "审核 AI 动作",
  "privacy.manage": "管理隐私请求",
};

export type ApiPermissionCheck = {
  path: string;
  method: "GET" | "POST";
  titleZh: string;
  requiredPermissions: Permission[];
  allowedRoles: AppPermissionRole[];
  manualReviewRequired: boolean;
  realPlatformWriteAllowed: boolean;
  noteZh: string;
};

export const can = (role: Role | "admin", permission: Permission): boolean => {
  return rolePermissions[role].includes(permission);
};

const rolesWithPermissions = (requiredPermissions: Permission[]): AppPermissionRole[] => {
  return appRoles.filter((role) => requiredPermissions.every((permission) => can(role, permission)));
};

export const getRolePermissionMatrix = () => {
  return appRoles.map((role) => {
    const permissions = rolePermissions[role];
    return {
      role,
      roleLabelZh: roleLabelsZh[role],
      permissions,
      permissionLabelsZh: permissions.map((permission) => permissionLabelsZh[permission]),
      canManageIntegrations: can(role, "integrations.manage"),
      canReadSupport: can(role, "support.read"),
      canReplySupport: can(role, "support.reply"),
      canManageAutopilot: can(role, "support.autopilot.manage"),
      canApproveAiActions: can(role, "actions.approve"),
      canManagePrivacy: can(role, "privacy.manage"),
    };
  });
};

export const getApiPermissionChecks = (): ApiPermissionCheck[] => [
  {
    path: "/api/permissions/matrix",
    method: "GET",
    titleZh: "读取 Demo 权限矩阵",
    requiredPermissions: ["dashboard.read"],
    allowedRoles: rolesWithPermissions(["dashboard.read"]),
    manualReviewRequired: false,
    realPlatformWriteAllowed: false,
    noteZh: "当前只解释 Demo 角色权限，不代表真实登录系统已经完成。",
  },
  {
    path: "/api/permissions/rbac-readiness",
    method: "GET",
    titleZh: "读取 PostgreSQL RBAC 准备状态",
    requiredPermissions: ["integrations.manage"],
    allowedRoles: rolesWithPermissions(["integrations.manage"]),
    manualReviewRequired: true,
    realPlatformWriteAllowed: false,
    noteZh: "只读取本地 RBAC 沙箱状态，不返回用户邮箱、真实客户数据或平台凭证。",
  },
  {
    path: "/api/integrations",
    method: "GET",
    titleZh: "读取数据接入配置",
    requiredPermissions: ["integrations.manage"],
    allowedRoles: rolesWithPermissions(["integrations.manage"]),
    manualReviewRequired: true,
    realPlatformWriteAllowed: false,
    noteZh: "当前只读取 Demo/沙箱接入配置，不读取真实平台。",
  },
  {
    path: "/api/integrations",
    method: "POST",
    titleZh: "执行 Demo 连接探测",
    requiredPermissions: ["integrations.manage"],
    allowedRoles: rolesWithPermissions(["integrations.manage"]),
    manualReviewRequired: true,
    realPlatformWriteAllowed: false,
    noteZh: "当前只做 Demo 探测，不保存真实账号或凭证。",
  },
  {
    path: "/api/integrations/credential-readiness",
    method: "GET",
    titleZh: "读取凭证管理预检",
    requiredPermissions: ["integrations.manage"],
    allowedRoles: rolesWithPermissions(["integrations.manage"]),
    manualReviewRequired: true,
    realPlatformWriteAllowed: false,
    noteZh: "只返回凭证安全状态，不返回环境变量原文或明文凭证。",
  },
  {
    path: "/api/support/threads",
    method: "GET",
    titleZh: "读取统一客服会话",
    requiredPermissions: ["support.read"],
    allowedRoles: rolesWithPermissions(["support.read"]),
    manualReviewRequired: false,
    realPlatformWriteAllowed: false,
    noteZh: "当前读取 Demo/沙箱会话，不读取真实平台消息。",
  },
  {
    path: "/api/support/ai-drafts",
    method: "POST",
    titleZh: "生成 AI 客服回复草稿",
    requiredPermissions: ["support.reply"],
    allowedRoles: rolesWithPermissions(["support.reply"]),
    manualReviewRequired: true,
    realPlatformWriteAllowed: false,
    noteZh: "只生成草稿，高风险必须人工审核，不自动发送。",
  },
  {
    path: "/api/support/ai-drafts/review",
    method: "POST",
    titleZh: "审核 AI 客服回复草稿",
    requiredPermissions: ["support.reply", "actions.approve"],
    allowedRoles: rolesWithPermissions(["support.reply", "actions.approve"]),
    manualReviewRequired: true,
    realPlatformWriteAllowed: false,
    noteZh: "审核通过不等于已经发送客户消息。",
  },
  {
    path: "/api/support/replies/send",
    method: "POST",
    titleZh: "客服回复发送前置检查",
    requiredPermissions: ["support.reply"],
    allowedRoles: rolesWithPermissions(["support.reply"]),
    manualReviewRequired: true,
    realPlatformWriteAllowed: false,
    noteZh: "当前只做发送前置检查，不发送真实客户消息。",
  },
  {
    path: "/api/sync",
    method: "POST",
    titleZh: "触发同步任务护栏",
    requiredPermissions: ["integrations.manage"],
    allowedRoles: rolesWithPermissions(["integrations.manage"]),
    manualReviewRequired: true,
    realPlatformWriteAllowed: false,
    noteZh: "排队、运行或审计写入都不代表真实平台同步。",
  },
];

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
