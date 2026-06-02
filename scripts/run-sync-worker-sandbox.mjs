import { DEMO_TENANT_ID, withPostgres } from "./support-postgres-utils.mjs";

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) {
      throw new Error(`无法识别参数：${key}`);
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key.slice(2)] = true;
      continue;
    }

    args[key.slice(2)] = value;
    index += 1;
  }

  return args;
};

const requireArg = (args, key) => {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`缺少参数 --${key}`);
  }

  return value.trim();
};

const insertAudit = async (client, syncRun, event, metadata = {}) => {
  await client.query(
    `
      insert into audit_logs (tenant_id, actor, event, metadata)
      values ($1, $2, $3, $4::jsonb)
    `,
    [
      DEMO_TENANT_ID,
      syncRun.requested_by,
      event,
      JSON.stringify({
        syncRunId: syncRun.id,
        provider: syncRun.provider,
        queueName: syncRun.queue_name,
        jobId: syncRun.job_id,
        realSyncStarted: false,
        containsRealSecrets: false,
        containsCustomerData: false,
        sandboxWorker: true,
        note: "沙箱同步 worker 只更新同步审计状态，不触发真实平台同步。",
        ...metadata,
      }),
    ],
  );
};

const transitionSyncRun = async ({ syncRunId, outcome, failureReason }) => {
  return await withPostgres(async (pool) => {
    const client = await pool.connect();

    try {
      await client.query("begin");

      const locked = await client.query(
        `
          select id::text, provider, status, requested_by, queue_name, job_id, retry_count
          from sync_runs
          where id = $1
            and tenant_id = $2
          for update
        `,
        [syncRunId, DEMO_TENANT_ID],
      );
      const syncRun = locked.rows[0];
      if (!syncRun) {
        throw new Error(`找不到 sync_runs 记录：${syncRunId}`);
      }

      if (!["queued", "failed"].includes(syncRun.status)) {
        throw new Error(`当前状态不能进入沙箱 worker：${syncRun.status}`);
      }

      await client.query(
        `
          update sync_runs
          set status = 'running',
              started_at = coalesce(started_at, now()),
              real_sync_started = false,
              contains_real_secrets = false,
              contains_customer_data = false,
              metadata = metadata || $3::jsonb
          where id = $1
            and tenant_id = $2
        `,
        [
          syncRunId,
          DEMO_TENANT_ID,
          JSON.stringify({
            sandboxWorker: true,
            workerStartedAt: new Date().toISOString(),
            realSyncStarted: false,
          }),
        ],
      );

      await insertAudit(client, syncRun, "sync.running");

      if (outcome === "succeeded") {
        await client.query(
          `
            update sync_runs
            set status = 'succeeded',
                finished_at = now(),
                failure_reason = null,
                real_sync_started = false,
                contains_real_secrets = false,
                contains_customer_data = false,
                metadata = metadata || $3::jsonb
            where id = $1
              and tenant_id = $2
          `,
          [
            syncRunId,
            DEMO_TENANT_ID,
            JSON.stringify({
              workerFinishedAt: new Date().toISOString(),
              sandboxResult: "succeeded",
              realProviderTouched: false,
            }),
          ],
        );

        await insertAudit(client, syncRun, "sync.succeeded", { outcome: "succeeded" });
      } else {
        const finalFailureReason = failureReason || "沙箱模拟失败。";
        await client.query(
          `
            update sync_runs
            set status = 'failed',
                finished_at = now(),
                failure_reason = $3,
                retry_count = retry_count + 1,
                real_sync_started = false,
                contains_real_secrets = false,
                contains_customer_data = false,
                metadata = metadata || $4::jsonb
            where id = $1
              and tenant_id = $2
          `,
          [
            syncRunId,
            DEMO_TENANT_ID,
            finalFailureReason,
            JSON.stringify({
              workerFinishedAt: new Date().toISOString(),
              sandboxResult: "failed",
              realProviderTouched: false,
            }),
          ],
        );

        await insertAudit(client, syncRun, "sync.failed", {
          outcome: "failed",
          failureReason: finalFailureReason,
          retryCountAfterFailure: Number(syncRun.retry_count) + 1,
        });
      }

      await client.query("commit");
      return { syncRunId, outcome };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  });
};

try {
  const args = parseArgs(process.argv.slice(2));
  const syncRunId = requireArg(args, "sync-run-id");
  const outcome = requireArg(args, "outcome");
  if (!["succeeded", "failed"].includes(outcome)) {
    throw new Error("--outcome 只能是 succeeded 或 failed");
  }

  const result = await transitionSyncRun({
    syncRunId,
    outcome,
    failureReason: typeof args["failure-reason"] === "string" ? args["failure-reason"] : null,
  });

  console.log(
    JSON.stringify(
      {
        ...result,
        realSyncStarted: false,
        containsRealSecrets: false,
        containsCustomerData: false,
        noteZh: "沙箱同步 worker 已完成状态流转；未触发真实平台同步。",
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
