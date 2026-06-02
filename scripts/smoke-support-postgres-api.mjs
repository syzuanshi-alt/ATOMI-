import { DEMO_TENANT_ID, withPostgres } from "./support-postgres-utils.mjs";

const baseUrl = process.env.SUPPORT_POSTGRES_API_BASE_URL ?? "http://127.0.0.1:4174";

const checks = [];

const check = async (name, request, verify) => {
  const response = await fetch(request.url, request);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  const result = verify(response, data);
  checks.push({ name, status: response.status, ok: result.ok, detail: result.detail, data });
  return data;
};

const checkDb = async (name, run) => {
  try {
    const detail = await run();
    checks.push({ name, status: "db", ok: true, detail, data: null });
  } catch (error) {
    checks.push({ name, status: "db", ok: false, detail: error instanceof Error ? error.message : String(error), data: null });
  }
};

const supportHeaders = {
  "x-demo-role": "support",
};

const jsonHeaders = {
  ...supportHeaders,
  "content-type": "application/json",
};
const threadShippingId = "88888888-8888-4888-8888-888888888881";
const messageShippingId = "99999999-9999-4999-8999-999999999991";

await check(
  "Repository 已进入 PostgreSQL 沙箱模式",
  {
    url: `${baseUrl}/api/support/repository-status`,
    method: "GET",
    headers: supportHeaders,
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.requestedMode === "postgres" &&
      data?.activeMode === "postgres" &&
      data?.postgresRepositoryEnabled === true &&
      data?.databaseUrlConfigured === true,
    detail: `请求模式 ${data?.requestedMode ?? "unknown"}，实际模式 ${data?.activeMode ?? "unknown"}，数据库开关 ${String(
      data?.postgresRepositoryEnabled,
    )}`,
  }),
);

await check(
  "PostgreSQL 客服渠道接入前置清单",
  {
    url: `${baseUrl}/api/support/channel-readiness`,
    method: "GET",
    headers: supportHeaders,
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "postgres" &&
      data?.repository?.activeMode === "postgres" &&
      Array.isArray(data?.channels) &&
      data.channels.length === 8 &&
      data.channels.slice(0, 4).map((channel) => channel.id).join(",") ===
        "independent_site_chat,independent_site_form,email,feishu" &&
      Array.isArray(data?.recommendedStartOrder) &&
      data.recommendedStartOrder.slice(0, 4).join(",") === "independent_site_chat,independent_site_form,email,feishu" &&
      data?.summary?.lowDifficultyCount >= 4 &&
      data?.summary?.phase1CandidatesCount === 4 &&
      data?.summary?.blockedForPhase1Count >= 4 &&
      data?.guardrails?.noRealSecrets === true &&
      data?.guardrails?.noPersonalWechatAutomation === true &&
      data?.guardrails?.noAutoSendCustomerMessages === true &&
      data?.guardrails?.highRiskAutoReplyBlocked === true &&
      data?.guardrails?.humanReviewRequired === true,
    detail: `渠道 ${data?.channels?.length ?? 0}，一期候选 ${data?.summary?.phase1CandidatesCount ?? 0}，模式 ${data?.mode ?? "unknown"}`,
  }),
);

const listData = await check(
  "PostgreSQL 会话列表 API",
  {
    url: `${baseUrl}/api/support/threads`,
    method: "GET",
    headers: supportHeaders,
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "postgres" &&
      data?.repository?.activeMode === "postgres" &&
      Array.isArray(data?.threads) &&
      data.threads.length >= 2 &&
      Array.isArray(data?.customers) &&
      data.customers.every((customer) => typeof customer.primaryEmail !== "string" || customer.primaryEmail.endsWith(".test")) &&
      Array.isArray(data?.auditEvents) &&
      data.auditEvents.some((item) => item.result === "postgres_read"),
    detail: `会话 ${data?.threads?.length ?? 0}，客户 ${data?.customers?.length ?? 0}，模式 ${data?.mode ?? "unknown"}`,
  }),
);

const firstThreadId = listData?.threads?.[0]?.id;

await check(
  "PostgreSQL 会话详情 API",
  {
    url: `${baseUrl}/api/support/threads/${firstThreadId ?? "missing_thread"}`,
    method: "GET",
    headers: supportHeaders,
  },
  (response, data) => ({
    ok:
      Boolean(firstThreadId) &&
      response.status === 200 &&
      data?.mode === "postgres" &&
      data?.thread?.id === firstThreadId &&
      Array.isArray(data?.messages) &&
      data.messages.length > 0 &&
      Array.isArray(data?.aiReplySuggestions),
    detail: `会话 ${data?.thread?.id ?? "missing"}，消息 ${data?.messages?.length ?? 0}，AI 草稿 ${data?.aiReplySuggestions?.length ?? 0}`,
  }),
);

await check(
  "PostgreSQL 离线托管日报 API",
  {
    url: `${baseUrl}/api/support/handoff-report`,
    method: "GET",
    headers: supportHeaders,
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "postgres" &&
      Array.isArray(data?.reports) &&
      data.reports.length > 0 &&
      Array.isArray(data?.highRiskThreads) &&
      Array.isArray(data?.needsHumanThreads),
    detail: `日报 ${data?.reports?.length ?? 0}，高风险 ${data?.highRiskThreads?.length ?? 0}`,
  }),
);

const generatedDraftData = await check(
  "PostgreSQL AI 草稿生成落库 API",
  {
    url: `${baseUrl}/api/support/ai-drafts`,
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      threadId: threadShippingId,
      messageId: messageShippingId,
    }),
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "postgres" &&
      data?.persisted === true &&
      data?.draft?.threadId === threadShippingId &&
      data?.draft?.messageId === messageShippingId &&
      data?.draft?.riskLevel === "medium" &&
      data?.draft?.canAutoSend === false &&
      Array.isArray(data?.auditEvents) &&
      data.auditEvents.some((item) => item.action === "support.ai_draft.generate" && item.result === "postgres_created"),
    detail: `草稿 ${data?.draft?.id ?? "missing"}，风险 ${data?.draft?.riskLevel ?? "unknown"}，落库 ${String(data?.persisted)}`,
  }),
);

await checkDb("PostgreSQL AI 草稿生成记录真实入库", async () => {
  const draftId = generatedDraftData?.draft?.id;
  if (!draftId) {
    throw new Error("缺少生成草稿 ID，无法核对数据库入库结果。");
  }

  return withPostgres(async (pool) => {
    const result = await pool.query(
      `
        select
          (
            select count(*)::int
            from ai_reply_suggestions
            where tenant_id = $1
              and id::text = $2
              and thread_id::text = $3
              and message_id::text = $4
              and risk_level = 'medium'
              and status = 'pending_review'
              and can_auto_send = false
          ) as draft_count,
          (
            select count(*)::int
            from ai_outputs
            where tenant_id = $1
              and source_type = 'message'
              and source_id::text = $4
              and metadata->>'draftId' = $2
              and status = 'generated'
          ) as ai_output_count,
          (
            select count(*)::int
            from audit_logs
            where tenant_id = $1
              and event = 'support.ai_draft.generate'
              and metadata->>'draftId' = $2
              and metadata->>'threadId' = $3
          ) as audit_count
      `,
      [DEMO_TENANT_ID, draftId, threadShippingId, messageShippingId],
    );

    const row = result.rows[0];
    if (row.draft_count !== 1 || row.ai_output_count !== 1 || row.audit_count !== 1) {
      throw new Error(
        `草稿生成入库不完整：drafts=${row.draft_count}, ai_outputs=${row.ai_output_count}, audits=${row.audit_count}`,
      );
    }

    return `草稿 ${row.draft_count}，AI 输出 ${row.ai_output_count}，审计 ${row.audit_count}`;
  });
});

await check(
  "PostgreSQL 发送前置护栏阻断未审核草稿",
  {
    url: `${baseUrl}/api/support/replies/send`,
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      draftId: generatedDraftData?.draft?.id ?? "missing_draft",
    }),
  },
  (response, data) => ({
    ok:
      response.status === 409 &&
      data?.error === "support_reply_send_blocked" &&
      data?.mode === "postgres" &&
      data?.persisted === true &&
      data?.sendAttempted === false &&
      data?.guardrails?.noCustomerMessageSent === true &&
      Array.isArray(data?.blockedReasons) &&
      data.blockedReasons.includes("requires_human_approval") &&
      data.blockedReasons.includes("medium_high_risk_manual_only") &&
      Array.isArray(data?.auditEvents) &&
      data.auditEvents.some((item) => item.action === "support.reply_send.guard" && item.result === "blocked"),
    detail: `状态 ${response.status}，阻断 ${data?.blockedReasons?.join(",") ?? "none"}，已发送 ${String(data?.sendAttempted)}`,
  }),
);

await checkDb("PostgreSQL 发送前置护栏只写审计不发消息", async () => {
  const draftId = generatedDraftData?.draft?.id;
  if (!draftId) {
    throw new Error("缺少生成草稿 ID，无法核对发送护栏审计。");
  }

  return withPostgres(async (pool) => {
    const result = await pool.query(
      `
        select
          (
            select count(*)::int
            from audit_logs
            where tenant_id = $1
              and event = 'support.reply_send.guard'
              and metadata->>'draftId' = $2
              and metadata->>'sendAttempted' = 'false'
          ) as audit_count,
          (
            select count(*)::int
            from ai_autoreplies
            where tenant_id = $1
              and message_id::text = $3
          ) as autoreplies_count
      `,
      [DEMO_TENANT_ID, draftId, messageShippingId],
    );

    const row = result.rows[0];
    if (row.audit_count !== 1 || row.autoreplies_count !== 0) {
      throw new Error(`发送护栏异常：audits=${row.audit_count}, autoreplies=${row.autoreplies_count}`);
    }

    return `审计 ${row.audit_count}，自动发送 ${row.autoreplies_count}`;
  });
});

const reviewDraftId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";
const reviewNote = `PostgreSQL API 烟测驳回记录 ${Date.now()}`;

const reviewData = await check(
  "PostgreSQL AI 草稿审核落库 API",
  {
    url: `${baseUrl}/api/support/ai-drafts/review`,
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      draftId: reviewDraftId,
      decision: "rejected",
      reviewNote,
    }),
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "postgres" &&
      data?.persisted === true &&
      data?.draft?.id === reviewDraftId &&
      data?.draft?.status === "rejected" &&
      data?.approval?.decision === "rejected" &&
      data?.approval?.sourceId === reviewDraftId &&
      data?.approval?.reviewNote === reviewNote &&
      Array.isArray(data?.auditEvents) &&
      data.auditEvents.some((item) => item.action === "support.ai_draft.review" && item.result === "postgres_reviewed"),
    detail: `审核 ${data?.approval?.decision ?? "unknown"}，草稿状态 ${data?.draft?.status ?? "unknown"}，落库 ${String(data?.persisted)}`,
  }),
);

await checkDb("PostgreSQL AI 审核记录真实入库", async () => {
  const approvalId = reviewData?.approval?.id;
  if (!approvalId) {
    throw new Error("缺少审批 ID，无法核对数据库入库结果。");
  }

  return withPostgres(async (pool) => {
    const result = await pool.query(
      `
        select
          (select status from ai_reply_suggestions where tenant_id = $1 and id::text = $2) as draft_status,
          (
            select count(*)::int
            from ai_approvals
            where tenant_id = $1
              and id::text = $3
              and source_id::text = $2
              and decision = 'rejected'
              and review_note = $4
          ) as approvals_count,
          (
            select count(*)::int
            from audit_logs
            where tenant_id = $1
              and event = 'support.ai_draft.review'
              and metadata->>'approvalId' = $3
          ) as audit_count
      `,
      [DEMO_TENANT_ID, reviewDraftId, approvalId, reviewNote],
    );

    const row = result.rows[0];
    if (row.draft_status !== "rejected" || row.approvals_count !== 1 || row.audit_count !== 1) {
      throw new Error(
        `审核入库不完整：draft_status=${row.draft_status}, approvals=${row.approvals_count}, audits=${row.audit_count}`,
      );
    }

    return `草稿 ${row.draft_status}，审批 ${row.approvals_count}，审计 ${row.audit_count}`;
  });
});

await check(
  "PostgreSQL 会话详情返回审批和审计",
  {
    url: `${baseUrl}/api/support/threads/88888888-8888-4888-8888-888888888882`,
    method: "GET",
    headers: supportHeaders,
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "postgres" &&
      Array.isArray(data?.aiApprovals) &&
      data.aiApprovals.some((approval) => approval.sourceId === reviewDraftId && approval.reviewNote === reviewNote) &&
      Array.isArray(data?.auditLogs) &&
      data.auditLogs.some((log) => log.event === "support.ai_draft.review" && log.metadata?.approvalId === reviewData?.approval?.id) &&
      data.auditLogs.some((log) => log.event === "support.thread.read" && log.metadata?.threadId === data?.thread?.id),
    detail: `审批 ${data?.aiApprovals?.length ?? 0}，审计 ${data?.auditLogs?.length ?? 0}`,
  }),
);

await check(
  "PostgreSQL 客户消息写入阻断",
  {
    url: `${baseUrl}/api/support/threads`,
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      channel: "independent_site_chat",
      customerName: "沙箱写入阻断测试",
      externalUserId: "blocked_write_test",
      originalText: "这条消息不应该写入数据库。",
      language: "zh-CN",
    }),
  },
  (response, data) => ({
    ok: response.status === 409 && data?.error === "postgres_repository_read_only",
    detail: response.status === 409 ? "写入已阻断" : `预期 409，实际 ${response.status}`,
  }),
);

await check(
  "PostgreSQL AI 客服托管闭环汇总",
  {
    url: `${baseUrl}/api/support/autopilot-summary`,
    method: "GET",
    headers: supportHeaders,
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "postgres" &&
      data?.summary?.totalThreads >= 2 &&
      data?.summary?.pendingDrafts >= 1 &&
      data?.summary?.rejectedDrafts >= 1 &&
      data?.summary?.highRiskThreads >= 1 &&
      data?.summary?.auditLogsCount >= 1 &&
      data?.guardrails?.aiAutoSendEnabled === false &&
      data?.guardrails?.highRiskAutoSendBlocked === true &&
      data?.guardrails?.realCustomerMessageWriteEnabled === false &&
      Array.isArray(data?.reviewQueue) &&
      data.reviewQueue.some((item) => item.riskLevel === "high" && item.canAutoSend === false) &&
      Array.isArray(data?.auditEvents) &&
      new Set(data.auditEvents.map((item) => item.id)).size === data.auditEvents.length &&
      data?.handoff?.reportsCount >= 1,
    detail: `会话 ${data?.summary?.totalThreads ?? 0}，待审核草稿 ${data?.summary?.pendingDrafts ?? 0}，审计 ${data?.summary?.auditLogsCount ?? 0}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`PostgreSQL API 烟测失败：${failed.length}/${checks.length}`);
  console.error("请确认服务是用 SUPPORT_REPOSITORY_MODE=postgres 和 ENABLE_POSTGRES_SUPPORT_REPOSITORY=true 启动的。");
  process.exit(1);
}

console.log(`PostgreSQL API 烟测通过：${checks.length}/${checks.length}`);
