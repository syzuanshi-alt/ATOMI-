import "server-only";
import { getDemoSnapshot } from "@/lib/demo-data";
import { buildSupportReplyDraft, classifySupportRisk } from "@/lib/workflows/support";
import type { SupportMessage, SupportThread } from "@/lib/types";
import type {
  CreateAiDraftInput,
  CreateAiDraftResult,
  CreateInboundSupportMessageInput,
  CreateInboundSupportMessageResult,
  HandoffReportResult,
  SupportActor,
  SupportAuditAction,
  SupportAuditEvent,
  SupportRepository,
  SupportThreadDetailResult,
  SupportThreadListResult,
} from "@/lib/repositories/support-types";
import { supportPersistenceTargets } from "@/lib/repositories/support-types";

const buildAuditEvent = (
  actor: SupportActor,
  action: SupportAuditAction,
  target: Pick<SupportAuditEvent, "targetType" | "targetId" | "riskLevel" | "result" | "note">,
): SupportAuditEvent => ({
  id: `audit_${action}_${Date.now()}`,
  tenantId: actor.tenantId,
  actorRef: actor.actorRef,
  action,
  targetType: target.targetType,
  targetId: target.targetId,
  riskLevel: target.riskLevel,
  result: target.result,
  note: target.note,
  persistenceTable: "audit_logs",
  createdAt: new Date().toISOString(),
});

export const demoSupportRepository: SupportRepository = {
  async listThreads(actor: SupportActor): Promise<SupportThreadListResult> {
    const snapshot = getDemoSnapshot();

    return {
      mode: "demo",
      note: "统一客服会话列表为模拟数据。真实模式必须接入登录、租户、权限、数据库和审计日志。",
      threads: snapshot.supportThreads,
      customers: snapshot.supportCustomers,
      identities: snapshot.customerIdentities,
      persistenceTargets: supportPersistenceTargets,
      auditEvents: [
        buildAuditEvent(actor, "support.thread.list", {
          targetType: "customer_thread",
          targetId: null,
          riskLevel: null,
          result: "demo_read",
          note: "Demo 模式仅读取内置客服会话；真实模式必须按 tenant_id 查询 customer_threads。",
        }),
      ],
    };
  },

  async getThreadDetail(actor: SupportActor, threadId: string): Promise<SupportThreadDetailResult | null> {
    const snapshot = getDemoSnapshot();
    const thread = snapshot.supportThreads.find((item) => item.id === threadId);

    if (!thread) {
      return null;
    }

    const messages = snapshot.supportMessages.filter((item) => item.threadId === thread.id);
    const messageIds = new Set(messages.map((item) => item.id));

    return {
      mode: "demo",
      note: "会话详情为模拟数据。真实模式必须从数据库按租户过滤后读取。",
      thread,
      customer: snapshot.supportCustomers.find((item) => item.id === thread.customerId) ?? null,
      identities: snapshot.customerIdentities.filter((item) => item.customerId === thread.customerId),
      messages,
      translations: snapshot.messageTranslations.filter((item) => messageIds.has(item.messageId)),
      aiReplySuggestions: snapshot.aiReplySuggestions.filter((item) => item.threadId === thread.id),
      persistenceTargets: supportPersistenceTargets,
      auditEvents: [
        buildAuditEvent(actor, "support.thread.read", {
          targetType: "customer_thread",
          targetId: thread.id,
          riskLevel: thread.riskLevel,
          result: "demo_read",
          note: "Demo 模式读取会话详情；真实模式必须同时写入 audit_logs 证明谁查看了客户消息。",
        }),
      ],
    };
  },

  async createInboundMessage(
    actor: SupportActor,
    input: CreateInboundSupportMessageInput,
  ): Promise<CreateInboundSupportMessageResult> {
    const createdAt = new Date().toISOString();
    const riskLevel = classifySupportRisk(input.originalText);
    const stableSuffix = Date.now();
    const thread: SupportThread = {
      id: `demo_thread_${stableSuffix}`,
      customerId: "demo_customer",
      channel: input.channel,
      subject: input.orderRef ? `客户咨询订单 ${input.orderRef}` : "客户新消息",
      status: riskLevel === "high" ? "needs_human" : "ai_managed",
      riskLevel,
      language: input.language,
      orderRef: input.orderRef ?? null,
      lastMessageAt: createdAt,
    };
    const message: SupportMessage = {
      id: `demo_message_${stableSuffix}`,
      threadId: thread.id,
      channel: thread.channel,
      direction: "inbound",
      senderType: "customer",
      senderRef: input.externalUserId,
      originalText: input.originalText,
      createdAt,
    };
    const draft = buildSupportReplyDraft(thread, message);

    return {
      mode: "demo",
      persisted: false,
      note: "这是模拟消息进入结果。真实模式必须写入数据库、同步审计日志，并记录原始平台 payload。",
      thread,
      message,
      draft,
      persistenceTargets: supportPersistenceTargets,
      auditEvents: [
        buildAuditEvent(actor, "support.message.ingest", {
          targetType: "message",
          targetId: message.id,
          riskLevel,
          result: "demo_created",
          note: "Demo 模式只返回临时消息；真实模式必须写入 customers、customer_identities、customer_threads、messages 和 audit_logs。",
        }),
        buildAuditEvent(actor, "support.ai_draft.generate", {
          targetType: "ai_reply_suggestion",
          targetId: draft.id,
          riskLevel: draft.riskLevel,
          result: "demo_created",
          note: draft.canAutoSend
            ? "低风险草稿可进入托管候选，但真实发送仍需记录 ai_autoreplies。"
            : "中高风险草稿必须进入人工审核，不允许自动发送。",
        }),
      ],
    };
  },

  async createAiDraft(actor: SupportActor, input: CreateAiDraftInput): Promise<CreateAiDraftResult | null> {
    const snapshot = getDemoSnapshot();
    const thread = snapshot.supportThreads.find((item) => item.id === input.threadId);
    if (!thread) {
      return null;
    }

    const threadMessages = snapshot.supportMessages.filter((item) => item.threadId === thread.id);
    const message = input.messageId ? threadMessages.find((item) => item.id === input.messageId) : threadMessages.at(-1);

    if (!message) {
      return null;
    }

    const draft = buildSupportReplyDraft(thread, message);

    return {
      mode: "demo",
      persisted: false,
      note: "AI 回复草稿为模拟生成结果。真实模式必须写入 ai_reply_suggestions、ai_outputs、ai_approvals 和 audit_logs。",
      draft,
      guardrail: draft.canAutoSend ? "低风险内容可进入托管候选，但仍需记录。" : "中高风险内容必须人工审核，不能自动发送。",
      persistenceTargets: supportPersistenceTargets,
      auditEvents: [
        buildAuditEvent(actor, "support.ai_draft.generate", {
          targetType: "ai_reply_suggestion",
          targetId: draft.id,
          riskLevel: draft.riskLevel,
          result: "demo_created",
          note: draft.canAutoSend
            ? "低风险草稿只表示可进入托管候选，真实发送必须写入 ai_autoreplies 和 audit_logs。"
            : "中高风险草稿必须进入 ai_approvals 人工审核，不能自动发送。",
        }),
      ],
    };
  },

  async getHandoffReport(actor: SupportActor): Promise<HandoffReportResult> {
    const snapshot = getDemoSnapshot();

    return {
      mode: "demo",
      note: "离线托管日报为模拟数据。真实模式必须按租户、时间窗口和客服排班生成。",
      reports: snapshot.handoffReports,
      highRiskThreads: snapshot.supportThreads.filter((item) => item.riskLevel === "high"),
      needsHumanThreads: snapshot.supportThreads.filter((item) => item.status === "needs_human"),
      persistenceTargets: supportPersistenceTargets,
      auditEvents: [
        buildAuditEvent(actor, "support.handoff_report.read", {
          targetType: "handoff_report",
          targetId: snapshot.handoffReports[0]?.id ?? null,
          riskLevel: null,
          result: "demo_read",
          note: "Demo 模式读取固定日报；真实模式必须按时间窗口生成 handoff_reports 并写入 audit_logs。",
        }),
      ],
    };
  },
};
