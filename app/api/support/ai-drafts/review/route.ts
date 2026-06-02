import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { getSupportActor, getSupportRepository, withSupportRepositoryStatus } from "@/lib/repositories/support-repository";

const aiDraftReviewSchema = z.object({
  draftId: z.string().min(2),
  decision: z.enum(["approved", "rejected"]),
  finalText: z.string().min(1).max(5000).optional(),
  reviewNote: z.string().max(1000).optional(),
  humanEdited: z.boolean().optional(),
});

export async function POST(request: Request) {
  const replyForbidden = requirePermission(request, "support.reply");
  if (replyForbidden) return replyForbidden;

  const approvalForbidden = requirePermission(request, "actions.approve");
  if (approvalForbidden) return approvalForbidden;

  const body = aiDraftReviewSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const result = await getSupportRepository().reviewAiDraft(getSupportActor(request), body.data);

  if (!result) {
    return NextResponse.json({ error: "ai_reply_draft_not_found", message: "AI 回复草稿不存在。" }, { status: 404 });
  }

  return NextResponse.json(withSupportRepositoryStatus(result));
}
