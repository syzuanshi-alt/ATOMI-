import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getSupportActor, getSupportRepository, withSupportRepositoryStatus } from "@/lib/repositories/support-repository";

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
    return NextResponse.json({ error: "support_thread_not_found", message: "客服会话不存在。" }, { status: 404 });
  }

  return NextResponse.json(withSupportRepositoryStatus(result));
}
