import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { getSupportActor, getSupportRepository, withSupportRepositoryStatus } from "@/lib/repositories/support-repository";

const aiDraftSchema = z.object({
  threadId: z.string().min(2),
  messageId: z.string().min(2).optional(),
});

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "support.reply");
  if (forbidden) return forbidden;

  const body = aiDraftSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const result = await getSupportRepository().createAiDraft(getSupportActor(request), body.data);

  if (!result) {
    return NextResponse.json({ error: "support_thread_or_message_not_found", message: "客服会话或消息不存在。" }, { status: 404 });
  }

  return NextResponse.json(withSupportRepositoryStatus(result));
}
