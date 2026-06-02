import { readFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot, requiredSupportTables, withPostgres } from "./support-postgres-utils.mjs";

const schemaPath = path.join(projectRoot, "db", "schema.sql");

try {
  await withPostgres(async (pool) => {
  const schemaSql = await readFile(schemaPath, "utf8");
  await pool.query(schemaSql);

  const tableResult = await pool.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
      order by table_name
    `,
    [requiredSupportTables],
  );
  const existingTables = new Set(tableResult.rows.map((row) => row.table_name));
  const missingTables = requiredSupportTables.filter((tableName) => !existingTables.has(tableName));

  const tenantColumnResult = await pool.query(
    `
      select table_name
      from information_schema.columns
      where table_schema = 'public'
        and column_name = 'tenant_id'
        and table_name = any($1::text[])
      order by table_name
    `,
    [
      [
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
      ],
    ],
  );
  const tenantTables = new Set(tenantColumnResult.rows.map((row) => row.table_name));
  const missingTenantId = [
    "support_channels",
    "customers",
    "customer_identities",
    "customer_threads",
    "messages",
    "message_translations",
    "ai_reply_suggestions",
    "ai_approvals",
    "handoff_reports",
  ].filter((tableName) => !tenantTables.has(tableName));

  if (missingTables.length || missingTenantId.length) {
    console.error("PostgreSQL schema 检查失败。");
    if (missingTables.length) {
      console.error(`缺少表：${missingTables.join(", ")}`);
    }
    if (missingTenantId.length) {
      console.error(`缺少 tenant_id 的客服表：${missingTenantId.join(", ")}`);
    }
    process.exit(1);
  }

  console.log(`PostgreSQL schema 检查通过：${requiredSupportTables.length} 张关键表存在。`);
  console.log("客服核心表已包含 tenant_id，可用于后续租户隔离验证。");
  });
} catch (error) {
  console.error("PostgreSQL schema 检查未完成。");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
