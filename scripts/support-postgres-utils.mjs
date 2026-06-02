import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const parseEnvLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key, value };
};

export const loadLocalEnv = async () => {
  const envFiles = [".env.local", ".env"];

  for (const envFile of envFiles) {
    const envPath = path.join(projectRoot, envFile);
    if (!existsSync(envPath)) {
      continue;
    }

    const content = await readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed || process.env[parsed.key]) {
        continue;
      }

      process.env[parsed.key] = parsed.value;
    }
  }
};

export const getRequiredDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "缺少 DATABASE_URL。请先复制 .env.example 为 .env.local，并确认只使用本地 PostgreSQL 沙箱数据库。",
    );
  }

  return databaseUrl;
};

export const createPostgresPool = () => {
  return new Pool({
    connectionString: getRequiredDatabaseUrl(),
    max: 4,
    idleTimeoutMillis: 10_000,
  });
};

export const withPostgres = async (callback) => {
  await loadLocalEnv();
  const pool = createPostgresPool();

  try {
    return await callback(pool);
  } finally {
    await pool.end();
  }
};

export const DEMO_TENANT_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_SUPPORT_USER_ID = "22222222-2222-4222-8222-222222222222";
export const DEMO_SUPPORT_ROLE_ID = "33333333-3333-4333-8333-333333333333";

export const requiredSupportTables = [
  "tenants",
  "users",
  "roles",
  "permissions",
  "role_permissions",
  "tenant_members",
  "support_channels",
  "customers",
  "customer_identities",
  "customer_threads",
  "messages",
  "message_translations",
  "ai_reply_suggestions",
  "ai_approvals",
  "handoff_reports",
  "audit_logs",
];
