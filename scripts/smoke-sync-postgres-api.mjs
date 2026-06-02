import { DEMO_TENANT_ID, withPostgres } from "./support-postgres-utils.mjs";

const baseUrl = process.env.SYNC_POSTGRES_API_BASE_URL ?? "http://127.0.0.1:4174";

const checks = [];

const check = async (name, request, verify) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const response = await fetch(request.url, { ...request, signal: controller.signal });
  clearTimeout(timeout);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  const result = verify(response, data);
  checks.push({ name, status: response.status, ok: result.ok, detail: result.detail, data });
  return data;
};

const checkDb = async (name, run) => {
  try {
    const detail = await run();
    checks.push({ name, status: "db", ok: true, detail, data: null });
  } catch (error) {
    checks.push({ name, status: "db", ok: false, detail: error instanceof Error ? error.message : String(error), data: null });
  }
};

await check(
  "同步 API 已进入 PostgreSQL 沙箱模式",
  {
    url: `${baseUrl}/api/support/repository-status`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.requestedMode === "postgres" &&
      data?.activeMode === "postgres" &&
      data?.postgresRepositoryEnabled === true &&
      data?.databaseUrlConfigured === true,
    detail: `请求模式 ${data?.requestedMode ?? "unknown"}，实际模式 ${data?.activeMode ?? "unknown"}`,
  }),
);

const syncData = await check(
  "管理员触发 PostgreSQL 沙箱同步审计",
  {
    url: `${baseUrl}/api/sync`,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-demo-role": "admin",
    },
    body: JSON.stringify({ provider: "logistics" }),
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.provider === "logistics" &&
      data?.realSyncStarted === false &&
      data?.repository?.activeMode === "postgres" &&
      data?.syncAudit?.provider === "logistics" &&
      data?.syncAudit?.requestedBy === "demo:admin" &&
      data?.syncAudit?.persistenceMode === "postgres_sandbox" &&
      data?.syncAudit?.persistenceTable === "sync_runs" &&
      data?.syncAudit?.auditTable === "audit_logs" &&
      typeof data?.syncAudit?.syncRunId === "string" &&
      data?.syncAudit?.realSyncStarted === false &&
      data?.syncAudit?.containsRealSecrets === false &&
      data?.syncAudit?.containsCustomerData === false &&
      ["queued", "skipped", "failed"].includes(data?.syncAudit?.status) &&
      data?.guardrails?.noRealPlatformWrite === true &&
      data?.guardrails?.noCustomerDataSynced === true,
    detail: `状态 ${data?.syncAudit?.status ?? "missing"}，审计 ${data?.syncAudit?.syncRunId ?? "missing"}，真实同步 ${String(
      data?.realSyncStarted,
    )}`,
  }),
);

await checkDb("PostgreSQL sync_runs 已记录同步尝试", async () => {
  const syncRunId = syncData?.syncAudit?.syncRunId;
  if (!syncRunId) {
    throw new Error("接口没有返回 syncRunId。");
  }

  return await withPostgres(async (pool) => {
    const result = await pool.query(
      `
        select provider, status, requested_by, real_sync_started, contains_real_secrets,
               contains_customer_data, retry_count, failure_reason, metadata
        from sync_runs
        where id = $1
          and tenant_id = $2
      `,
      [syncRunId, DEMO_TENANT_ID],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error(`sync_runs 缺少记录：${syncRunId}`);
    }

    if (
      row.provider !== "logistics" ||
      row.requested_by !== "demo:admin" ||
      row.real_sync_started !== false ||
      row.contains_real_secrets !== false ||
      row.contains_customer_data !== false ||
      row.retry_count !== 0
    ) {
      throw new Error(`sync_runs 字段异常：${JSON.stringify(row)}`);
    }

    return `同步日志 ${syncRunId} 已写入，状态 ${row.status}，失败原因 ${row.failure_reason ?? "无"}`;
  });
});

await checkDb("PostgreSQL audit_logs 已记录同步审计", async () => {
  const syncRunId = syncData?.syncAudit?.syncRunId;
  if (!syncRunId) {
    throw new Error("接口没有返回 syncRunId。");
  }

  return await withPostgres(async (pool) => {
    const result = await pool.query(
      `
        select event, metadata
        from audit_logs
        where tenant_id = $1
          and metadata->>'syncRunId' = $2
        order by created_at desc
        limit 1
      `,
      [DEMO_TENANT_ID, syncRunId],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error(`audit_logs 缺少同步审计：${syncRunId}`);
    }

    if (!["sync.queued", "sync.skipped", "sync.failed"].includes(row.event)) {
      throw new Error(`audit_logs 事件异常：${row.event}`);
    }

    if (row.metadata?.realSyncStarted !== false || row.metadata?.containsRealSecrets !== false) {
      throw new Error(`audit_logs 护栏字段异常：${JSON.stringify(row.metadata)}`);
    }

    return `审计事件 ${row.event} 已写入。`;
  });
});

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`PostgreSQL 同步 API 烟测失败：${failed.length}/${checks.length}`);
  console.error("请确认服务是用 SUPPORT_REPOSITORY_MODE=postgres 和 ENABLE_POSTGRES_SUPPORT_REPOSITORY=true 启动的。");
  process.exit(1);
}

console.log(`PostgreSQL 同步 API 烟测通过：${checks.length}/${checks.length}`);
