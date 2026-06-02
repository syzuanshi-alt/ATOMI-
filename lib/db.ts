import "server-only";
import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export const getDatabaseUrl = (): string | null => {
  return process.env.DATABASE_URL?.trim() || null;
};

export const getDb = (): Pool => {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("缺少 DATABASE_URL。真实数据库访问只能在配置 .env.local 或部署平台环境变量后启用。");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 8,
      idleTimeoutMillis: 30_000,
    });
  }

  return pool;
};

export const query = async <T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> => {
  const result = await getDb().query(sql, params);
  return result.rows;
};

export const closeDb = async (): Promise<void> => {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
};
