import "server-only";
import { query } from "@/lib/db";
import type {
  AiReplySuggestion,
  CountryCode,
  CustomerIdentity,
  HandoffReport,
  MessageTranslation,
  SupportChannel,
  SupportCustomer,
  SupportMessage,
  SupportMessageDirection,
  SupportRiskLevel,
  SupportSenderType,
  SupportThread,
  SupportThreadStatus,
} from "@/lib/types";
import type {
  CreateAiDraftResult,
  CreateInboundSupportMessageResult,
  HandoffReportResult,
  ReviewAiDraftResult,
  SupportActor,
  SupportAuditAction,
  SupportAuditEvent,
  SupportRepository,
  SupportThreadDetailResult,
  SupportThreadListResult,
} from "@/lib/repositories/support-types";
import { supportPersistenceTargets } from "@/lib/repositories/support-types";

const POSTGRES_DEMO_TENANT_ID = "11111111-1111-4111-8111-111111111111";

const supportChannels = [
  "independent_site_chat",
  "independent_site_form",
  "email",
  "feishu",
  "enterprise_wechat",
  "whatsapp",
  "douyin_im",
  "tiktok_social",
] as const satisfies readonly SupportChannel[];

const threadStatuses = ["open", "ai_managed", "needs_human", "replied", "closed"] as const satisfies readonly SupportThreadStatus[];
const riskLevels = ["low", "medium", "high"] as const satisfies readonly SupportRiskLevel[];
const languages = ["zh-CN", "en-US", "en-GB", "de-DE", "fr-FR"] as const satisfies readonly SupportCustomer["language"][];
const countries = ["US", "UK", "DE", "FR", "CA", "AU"] as const satisfies readonly CountryCode[];
const messageDirections = ["inbound", "outbound"] as const satisfies readonly SupportMessageDirection[];
const senderTypes = ["customer", "ai", "human", "system"] as const satisfies readonly SupportSenderType[];
const draftStatuses = ["pending_review", "approved", "rejected", "sent"] as const;

type ThreadRow = {
  id: string;
  customerId: string | null;
  channel: string;
  subject: string;
  status: string;
  riskLevel: string;
  language: string;
  orderRef: string | null;
  lastMessageAt: Date | string;
};

type CustomerRow = {
  id: string;
  displayName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  country: string | null;
  language: string;
};

type IdentityRow = {
  id: string;
  customerId: string;
  channel: string;
  externalUserId: string;
  displayName: string | null;
};

type MessageRow = {
  id: string;
  threadId: string;
  channel: string;
  direction: string;
  senderType: string;
  senderRef: string | null;
  originalText: string;
  createdAt: Date | string;
};

type TranslationRow = {
  id: string;
  messageId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatedText: string;
  modelName: string;
  humanEdited: boolean;
};

type DraftRow = {
  id: string;
  threadId: string;
  messageId: string | null;
  draftText: string;
  riskLevel: string;
  reason: string;
  status: string;
  canAutoSend: boolean;
  createdAt: Date | string;
};

type HandoffReportRow = {
  id: string;
  reportDate: Date | string;
  windowStart: Date | string;
  windowEnd: Date | string;
  newThreadsCount: number;
  aiRepliesCount: number;
  needsHumanCount: number;
  highRiskCount: number;
  summary: unknown;
};

const isOneOf = <T extends readonly string[]>(values: T, value: unknown): value is T[number] => {
  return typeof value === "string" && values.includes(value as T[number]);
};

const toIso = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const toDateOnly = (value: Date | string): string => {
  return toIso(value).slice(0, 10);
};

const asChannel = (value: unknown): SupportChannel => {
  return isOneOf(supportChannels, value) ? value : "independent_site_chat";
};

const asThreadStatus = (value: unknown): SupportThreadStatus => {
  return isOneOf(threadStatuses, value) ? value : "open";
};

const asRiskLevel = (value: unknown): SupportRiskLevel => {
  return isOneOf(riskLevels, value) ? value : "medium";
};

const asLanguage = (value: unknown): SupportCustomer["language"] => {
  return isOneOf(languages, value) ? value : "zh-CN";
};

const asCountry = (value: unknown): SupportCustomer["country"] => {
  return isOneOf(countries, value) ? value : "OTHER";
};

const asDirection = (value: unknown): SupportMessageDirection => {
  return isOneOf(messageDirections, value) ? value : "inbound";
};

const asSenderType = (value: unknown): SupportSenderType => {
  return isOneOf(senderTypes, value) ? value : "customer";
};

const asDraftStatus = (value: unknown): AiReplySuggestion["status"] => {
  return isOneOf(draftStatuses, value) ? value : "pending_review";
};

const resolveTenantId = (actor: SupportActor): string => {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actor.tenantId)) {
    return actor.tenantId;
  }

  if (actor.tenantId === "demo_tenant_atomi_watch") {
    return POSTGRES_DEMO_TENANT_ID;
  }

  return actor.tenantId;
};

const buildAuditEvent = (
  actor: SupportActor,
  action: SupportAuditAction,
  target: Pick<SupportAuditEvent, "targetType" | "targetId" | "riskLevel" | "note">,
): SupportAuditEvent => ({
  id: `audit_postgres_${action}_${Date.now()}`,
  tenantId: resolveTenantId(actor),
  actorRef: actor.actorRef,
  action,
  targetType: target.targetType,
  targetId: target.targetId,
  riskLevel: target.riskLevel,
  result: "postgres_read",
  note: target.note,
  persistenceTable: "audit_logs",
  createdAt: new Date().toISOString(),
});

const mapThread = (row: ThreadRow): SupportThread => ({
  id: row.id,
  customerId: row.customerId ?? "unknown_customer",
  channel: asChannel(row.channel),
  subject: row.subject,
  status: asThreadStatus(row.status),
  riskLevel: asRiskLevel(row.riskLevel),
  language: asLanguage(row.language),
  orderRef: row.orderRef,
  lastMessageAt: toIso(row.lastMessageAt),
});

const mapCustomer = (row: CustomerRow): SupportCustomer => ({
  id: row.id,
  displayName: row.displayName,
  primaryEmail: row.primaryEmail,
  primaryPhone: row.primaryPhone,
  country: asCountry(row.country),
  language: asLanguage(row.language),
});

const mapIdentity = (row: IdentityRow): CustomerIdentity => ({
  id: row.id,
  customerId: row.customerId,
  channel: asChannel(row.channel),
  externalUserId: row.externalUserId,
  displayName: row.displayName ?? row.externalUserId,
});

const mapMessage = (row: MessageRow): SupportMessage => ({
  id: row.id,
  threadId: row.threadId,
  channel: asChannel(row.channel),
  direction: asDirection(row.direction),
  senderType: asSenderType(row.senderType),
  senderRef: row.senderRef ?? "unknown_sender",
  originalText: row.originalText,
  createdAt: toIso(row.createdAt),
});

const mapTranslation = (row: TranslationRow): MessageTranslation => ({
  id: row.id,
  messageId: row.messageId,
  sourceLanguage: asLanguage(row.sourceLanguage),
  targetLanguage: asLanguage(row.targetLanguage),
  translatedText: row.translatedText,
  modelName: row.modelName,
  humanEdited: row.humanEdited,
});

const mapDraft = (row: DraftRow): AiReplySuggestion => ({
  id: row.id,
  threadId: row.threadId,
  messageId: row.messageId,
  draftText: row.draftText,
  riskLevel: asRiskLevel(row.riskLevel),
  reason: row.reason,
  status: asDraftStatus(row.status),
  canAutoSend: row.canAutoSend,
  createdAt: toIso(row.createdAt),
});

const getSummaryText = (summary: unknown): string => {
  if (summary && typeof summary === "object" && "summary" in summary) {
    const text = (summary as { summary?: unknown }).summary;
    if (typeof text === "string" && text.trim()) {
      return text;
    }
  }

  return "本地 PostgreSQL 沙箱日报，只包含假数据。";
};

const getPriorityThreads = (summary: unknown, fallbackThreads: SupportThread[]): string[] => {
  if (summary && typeof summary === "object" && "priorityThreads" in summary) {
    const rawPriorityThreads = (summary as { priorityThreads?: unknown }).priorityThreads;
    if (Array.isArray(rawPriorityThreads)) {
      return rawPriorityThreads.filter((item): item is string => typeof item === "string");
    }
  }

  return fallbackThreads.map((thread) => thread.id);
};

const readOnlyBlocked = async (): Promise<never> => {
  throw new Error("PostgreSQL Repository 第一版仅支持只读查询。写入消息、生成草稿、审核草稿暂时必须继续使用 Demo 模式。");
};

const listThreadRows = async (tenantId: string): Promise<ThreadRow[]> => {
  return query<ThreadRow>(
    `
      select
        id::text as "id",
        customer_id::text as "customerId",
        channel_type as "channel",
        subject,
        status,
        risk_level as "riskLevel",
        language,
        order_ref as "orderRef",
        last_message_at as "lastMessageAt"
      from customer_threads
      where tenant_id = $1
      order by last_message_at desc
    `,
    [tenantId],
  );
};

const getCustomersByIds = async (tenantId: string, customerIds: string[]): Promise<SupportCustomer[]> => {
  if (!customerIds.length) {
    return [];
  }

  const rows = await query<CustomerRow>(
    `
      select
        id::text as "id",
        display_name as "displayName",
        primary_email as "primaryEmail",
        primary_phone as "primaryPhone",
        country,
        language
      from customers
      where tenant_id = $1
        and id = any($2::uuid[])
      order by display_name asc
    `,
    [tenantId, customerIds],
  );

  return rows.map(mapCustomer);
};

const getIdentitiesByCustomerIds = async (tenantId: string, customerIds: string[]): Promise<CustomerIdentity[]> => {
  if (!customerIds.length) {
    return [];
  }

  const rows = await query<IdentityRow>(
    `
      select
        id::text as "id",
        customer_id::text as "customerId",
        channel_type as "channel",
        external_user_id as "externalUserId",
        display_name as "displayName"
      from customer_identities
      where tenant_id = $1
        and customer_id = any($2::uuid[])
      order by created_at asc
    `,
    [tenantId, customerIds],
  );

  return rows.map(mapIdentity);
};

export const postgresSupportRepository: SupportRepository = {
  async listThreads(actor: SupportActor): Promise<SupportThreadListResult> {
    const tenantId = resolveTenantId(actor);
    const threads = (await listThreadRows(tenantId)).map(mapThread);
    const customerIds = [...new Set(threads.map((thread) => thread.customerId).filter((id) => id !== "unknown_customer"))];

    return {
      mode: "postgres",
      note: "统一客服会话列表来自本地 PostgreSQL 沙箱，只读模式，不代表真实平台已接通。",
      threads,
      customers: await getCustomersByIds(tenantId, customerIds),
      identities: await getIdentitiesByCustomerIds(tenantId, customerIds),
      persistenceTargets: supportPersistenceTargets,
      auditEvents: [
        buildAuditEvent(actor, "support.thread.list", {
          targetType: "customer_thread",
          targetId: null,
          riskLevel: null,
          note: "PostgreSQL 只读模式按 tenant_id 查询 customer_threads；当前仅用于本地假数据验证。",
        }),
      ],
    };
  },

  async getThreadDetail(actor: SupportActor, threadId: string): Promise<SupportThreadDetailResult | null> {
    const tenantId = resolveTenantId(actor);
    const threadRows = await query<ThreadRow>(
      `
        select
          id::text as "id",
          customer_id::text as "customerId",
          channel_type as "channel",
          subject,
          status,
          risk_level as "riskLevel",
          language,
          order_ref as "orderRef",
          last_message_at as "lastMessageAt"
        from customer_threads
        where tenant_id = $1
          and id = $2
        limit 1
      `,
      [tenantId, threadId],
    );

    const thread = threadRows[0] ? mapThread(threadRows[0]) : null;
    if (!thread) {
      return null;
    }

    const customerRows = thread.customerId === "unknown_customer" ? [] : await getCustomersByIds(tenantId, [thread.customerId]);
    const messageRows = await query<MessageRow>(
      `
        select
          id::text as "id",
          thread_id::text as "threadId",
          channel_type as "channel",
          direction,
          sender_type as "senderType",
          sender_ref as "senderRef",
          original_text as "originalText",
          created_at as "createdAt"
        from messages
        where tenant_id = $1
          and thread_id = $2
        order by created_at asc
      `,
      [tenantId, thread.id],
    );
    const messages = messageRows.map(mapMessage);
    const messageIds = messages.map((message) => message.id);
    const translationRows = messageIds.length
      ? await query<TranslationRow>(
          `
            select
              id::text as "id",
              message_id::text as "messageId",
              source_language as "sourceLanguage",
              target_language as "targetLanguage",
              translated_text as "translatedText",
              model_name as "modelName",
              human_edited as "humanEdited"
            from message_translations
            where tenant_id = $1
              and message_id = any($2::uuid[])
            order by created_at asc
          `,
          [tenantId, messageIds],
        )
      : [];
    const draftRows = await query<DraftRow>(
      `
        select
          id::text as "id",
          thread_id::text as "threadId",
          message_id::text as "messageId",
          draft_text as "draftText",
          risk_level as "riskLevel",
          reason,
          status,
          can_auto_send as "canAutoSend",
          created_at as "createdAt"
        from ai_reply_suggestions
        where tenant_id = $1
          and thread_id = $2
        order by created_at asc
      `,
      [tenantId, thread.id],
    );

    return {
      mode: "postgres",
      note: "会话详情来自本地 PostgreSQL 沙箱，只读模式。真实上线前还必须补正式登录、租户授权和审计写入。",
      thread,
      customer: customerRows[0] ?? null,
      identities: thread.customerId === "unknown_customer" ? [] : await getIdentitiesByCustomerIds(tenantId, [thread.customerId]),
      messages,
      translations: translationRows.map(mapTranslation),
      aiReplySuggestions: draftRows.map(mapDraft),
      persistenceTargets: supportPersistenceTargets,
      auditEvents: [
        buildAuditEvent(actor, "support.thread.read", {
          targetType: "customer_thread",
          targetId: thread.id,
          riskLevel: thread.riskLevel,
          note: "PostgreSQL 只读模式读取会话详情；真实模式后续必须把读取审计写入 audit_logs。",
        }),
      ],
    };
  },

  async createInboundMessage(): Promise<CreateInboundSupportMessageResult> {
    return readOnlyBlocked();
  },

  async createAiDraft(): Promise<CreateAiDraftResult | null> {
    return readOnlyBlocked();
  },

  async reviewAiDraft(): Promise<ReviewAiDraftResult | null> {
    return readOnlyBlocked();
  },

  async getHandoffReport(actor: SupportActor): Promise<HandoffReportResult> {
    const tenantId = resolveTenantId(actor);
    const reports = await query<HandoffReportRow>(
      `
        select
          id::text as "id",
          report_date as "reportDate",
          window_start as "windowStart",
          window_end as "windowEnd",
          new_threads_count as "newThreadsCount",
          ai_replies_count as "aiRepliesCount",
          needs_human_count as "needsHumanCount",
          high_risk_count as "highRiskCount",
          summary
        from handoff_reports
        where tenant_id = $1
        order by window_end desc
        limit 10
      `,
      [tenantId],
    );
    const threads = (await listThreadRows(tenantId)).map(mapThread);
    const highRiskThreads = threads.filter((thread) => thread.riskLevel === "high");
    const needsHumanThreads = threads.filter((thread) => thread.status === "needs_human");

    return {
      mode: "postgres",
      note: "离线托管日报来自本地 PostgreSQL 沙箱，只读模式。真实模式后续必须按排班和时间窗口生成并写审计。",
      reports: reports.map((report): HandoffReport => ({
        id: report.id,
        reportDate: toDateOnly(report.reportDate),
        windowStart: toIso(report.windowStart),
        windowEnd: toIso(report.windowEnd),
        newThreadsCount: report.newThreadsCount,
        aiRepliesCount: report.aiRepliesCount,
        needsHumanCount: report.needsHumanCount,
        highRiskCount: report.highRiskCount,
        priorityThreads: getPriorityThreads(report.summary, [...highRiskThreads, ...needsHumanThreads]),
        summary: getSummaryText(report.summary),
      })),
      highRiskThreads,
      needsHumanThreads,
      persistenceTargets: supportPersistenceTargets,
      auditEvents: [
        buildAuditEvent(actor, "support.handoff_report.read", {
          targetType: "handoff_report",
          targetId: reports[0]?.id ?? null,
          riskLevel: null,
          note: "PostgreSQL 只读模式读取 handoff_reports；真实模式后续必须记录日报读取审计。",
        }),
      ],
    };
  },
};
