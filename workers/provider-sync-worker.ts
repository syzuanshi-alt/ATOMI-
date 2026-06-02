import { Worker } from "bullmq";
import { Pool, type PoolClient } from "pg";
import { callProvider } from "@/lib/connectors/base";
import type { Provider } from "@/lib/types";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required to run provider-sync-worker.");
}

const getBullMqConnection = (redisConnectionUrl: string) => {
  const url = new URL(redisConnectionUrl);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: Number(url.pathname.replace("/", "") || 0),
    maxRetriesPerRequest: null,
  };
};

const connection = getBullMqConnection(redisUrl);
const POSTGRES_DEMO_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const databaseUrl = process.env.DATABASE_URL?.trim();
const syncAuditPool = databaseUrl ? new Pool({ connectionString: databaseUrl, max: 2 }) : null;

type SyncJob = {
  provider: Provider;
  requestedAt: string;
  requestedBy?: string;
  realSyncStarted?: false;
};

type SyncRunForWorker = {
  id: string;
  provider: string;
  requested_by: string;
  queue_name: string | null;
  job_id: string | null;
  retry_count: number;
};

const insertSyncAudit = async (
  client: PoolClient,
  syncRun: SyncRunForWorker,
  event: "sync.running" | "sync.succeeded" | "sync.failed",
  metadata: Record<string, unknown> = {},
) => {
  await client.query(
    `
      insert into audit_logs (tenant_id, actor, event, metadata)
      values ($1, $2, $3, $4::jsonb)
    `,
    [
      POSTGRES_DEMO_TENANT_ID,
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
        worker: "provider-sync-worker",
        note: "BullMQ worker 当前只执行 Demo 沙箱流转，不触发真实平台同步。",
        ...metadata,
      }),
    ],
  );
};

const updateSyncRunByJobId = async (
  jobId: string | undefined,
  status: "running" | "succeeded" | "failed",
  failureReason: string | null = null,
) => {
  if (!syncAuditPool || !jobId) {
    return;
  }

  const client = await syncAuditPool.connect();

  try {
    await client.query("begin");
    const locked = await client.query<SyncRunForWorker>(
      `
        select id::text, provider, requested_by, queue_name, job_id, retry_count
        from sync_runs
        where tenant_id = $1
          and job_id = $2
        for update
      `,
      [POSTGRES_DEMO_TENANT_ID, jobId],
    );
    const syncRun = locked.rows[0];
    if (!syncRun) {
      await client.query("commit");
      return;
    }

    if (status === "running") {
      await client.query(
        `
          update sync_runs
          set status = 'running',
              started_at = coalesce(started_at, now()),
              real_sync_started = false,
              contains_real_secrets = false,
              contains_customer_data = false,
              metadata = metadata || $3::jsonb
          where tenant_id = $1
            and id = $2
        `,
        [
          POSTGRES_DEMO_TENANT_ID,
          syncRun.id,
          JSON.stringify({
            workerStartedAt: new Date().toISOString(),
            realProviderTouched: false,
          }),
        ],
      );
      await insertSyncAudit(client, syncRun, "sync.running");
    }

    if (status === "succeeded") {
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
          where tenant_id = $1
            and id = $2
        `,
        [
          POSTGRES_DEMO_TENANT_ID,
          syncRun.id,
          JSON.stringify({
            workerFinishedAt: new Date().toISOString(),
            sandboxResult: "succeeded",
            realProviderTouched: false,
          }),
        ],
      );
      await insertSyncAudit(client, syncRun, "sync.succeeded");
    }

    if (status === "failed") {
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
          where tenant_id = $1
            and id = $2
        `,
        [
          POSTGRES_DEMO_TENANT_ID,
          syncRun.id,
          failureReason ?? "provider-sync-worker Demo 沙箱失败。",
          JSON.stringify({
            workerFinishedAt: new Date().toISOString(),
            sandboxResult: "failed",
            realProviderTouched: false,
          }),
        ],
      );
      await insertSyncAudit(client, syncRun, "sync.failed", {
        failureReason,
        retryCountAfterFailure: syncRun.retry_count + 1,
      });
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
};

new Worker<SyncJob>(
  "provider-sync",
  async (job) => {
    const { provider } = job.data;

    await updateSyncRunByJobId(job.id, "running");

    try {
      const result = await callProvider(
        {
          provider,
          endpoint: "scheduled_sync",
          accountRef: "demo-account",
        },
        async () => ({
          synced: true,
          provider,
          realSyncStarted: false,
          containsRealSecrets: false,
          containsCustomerData: false,
          note: "Demo worker only. Replace this fetcher with verified read-only provider API responses after official access is granted.",
          noteZh: "当前 worker 只跑 Demo 沙箱，不读取真实平台，不写真实密钥，不同步真实客户数据。",
        }),
      );

      await updateSyncRunByJobId(job.id, "succeeded");
      return result;
    } catch (error) {
      await updateSyncRunByJobId(job.id, "failed", error instanceof Error ? error.message : String(error));
      throw error;
    }
  },
  { connection },
);
