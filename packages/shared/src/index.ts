export type RoleCode = "platform_admin" | "tenant_owner" | "operator" | "customer_service" | "viewer";

export const roles: Array<{ code: RoleCode; name: string; description: string }> = [
  { code: "platform_admin", name: "平台总管理员", description: "管理客户、模块、权限和交付状态" },
  { code: "tenant_owner", name: "客户老板", description: "查看经营总览、日报、风险和关键审批" },
  { code: "operator", name: "客户运营", description: "处理订单、素材、投流和达人任务" },
  { code: "customer_service", name: "客户客服", description: "处理客服会话和 AI 建议回复" },
  { code: "viewer", name: "只读观察者", description: "只能查看数据，不能修改配置" }
];

export const modules = [
  {
    key: "data-center",
    name: "数据中台",
    owner: "A",
    description: "统一订单、物流、账号、内容、客户和同步日志。"
  },
  {
    key: "ops-console",
    name: "后台与手机端",
    owner: "B",
    description: "电脑端总控、客户后台、手机轻工作台和待办入口。"
  },
  {
    key: "ai-integrations",
    name: "AI 与平台集成",
    owner: "C",
    description: "飞书、邮件、AI 日报、素材投流和平台接口准备。"
  }
] as const;

export const reviewGates = [
  "项目负责人审核：普通页面、文档、低风险配置",
  "Claude/Codex 辅助审核：数据库、权限、AI、飞书、邮件",
  "客户可见审核：方案、演示页面、日报、操作手册"
] as const;

export const weekOneTasks = [
  { id: "#1", title: "创建 Next.js 项目骨架", owner: "A", dueDate: "2026-06-03", status: "进行中" },
  { id: "#5", title: "绘制平台总控页面结构", owner: "B", dueDate: "2026-06-03", status: "进行中" },
  { id: "#8", title: "配置飞书测试应用信息清单", owner: "C", dueDate: "2026-06-03", status: "进行中" },
  { id: "#2", title: "配置 Prisma 和 PostgreSQL", owner: "A", dueDate: "2026-06-05", status: "未开始" },
  { id: "#6", title: "客户后台信息架构", owner: "B", dueDate: "2026-06-05", status: "未开始" },
  { id: "#9", title: "接口准备清单", owner: "C", dueDate: "2026-06-05", status: "未开始" }
] as const;
