import { Queue } from "bullmq";
import net from "node:net";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext, requirePermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSupportRepositoryStatus, withSupportRepositoryStatus } from "@/lib/repositories/support-repository";

const syncSchema = z.object({
  provider: z.enum(["shopify", "meta_ads", "tiktok_ads", "instagram_graph", "logistics", "support", "csv"]),
});

const POSTGRES_DEMO_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const SYNC_QUEUE_NAME = "provider-sync";

type SyncAuditStatus = "queued" | "skipped" | "failed";

type SyncAuditDraft = {
  provider: z.infer<typeof syncSchema>["provider"];
  status: SyncAuditStatus;
  mode: string;
  requestedBy: string;
  queueName: string;
  jobId: string | null;
  realSyncStarted: false;
  containsRealSecrets: false;
  containsCustomerData: false;
  startedAt: string;
  finishedAt: string;
  failureReason: string | null;
  retryCount: number;
};

const getBullMqConnection = (redisUrl: string) => {
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: Number(url.pathname.replace("/", "") || 0),
    maxRetriesPerRequest: null,
  };
};

const canReachRedis = async (redisUrl: string, timeoutMs = 800): Promise<{ ok: boolean; reason: string | null }> => {
  let connection: ReturnType<typeof getBullMqConnection>;

  try {
    connection = getBullMqConnection(redisUrl);
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host: connection.host, port: connection.port });
    const done = (ok: boolean, reason: string | null) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ ok, reason });
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true, null));
    socket.once("timeout", () => done(false, `Redis 连接超过 ${timeoutMs}ms 未响应。`));
    socket.once("error", (error) => done(false, error.message));
  });
};

const withQueueTimeout = async <T,>(operation: Promise<T>, timeoutMs = 1500): Promise<T> => {
  return await Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Redis 队列操作超过 ${timeoutMs}ms 未完成。`)), timeoutMs);
    }),
  ]);
};

const persistSyncAudit = async (audit: SyncAuditDraft, metadata: Record<string, unknown>) => {
  const client = await getDb().connect();

  try {
    await client.query("begin");
    const runResult = await client.query<{ id: string }>(
      `
        insert into sync_runs (
          tenant_id, provider, status, mode, requested_by, queue_name, job_id,
          real_sync_started, contains_real_secrets, contains_customer_data,
          started_at, finished_at, failure_reason, retry_count, metadata
        )
        values (
          $1, $2, $3, $4, $5, $6, $7,
          false, false, false,
          $8, $9, $10, $11, $12::jsonb
        )
        returning id::text
      `,
      [
        POSTGRES_DEMO_TENANT_ID,
        audit.provider,
        audit.status,
        audit.mode,
        audit.requestedBy,
        audit.queueName,
        audit.jobId,
        audit.startedAt,
        audit.finishedAt,
        audit.failureReason,
        audit.retryCount,
        JSON.stringify(metadata),
      ],
    );
    const syncRunId = runResult.rows[0]?.id ?? null;

    await client.query(
      `
        insert into audit_logs (tenant_id, actor, event, metadata)
        values ($1, $2, $3, $4::jsonb)
      `,
      [
        POSTGRES_DEMO_TENANT_ID,
        audit.requestedBy,
        `sync.${audit.status}`,
        JSON.stringify({
          syncRunId,
          provider: audit.provider,
          queueName: audit.queueName,
          jobId: audit.jobId,
          realSyncStarted: false,
          containsRealSecrets: false,
          containsCustomerData: false,
          note: "PostgreSQL 沙箱记录 Demo 同步尝试；未触发真实平台同步。",
        }),
      ],
    );

    await client.query("commit");
    return syncRunId;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
};

const buildSyncAudit = (
  draft: SyncAuditDraft,
  persistenceMode: "demo_response_only" | "postgres_sandbox",
  syncRunId: string | null,
) => ({
  ...draft,
  syncRunId,
  persistenceTable: "sync_runs",
  auditTable: "audit_logs",
  persistenceMode,
  noteZh:
    persistenceMode === "postgres_sandbox"
      ? "已写入 PostgreSQL 沙箱同步日志；这仍不代表真实平台同步。"
      : "Demo 模式仅在响应中返回同步审计目标；这不代表真实平台同步。",
});

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "integrations.manage");
  if (forbidden) return forbidden;

  const actor = getRequestContext(request);
  const repositoryStatus = getSupportRepositoryStatus();
  const body = syncSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const startedAt = new Date().toISOString();

  const basePayload = {
    mode: actor.mode,
    provider: body.data.provider,
    requestedBy: actor.actorRef,
    realSyncStarted: false,
    guardrails: {
      noRealPlatformWrite: true,
      noRealSecretsRequired: true,
      noCustomerDataSynced: true,
      manualReviewBeforeLiveMode: true,
      demoQueueOnly: true,
    },
  };

  const makeAudit = (input: {
    status: SyncAuditStatus;
    jobId?: string | null;
    failureReason?: string | null;
  }): SyncAuditDraft => ({
    provider: body.data.provider,
    status: input.status,
    mode: actor.mode,
    requestedBy: actor.actorRef,
    queueName: SYNC_QUEUE_NAME,
    jobId: input.jobId ?? null,
    realSyncStarted: false,
    containsRealSecrets: false,
    containsCustomerData: false,
    startedAt,
    finishedAt: new Date().toISOString(),
    failureReason: input.failureReason ?? null,
    retryCount: 0,
  });

  const finalize = async (
    payload: typeof basePayload & {
      queued: boolean;
      queueName: string;
      jobName?: string;
      jobId?: string;
      queueError?: string;
      noteZh: string;
      note: string;
    },
    audit: SyncAuditDraft,
  ) => {
    const persistenceMode = repositoryStatus.activeMode === "postgres" ? "postgres_sandbox" : "demo_response_only";
    const syncRunId =
      persistenceMode === "postgres_sandbox"
        ? await persistSyncAudit(audit, {
            queued: payload.queued,
            queueError: payload.queueError ?? null,
            noteZh: payload.noteZh,
            guardrails: payload.guardrails,
            repositoryMode: repositoryStatus.activeMode,
          })
        : null;

    return NextResponse.json(
      withSupportRepositoryStatus({
        ...payload,
        note: payload.note,
        syncAudit: buildSyncAudit(audit, persistenceMode, syncRunId),
      }),
    );
  };

  if (!process.env.REDIS_URL) {
    const audit = makeAudit({ status: "skipped", failureReason: "未配置 REDIS_URL。" });
    return finalize(
      {
        ...basePayload,
        queued: false,
        queueName: SYNC_QUEUE_NAME,
        noteZh: "未配置 REDIS_URL（Redis 队列地址），已跳过 Demo 同步排队；这不代表真实平台同步。",
        note: "未配置 REDIS_URL，已跳过 Demo 同步排队；这不代表真实平台同步。",
      },
      audit,
    );
  }

  const redisProbe = await canReachRedis(process.env.REDIS_URL);
  if (!redisProbe.ok) {
    const audit = makeAudit({ status: "skipped", failureReason: redisProbe.reason ?? "Redis 队列不可用。" });
    return finalize(
      {
        ...basePayload,
        queued: false,
        queueName: SYNC_QUEUE_NAME,
        queueError: redisProbe.reason ?? "Redis 队列不可用。",
        noteZh: "Redis 队列不可用，已快速跳过 Demo 同步排队；这不代表真实平台同步。",
        note: "Redis 队列不可用，已快速跳过 Demo 同步排队；这不代表真实平台同步。",
      },
      audit,
    );
  }

  const queue = new Queue(SYNC_QUEUE_NAME, { connection: getBullMqConnection(process.env.REDIS_URL) });

  try {
    const job = await withQueueTimeout(
      queue.add("sync", {
        provider: body.data.provider,
        requestedAt: startedAt,
        requestedBy: actor.actorRef,
        tenantId: actor.tenantId,
        mode: actor.mode,
        realSyncStarted: false,
      }),
    );

    const audit = makeAudit({ status: "queued", jobId: job.id ?? null });
    return finalize(
      {
        ...basePayload,
        queued: true,
        queueName: SYNC_QUEUE_NAME,
        jobName: "sync",
        jobId: job.id,
        noteZh: "Demo 同步任务已排队，但只代表本地队列收到任务，不代表真实平台同步。",
        note: "Demo 同步任务已排队，但只代表本地队列收到任务，不代表真实平台同步。",
      },
      audit,
    );
  } catch (error) {
    const queueError = error instanceof Error ? error.message : String(error);
    const audit = makeAudit({ status: "failed", failureReason: queueError });
    return finalize(
      {
        ...basePayload,
        queued: false,
        queueName: SYNC_QUEUE_NAME,
        queueError,
        noteZh: "Redis 队列不可用，已跳过 Demo 同步排队；这不代表真实平台同步。",
        note: "Redis 队列不可用，已跳过 Demo 同步排队；这不代表真实平台同步。",
      },
      audit,
    );
  } finally {
    await queue.close();
  }
}
