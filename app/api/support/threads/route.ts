import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import {
  getSupportActor,
  getSupportRepository,
  getSupportRepositoryStatus,
  withSupportRepositoryStatus,
} from "@/lib/repositories/support-repository";

const inboundMessageSchema = z.object({
  channel: z.enum(["independent_site_chat", "independent_site_form", "email", "feishu"]),
  customerName: z.string().min(1).default("演示客户"),
  externalUserId: z.string().min(2).default("demo_user"),
  originalText: z.string().min(2),
  language: z.enum(["zh-CN", "en-US", "en-GB", "de-DE", "fr-FR"]).default("zh-CN"),
  orderRef: z.string().min(2).optional(),
});

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  const result = await getSupportRepository().listThreads(getSupportActor(request));
  return NextResponse.json(withSupportRepositoryStatus(result));
}

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "support.reply");
  if (forbidden) return forbidden;

  const repository = getSupportRepositoryStatus();
  if (repository.activeMode === "postgres") {
    return NextResponse.json(
      {
        error: "postgres_repository_read_only",
        message: "PostgreSQL Repository 当前仍阻断客户消息写入。模拟新消息进入仍请使用 Demo 模式，避免误写客户消息。",
        repository,
      },
      { status: 409 },
    );
  }

  const body = inboundMessageSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const result = await getSupportRepository().createInboundMessage(getSupportActor(request), body.data);
  return NextResponse.json(withSupportRepositoryStatus(result));
}
