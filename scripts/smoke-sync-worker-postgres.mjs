import { spawnSync } from "node:child_process";
import { DEMO_TENANT_ID, projectRoot, withPostgres } from "./support-postgres-utils.mjs";

const runWorker = (syncRunId, outcome, failureReason) => {
  const args = [
    "scripts/run-sync-worker-sandbox.mjs",
    "--sync-run-id",
    syncRunId,
    "--outcome",
    outcome,
  ];

  if (failureReason) {
    args.push("--failure-reason", failureReason);
  }

  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `沙箱同步 worker 执行失败：${outcome}`,
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result.stdout.trim();
};

const checks = [];

const checkDb = async (name, run) => {
  try {
    const detail = await run();
    checks.push({ name, ok: true, detail });
  } catch (error) {
    checks.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
};

const insertQueuedSyncRun = async (pool, provider) => {
  const result = await pool.query(
    `
      insert into sync_runs (
        tenant_id, provider, status, mode, requested_by, queue_name, job_id,
        real_sync_started, contains_real_secrets, contains_customer_data,
        started_at, finished_at, failure_reason, retry_count, metadata
      )
      values (
        $1, $2, 'queued', 'demo', 'demo:admin', 'provider-sync', $3,
        false, false, false,
        now(), null, null, 0, '{"sandboxWorkerTest": true}'::jsonb
      )
      returning id::text
    `,
    [DEMO_TENANT_ID, provider, `sandbox-worker-${provider}-${Date.now()}`],
  );

  return result.rows[0].id;
};

await checkDb("沙箱 worker 成功流转 queued -> running -> succeeded", async () => {
  return await withPostgres(async (pool) => {
    const syncRunId = await insertQueuedSyncRun(pool, "shopify");
    runWorker(syncRunId, "succeeded");

    const runResult = await pool.query(
      `
        select status, retry_count, failure_reason, real_sync_started,
               contains_real_secrets, contains_customer_data, started_at, finished_at
        from sync_runs
        where id = $1
      `,
      [syncRunId],
    );
    const run = runResult.rows[0];

    if (
      run.status !== "succeeded" ||
      run.retry_count !== 0 ||
      run.failure_reason !== null ||
      run.real_sync_started !== false ||
      run.contains_real_secrets !== false ||
      run.contains_customer_data !== false ||
      !run.started_at ||
      !run.finished_at
    ) {
      throw new Error(`成功流转字段异常：${JSON.stringify(run)}`);
    }

    const auditResult = await pool.query(
      `
        select event
        from audit_logs
        where tenant_id = $1
          and metadata->>'syncRunId' = $2
        order by created_at asc
      `,
      [DEMO_TENANT_ID, syncRunId],
    );
    const events = auditResult.rows.map((row) => row.event);
    if (!events.includes("sync.running") || !events.includes("sync.succeeded")) {
      throw new Error(`缺少成功流转审计：${events.join(",")}`);
    }

    return `同步任务 ${syncRunId} 已成功流转，审计 ${events.join(",")}`;
  });
});

await checkDb("沙箱 worker 失败流转 queued -> running -> failed 并记录重试次数", async () => {
  return await withPostgres(async (pool) => {
    const syncRunId = await insertQueuedSyncRun(pool, "logistics");
    runWorker(syncRunId, "failed", "沙箱模拟失败：字段映射缺失。");

    const runResult = await pool.query(
      `
        select status, retry_count, failure_reason, real_sync_started,
               contains_real_secrets, contains_customer_data, started_at, finished_at
        from sync_runs
        where id = $1
      `,
      [syncRunId],
    );
    const run = runResult.rows[0];

    if (
      run.status !== "failed" ||
      run.retry_count !== 1 ||
      !String(run.failure_reason || "").includes("字段映射缺失") ||
      run.real_sync_started !== false ||
      run.contains_real_secrets !== false ||
      run.contains_customer_data !== false ||
      !run.started_at ||
      !run.finished_at
    ) {
      throw new Error(`失败流转字段异常：${JSON.stringify(run)}`);
    }

    const auditResult = await pool.query(
      `
        select event
        from audit_logs
        where tenant_id = $1
          and metadata->>'syncRunId' = $2
        order by created_at asc
      `,
      [DEMO_TENANT_ID, syncRunId],
    );
    const events = auditResult.rows.map((row) => row.event);
    if (!events.includes("sync.running") || !events.includes("sync.failed")) {
      throw new Error(`缺少失败流转审计：${events.join(",")}`);
    }

    return `同步任务 ${syncRunId} 已失败流转，审计 ${events.join(",")}`;
  });
});

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`PostgreSQL 同步 worker 沙箱烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`PostgreSQL 同步 worker 沙箱烟测通过：${checks.length}/${checks.length}`);
