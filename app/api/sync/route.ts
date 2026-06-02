import { Queue } from "bullmq";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext, requirePermission } from "@/lib/auth";

const syncSchema = z.object({
  provider: z.enum(["shopify", "meta_ads", "tiktok_ads", "instagram_graph", "logistics", "support", "csv"]),
});

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

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "integrations.manage");
  if (forbidden) return forbidden;

  const actor = getRequestContext(request);
  const body = syncSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

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

  if (!process.env.REDIS_URL) {
    return NextResponse.json({
      ...basePayload,
      queued: false,
      queueName: "provider-sync",
      noteZh: "未配置 REDIS_URL（Redis 队列地址），已跳过 Demo 同步排队；这不代表真实平台同步。",
      note: "未配置 REDIS_URL，已跳过 Demo 同步排队；这不代表真实平台同步。",
    });
  }

  const queue = new Queue("provider-sync", { connection: getBullMqConnection(process.env.REDIS_URL) });

  try {
    const job = await queue.add("sync", {
      provider: body.data.provider,
      requestedAt: new Date().toISOString(),
      requestedBy: actor.actorRef,
      tenantId: actor.tenantId,
      mode: actor.mode,
      realSyncStarted: false,
    });

    return NextResponse.json({
      ...basePayload,
      queued: true,
      queueName: "provider-sync",
      jobName: "sync",
      jobId: job.id,
      noteZh: "Demo 同步任务已排队，但只代表本地队列收到任务，不代表真实平台同步。",
      note: "Demo 同步任务已排队，但只代表本地队列收到任务，不代表真实平台同步。",
    });
  } catch (error) {
    return NextResponse.json({
      ...basePayload,
      queued: false,
      queueName: "provider-sync",
      queueError: error instanceof Error ? error.message : String(error),
      noteZh: "Redis 队列不可用，已跳过 Demo 同步排队；这不代表真实平台同步。",
      note: "Redis 队列不可用，已跳过 Demo 同步排队；这不代表真实平台同步。",
    });
  } finally {
    await queue.close();
  }
}
