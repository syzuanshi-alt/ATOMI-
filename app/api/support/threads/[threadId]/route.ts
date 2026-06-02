import { NextResponse } from "next/server";
import { getDemoSnapshot } from "@/lib/demo-data";
import { requirePermission } from "@/lib/auth";

type ThreadRouteContext = {
  params: Promise<{
    threadId: string;
  }>;
};

export async function GET(request: Request, context: ThreadRouteContext) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  const { threadId } = await context.params;
  const snapshot = getDemoSnapshot();
  const thread = snapshot.supportThreads.find((item) => item.id === threadId);

  if (!thread) {
    return NextResponse.json({ error: "Support thread not found" }, { status: 404 });
  }

  const messages = snapshot.supportMessages.filter((item) => item.threadId === thread.id);
  const messageIds = new Set(messages.map((item) => item.id));

  return NextResponse.json({
    mode: "demo",
    note: "会话详情为模拟数据。真实模式必须从数据库按租户过滤后读取。",
    thread,
    customer: snapshot.supportCustomers.find((item) => item.id === thread.customerId) ?? null,
    identities: snapshot.customerIdentities.filter((item) => item.customerId === thread.customerId),
    messages,
    translations: snapshot.messageTranslations.filter((item) => messageIds.has(item.messageId)),
    aiReplySuggestions: snapshot.aiReplySuggestions.filter((item) => item.threadId === thread.id),
  });
}
