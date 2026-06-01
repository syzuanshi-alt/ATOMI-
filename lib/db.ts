import "server-only";
import { Pool } from "pg";

let pool: Pool | null = null;

export const getDb = (): Pool => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for live database access.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      idleTimeoutMillis: 30_000,
    });
  }

  return pool;
};

export const query = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
  const result = await getDb().query(sql, params);
  return result.rows as T[];
};
