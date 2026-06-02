import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getSupportActor, getSupportRepository } from "@/lib/repositories/support-repository";

type ThreadRouteContext = {
  params: Promise<{
    threadId: string;
  }>;
};

export async function GET(request: Request, context: ThreadRouteContext) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  const { threadId } = await context.params;
  const result = await getSupportRepository().getThreadDetail(getSupportActor(request), threadId);

  if (!result) {
    return NextResponse.json({ error: "Support thread not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
