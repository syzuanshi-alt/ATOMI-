import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoSnapshot } from "@/lib/demo-data";
import { requirePermission } from "@/lib/auth";
import { buildSupportReplyDraft } from "@/lib/workflows/support";

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

  const snapshot = getDemoSnapshot();
  const thread = snapshot.supportThreads.find((item) => item.id === body.data.threadId);
  if (!thread) {
    return NextResponse.json({ error: "Support thread not found" }, { status: 404 });
  }

  const threadMessages = snapshot.supportMessages.filter((item) => item.threadId === thread.id);
  const message = body.data.messageId
    ? threadMessages.find((item) => item.id === body.data.messageId)
    : threadMessages.at(-1);

  if (!message) {
    return NextResponse.json({ error: "Support message not found" }, { status: 404 });
  }

  const draft = buildSupportReplyDraft(thread, message);

  return NextResponse.json({
    mode: "demo",
    persisted: false,
    note: "AI 回复草稿为模拟生成结果。真实模式必须写入 ai_reply_suggestions、ai_outputs、ai_approvals 和 audit_logs。",
    draft,
    guardrail: draft.canAutoSend
      ? "低风险内容可进入托管候选，但仍需记录。"
      : "中高风险内容必须人工审核，不能自动发送。",
  });
}
