import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoSnapshot } from "@/lib/demo-data";
import { requireAiActionApproval, requirePermission } from "@/lib/auth";
import { decideAction } from "@/lib/workflows/actions";

const decisionSchema = z.object({
  actionId: z.string(),
  decision: z.enum(["approved", "rejected"]),
});

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "actions.read");
  if (forbidden) return forbidden;

  return NextResponse.json(getDemoSnapshot().aiActions);
}

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "actions.approve");
  if (forbidden) return forbidden;

  const body = decisionSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const action = getDemoSnapshot().aiActions.find((item) => item.id === body.data.actionId);
  if (!action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  const actionForbidden = requireAiActionApproval(request, action);
  if (actionForbidden) return actionForbidden;

  return NextResponse.json(decideAction(action, body.data.decision));
}
