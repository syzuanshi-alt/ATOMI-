import type {
  AiApprovalRecord,
  AiReplySuggestion,
  CustomerIdentity,
  HandoffReport,
  MessageTranslation,
  SupportChannel,
  SupportCustomer,
  SupportMessage,
  SupportRiskLevel,
  SupportThread,
} from "@/lib/types";
import type { AppRequestContext, RequestMode } from "@/lib/request-context";

export type SupportRepositoryMode = RequestMode;

export type SupportActor = AppRequestContext;

export type SupportAuditAction =
  | "support.thread.list"
  | "support.thread.read"
  | "support.message.ingest"
  | "support.ai_draft.generate"
  | "support.ai_draft.review"
  | "support.handoff_report.read";

export type SupportAuditEvent = {
  id: string;
  tenantId: string;
  actorRef: string;
  action: SupportAuditAction;
  targetType: "customer_thread" | "message" | "ai_reply_suggestion" | "ai_approval" | "handoff_report";
  targetId: string | null;
  riskLevel: SupportRiskLevel | null;
  result: "demo_read" | "demo_created" | "demo_reviewed" | "blocked";
  note: string;
  persistenceTable: "audit_logs";
  createdAt: string;
};

export type SupportPersistenceTarget = {
  table: string;
  purpose: string;
  usedByApis: string[];
  requiredForLiveMode: boolean;
};

export type CreateInboundSupportMessageInput = {
  channel: Extract<SupportChannel, "independent_site_chat" | "independent_site_form" | "email" | "feishu">;
  customerName: string;
  externalUserId: string;
  originalText: string;
  language: SupportCustomer["language"];
  orderRef?: string;
};

export type CreateAiDraftInput = {
  threadId: string;
  messageId?: string;
};

export type ReviewAiDraftInput = {
  draftId: string;
  decision: AiApprovalRecord["decision"];
  finalText?: string;
  reviewNote?: string;
  humanEdited?: boolean;
};

export type SupportThreadListResult = {
  mode: SupportRepositoryMode;
  note: string;
  threads: SupportThread[];
  customers: SupportCustomer[];
  identities: CustomerIdentity[];
  persistenceTargets: SupportPersistenceTarget[];
  auditEvents: SupportAuditEvent[];
};

export type SupportThreadDetailResult = {
  mode: SupportRepositoryMode;
  note: string;
  thread: SupportThread;
  customer: SupportCustomer | null;
  identities: CustomerIdentity[];
  messages: SupportMessage[];
  translations: MessageTranslation[];
  aiReplySuggestions: AiReplySuggestion[];
  persistenceTargets: SupportPersistenceTarget[];
  auditEvents: SupportAuditEvent[];
};

export type CreateInboundSupportMessageResult = {
  mode: SupportRepositoryMode;
  persisted: false;
  note: string;
  thread: SupportThread;
  message: SupportMessage;
  draft: AiReplySuggestion;
  persistenceTargets: SupportPersistenceTarget[];
  auditEvents: SupportAuditEvent[];
};

export type CreateAiDraftResult = {
  mode: SupportRepositoryMode;
  persisted: false;
  note: string;
  draft: AiReplySuggestion;
  guardrail: string;
  persistenceTargets: SupportPersistenceTarget[];
  auditEvents: SupportAuditEvent[];
};

export type ReviewAiDraftResult = {
  mode: SupportRepositoryMode;
  persisted: false;
  note: string;
  draft: AiReplySuggestion;
  approval: AiApprovalRecord;
  guardrail: string;
  persistenceTargets: SupportPersistenceTarget[];
  auditEvents: SupportAuditEvent[];
};

export type HandoffReportResult = {
  mode: SupportRepositoryMode;
  note: string;
  reports: HandoffReport[];
  highRiskThreads: SupportThread[];
  needsHumanThreads: SupportThread[];
  persistenceTargets: SupportPersistenceTarget[];
  auditEvents: SupportAuditEvent[];
};

export type SupportRepository = {
  listThreads(actor: SupportActor): Promise<SupportThreadListResult>;
  getThreadDetail(actor: SupportActor, threadId: string): Promise<SupportThreadDetailResult | null>;
  createInboundMessage(actor: SupportActor, input: CreateInboundSupportMessageInput): Promise<CreateInboundSupportMessageResult>;
  createAiDraft(actor: SupportActor, input: CreateAiDraftInput): Promise<CreateAiDraftResult | null>;
  reviewAiDraft(actor: SupportActor, input: ReviewAiDraftInput): Promise<ReviewAiDraftResult | null>;
  getHandoffReport(actor: SupportActor): Promise<HandoffReportResult>;
};

export const supportPersistenceTargets: SupportPersistenceTarget[] = [
  {
    table: "support_channels",
    purpose: "保存客服渠道类型、状态和接入难度，例如独立站客服、邮件、飞书、WhatsApp。",
    usedByApis: ["GET /api/support/threads", "POST /api/support/threads"],
    requiredForLiveMode: true,
  },
  {
    table: "support_channel_accounts",
    purpose: "保存每个客户公司的渠道账号和授权范围，真实密钥必须加密。",
    usedByApis: ["POST /api/support/threads"],
    requiredForLiveMode: true,
  },
  {
    table: "customers",
    purpose: "保存客户基础资料，按租户隔离。",
    usedByApis: ["GET /api/support/threads/[threadId]", "POST /api/support/threads"],
    requiredForLiveMode: true,
  },
  {
    table: "customer_identities",
    purpose: "把同一客户在不同平台的身份合并，例如邮箱、独立站访客 ID、社媒账号。",
    usedByApis: ["GET /api/support/threads", "GET /api/support/threads/[threadId]"],
    requiredForLiveMode: true,
  },
  {
    table: "customer_threads",
    purpose: "保存统一会话，承载渠道、风险等级、状态、订单号和最后消息时间。",
    usedByApis: ["GET /api/support/threads", "GET /api/support/threads/[threadId]", "POST /api/support/threads"],
    requiredForLiveMode: true,
  },
  {
    table: "messages",
    purpose: "保存客户原文、方向、发送人和原始平台 payload。",
    usedByApis: ["GET /api/support/threads/[threadId]", "POST /api/support/threads", "POST /api/support/ai-drafts"],
    requiredForLiveMode: true,
  },
  {
    table: "message_translations",
    purpose: "保存中文翻译和是否人工修改，避免客服只看外语误判。",
    usedByApis: ["GET /api/support/threads/[threadId]"],
    requiredForLiveMode: true,
  },
  {
    table: "ai_reply_suggestions",
    purpose: "保存 AI 回复草稿、风险等级、原因、状态和是否允许低风险托管候选。",
    usedByApis: ["GET /api/support/threads/[threadId]", "POST /api/support/threads", "POST /api/support/ai-drafts", "POST /api/support/ai-drafts/review"],
    requiredForLiveMode: true,
  },
  {
    table: "ai_autoreplies",
    purpose: "只记录真正由 AI 托管发送的低风险回复；中高风险必须 blocked。",
    usedByApis: ["POST /api/support/ai-drafts"],
    requiredForLiveMode: true,
  },
  {
    table: "handoff_reports",
    purpose: "保存离线托管日报，方便客服上班后按优先级接管。",
    usedByApis: ["GET /api/support/handoff-report"],
    requiredForLiveMode: true,
  },
  {
    table: "ai_approvals",
    purpose: "保存人工确认或驳回记录，证明 AI 没有绕过人工审核。",
    usedByApis: ["POST /api/support/ai-drafts", "POST /api/support/ai-drafts/review"],
    requiredForLiveMode: true,
  },
  {
    table: "audit_logs",
    purpose: "保存谁在什么时间读取、生成、接管或审核了客服动作。",
    usedByApis: ["GET /api/support/threads", "GET /api/support/threads/[threadId]", "POST /api/support/threads", "POST /api/support/ai-drafts", "POST /api/support/ai-drafts/review", "GET /api/support/handoff-report"],
    requiredForLiveMode: true,
  },
];
