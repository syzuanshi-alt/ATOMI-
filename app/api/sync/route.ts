import { Queue } from "bullmq";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";

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

  const queue = new Queue("provider-sync", { connection: getBullMqConnection(process.env.REDIS_URL) });
  const job = await queue.add("sync", {
    provider: body.data.provider,
    requestedAt: new Date().toISOString(),
  });
  await queue.close();

  return NextResponse.json({ queued: true, jobId: job.id, provider: body.data.provider });
}
