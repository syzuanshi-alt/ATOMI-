import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoSnapshot } from "@/lib/demo-data";
import { requirePermission } from "@/lib/auth";
import { buildSupportReplyDraft, classifySupportRisk } from "@/lib/workflows/support";
import type { SupportChannel, SupportMessage, SupportThread } from "@/lib/types";

const inboundMessageSchema = z.object({
  channel: z.enum(["independent_site_chat", "independent_site_form", "email", "feishu"]),
  customerName: z.string().min(1).default("Demo Customer"),
  externalUserId: z.string().min(2).default("demo_user"),
  originalText: z.string().min(2),
  language: z.enum(["zh-CN", "en-US", "en-GB", "de-DE", "fr-FR"]).default("zh-CN"),
  orderRef: z.string().min(2).optional(),
});

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  const snapshot = getDemoSnapshot();

  return NextResponse.json({
    mode: "demo",
    note: "统一客服会话列表为模拟数据。真实模式必须接入登录、租户、权限、数据库和审计日志。",
    threads: snapshot.supportThreads,
    customers: snapshot.supportCustomers,
    identities: snapshot.customerIdentities,
  });
}

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "support.reply");
  if (forbidden) return forbidden;

  const body = inboundMessageSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const riskLevel = classifySupportRisk(body.data.originalText);
  const thread: SupportThread = {
    id: `demo_thread_${Date.now()}`,
    customerId: "demo_customer",
    channel: body.data.channel as SupportChannel,
    subject: body.data.orderRef ? `客户咨询订单 ${body.data.orderRef}` : "客户新消息",
    status: riskLevel === "high" ? "needs_human" : "ai_managed",
    riskLevel,
    language: body.data.language,
    orderRef: body.data.orderRef ?? null,
    lastMessageAt: createdAt,
  };
  const message: SupportMessage = {
    id: `demo_message_${Date.now()}`,
    threadId: thread.id,
    channel: thread.channel,
    direction: "inbound",
    senderType: "customer",
    senderRef: body.data.externalUserId,
    originalText: body.data.originalText,
    createdAt,
  };
  const draft = buildSupportReplyDraft(thread, message);

  return NextResponse.json({
    mode: "demo",
    persisted: false,
    note: "这是模拟消息进入结果。真实模式必须写入数据库、同步审计日志，并记录原始平台 payload。",
    thread,
    message,
    draft,
  });
}
