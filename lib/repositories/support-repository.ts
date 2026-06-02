import "server-only";
import { getRequestContext } from "@/lib/request-context";
import { demoSupportRepository } from "@/lib/repositories/demo-support-repository";
import { postgresSupportRepository } from "@/lib/repositories/postgres-support-repository";
import type { SupportActor, SupportRepository, SupportRepositoryMode } from "@/lib/repositories/support-types";

type SupportRepositoryRequestedMode = SupportRepositoryMode | "invalid";

export type SupportRepositoryStatus = {
  requestedMode: SupportRepositoryRequestedMode;
  activeMode: SupportRepositoryMode;
  databaseUrlConfigured: boolean;
  postgresRepositoryEnabled: boolean;
  fallbackReason: string | null;
  warning: string | null;
  envKeys: string[];
};

const readRequestedMode = (): SupportRepositoryRequestedMode => {
  const rawMode = process.env.SUPPORT_REPOSITORY_MODE?.trim().toLowerCase();
  if (!rawMode || rawMode === "demo") {
    return "demo";
  }

  if (rawMode === "postgres") {
    return "postgres";
  }

  return "invalid";
};

export const getSupportActor = (request: Request): SupportActor => {
  return getRequestContext(request);
};

export const getSupportRepositoryStatus = (): SupportRepositoryStatus => {
  const requestedMode = readRequestedMode();
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const postgresRepositoryEnabled = process.env.ENABLE_POSTGRES_SUPPORT_REPOSITORY === "true";

  if (requestedMode === "invalid") {
    return {
      requestedMode,
      activeMode: "demo",
      databaseUrlConfigured,
      postgresRepositoryEnabled,
      fallbackReason: "SUPPORT_REPOSITORY_MODE 配置值无效，已回退 Demo Repository（演示数据访问层）。",
      warning: "有效值只能是 demo 或 postgres。当前不会连接真实数据库。",
      envKeys: ["SUPPORT_REPOSITORY_MODE", "DATABASE_URL", "ENABLE_POSTGRES_SUPPORT_REPOSITORY"],
    };
  }

  if (requestedMode === "postgres" && !databaseUrlConfigured) {
    return {
      requestedMode,
      activeMode: "demo",
      databaseUrlConfigured,
      postgresRepositoryEnabled,
      fallbackReason: "已请求 PostgreSQL Repository，但缺少 DATABASE_URL，已回退 Demo Repository。",
      warning: "这是保护措施：缺少真实数据库配置时不能静默进入真实模式。",
      envKeys: ["SUPPORT_REPOSITORY_MODE", "DATABASE_URL", "ENABLE_POSTGRES_SUPPORT_REPOSITORY"],
    };
  }

  if (requestedMode === "postgres" && !postgresRepositoryEnabled) {
    return {
      requestedMode,
      activeMode: "demo",
      databaseUrlConfigured,
      postgresRepositoryEnabled,
      fallbackReason: "已请求 PostgreSQL Repository，但真实数据库访问层尚未启用，已回退 Demo Repository。",
      warning: "需要明确设置 ENABLE_POSTGRES_SUPPORT_REPOSITORY=true 才允许进入真实数据库路径。",
      envKeys: ["SUPPORT_REPOSITORY_MODE", "DATABASE_URL", "ENABLE_POSTGRES_SUPPORT_REPOSITORY"],
    };
  }

  if (requestedMode === "postgres") {
    return {
      requestedMode,
      activeMode: "demo",
      databaseUrlConfigured,
      postgresRepositoryEnabled,
      fallbackReason: "PostgreSQL Repository 仍是占位实现，当前阶段已回退 Demo Repository。",
      warning: "已完成真实数据库边界预留，但尚未实现 PostgreSQL 查询和写入，不能用于生产。",
      envKeys: ["SUPPORT_REPOSITORY_MODE", "DATABASE_URL", "ENABLE_POSTGRES_SUPPORT_REPOSITORY"],
    };
  }

  return {
    requestedMode,
    activeMode: "demo",
    databaseUrlConfigured,
    postgresRepositoryEnabled,
    fallbackReason: null,
    warning: null,
    envKeys: ["SUPPORT_REPOSITORY_MODE", "DATABASE_URL", "ENABLE_POSTGRES_SUPPORT_REPOSITORY"],
  };
};

export const getSupportRepository = (): SupportRepository => {
  const status = getSupportRepositoryStatus();
  return status.activeMode === "postgres" ? postgresSupportRepository : demoSupportRepository;
};

export const withSupportRepositoryStatus = <T extends { note: string }>(
  result: T,
): T & { repository: SupportRepositoryStatus } => {
  const repository = getSupportRepositoryStatus();
  const note = repository.warning ? `${result.note} ${repository.warning}` : result.note;

  return {
    ...result,
    note,
    repository,
  };
};
