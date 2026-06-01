import { Queue } from "bullmq";
import { NextResponse } from "next/server";
import IORedis from "ioredis";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";

const syncSchema = z.object({
  provider: z.enum(["shopify", "meta_ads", "tiktok_ads", "instagram_graph", "logistics", "support", "csv"]),
});

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "integrations.manage");
  if (forbidden) return forbidden;

  const body = syncSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  if (!process.env.REDIS_URL) {
    return NextResponse.json({
      queued: false,
      provider: body.data.provider,
      note: "REDIS_URL is not configured. Demo mode skipped queue creation.",
    });
  }

  const redis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  const queue = new Queue("provider-sync", { connection: redis });
  const job = await queue.add("sync", {
    provider: body.data.provider,
    requestedAt: new Date().toISOString(),
  });
  await queue.close();
  await redis.quit();

  return NextResponse.json({ queued: true, jobId: job.id, provider: body.data.provider });
}
