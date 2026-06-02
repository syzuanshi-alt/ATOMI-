const baseUrl = process.env.SUPPORT_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

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
  checks.push({ name, status: response.status, ok: result.ok, detail: result.detail });
};

const jsonHeaders = (role) => ({
  "content-type": "application/json",
  "x-demo-role": role,
});

await check(
  "主页可打开",
  {
    url: `${baseUrl}/`,
    method: "GET",
  },
  (response) => ({
    ok: response.status === 200,
    detail: response.status === 200 ? "主页返回 200" : `主页返回 ${response.status}`,
  }),
);

await check(
  "当前请求上下文",
  {
    url: `${baseUrl}/api/me`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      data?.tenantId === "demo_tenant_atomi_watch" &&
      data?.actorRef === "demo:support" &&
      data?.authSource === "header" &&
      Array.isArray(data?.permissions) &&
      data.permissions.includes("support.reply"),
    detail: `模式 ${data?.mode ?? "unknown"}，角色 ${data?.role ?? "unknown"}，来源 ${data?.authSource ?? "unknown"}`,
  }),
);

await check(
  "客服 Repository 模式护栏",
  {
    url: `${baseUrl}/api/support/repository-status`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.requestedMode === "demo" &&
      data?.activeMode === "demo" &&
      typeof data?.databaseUrlConfigured === "boolean" &&
      data?.postgresRepositoryEnabled === false,
    detail: `请求模式 ${data?.requestedMode ?? "unknown"}，实际模式 ${data?.activeMode ?? "unknown"}`,
  }),
);

await check(
  "统一客服会话列表",
  {
    url: `${baseUrl}/api/support/threads`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      Array.isArray(data?.threads) &&
      data.threads.length > 0 &&
      Array.isArray(data?.persistenceTargets) &&
      data.persistenceTargets.some((item) => item.table === "customer_threads") &&
      Array.isArray(data?.auditEvents) &&
      data?.repository?.activeMode === "demo",
    detail: `会话数 ${data?.threads?.length ?? 0}，持久化目标 ${data?.persistenceTargets?.length ?? 0}，模式 ${data?.repository?.activeMode ?? "unknown"}`,
  }),
);

await check(
  "统一客服会话详情",
  {
    url: `${baseUrl}/api/support/threads/th_2`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.thread?.id === "th_2" &&
      Array.isArray(data?.messages) &&
      Array.isArray(data?.translations) &&
      Array.isArray(data?.aiReplySuggestions) &&
      Array.isArray(data?.aiApprovals) &&
      Array.isArray(data?.auditLogs),
    detail: `消息 ${data?.messages?.length ?? 0}，AI 草稿 ${data?.aiReplySuggestions?.length ?? 0}，审批 ${data?.aiApprovals?.length ?? 0}`,
  }),
);

await check(
  "客服角色生成高风险 AI 草稿",
  {
    url: `${baseUrl}/api/support/ai-drafts`,
    method: "POST",
    headers: jsonHeaders("support"),
    body: JSON.stringify({ threadId: "th_2", messageId: "msg_2" }),
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.draft?.riskLevel === "high" &&
      data?.draft?.canAutoSend === false &&
      Array.isArray(data?.auditEvents) &&
      data.auditEvents.some((item) => item.persistenceTable === "audit_logs"),
    detail: `风险 ${data?.draft?.riskLevel ?? "unknown"}，自动发送 ${String(data?.draft?.canAutoSend)}`,
  }),
);

await check(
  "老板角色不能生成客服草稿",
  {
    url: `${baseUrl}/api/support/ai-drafts`,
    method: "POST",
    headers: jsonHeaders("gm"),
    body: JSON.stringify({ threadId: "th_2", messageId: "msg_2" }),
  },
  (response) => ({
    ok: response.status === 403,
    detail: response.status === 403 ? "权限拦截正常" : `预期 403，实际 ${response.status}`,
  }),
);

await check(
  "客服角色驳回高风险 AI 草稿",
  {
    url: `${baseUrl}/api/support/ai-drafts/review`,
    method: "POST",
    headers: jsonHeaders("support"),
    body: JSON.stringify({
      draftId: "ars_2",
      decision: "rejected",
      reviewNote: "退款争议必须人工继续处理，AI 草稿不发送。",
    }),
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.persisted === false &&
      data?.draft?.status === "rejected" &&
      data?.approval?.decision === "rejected" &&
      data?.approval?.sourceId === "ars_2" &&
      Array.isArray(data?.auditEvents) &&
      data.auditEvents.some((item) => item.action === "support.ai_draft.review" && item.targetType === "ai_approval"),
    detail: `审核结果 ${data?.approval?.decision ?? "unknown"}，草稿状态 ${data?.draft?.status ?? "unknown"}`,
  }),
);

await check(
  "老板角色不能审核客服草稿",
  {
    url: `${baseUrl}/api/support/ai-drafts/review`,
    method: "POST",
    headers: jsonHeaders("gm"),
    body: JSON.stringify({
      draftId: "ars_2",
      decision: "approved",
    }),
  },
  (response) => ({
    ok: response.status === 403,
    detail: response.status === 403 ? "审核权限拦截正常" : `预期 403，实际 ${response.status}`,
  }),
);

await check(
  "模拟新消息进入客服中台",
  {
    url: `${baseUrl}/api/support/threads`,
    method: "POST",
    headers: jsonHeaders("support"),
    body: JSON.stringify({
      channel: "independent_site_chat",
      customerName: "演示客户",
      externalUserId: "site_chat_demo_smoke",
      originalText: "请问可以发加拿大吗？还能刻字吗？",
      language: "zh-CN",
    }),
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.persisted === false &&
      data?.thread?.id &&
      data?.message?.id &&
      data?.draft?.id &&
      Array.isArray(data?.persistenceTargets) &&
      data.persistenceTargets.some((item) => item.table === "messages"),
    detail: `Demo 临时会话 ${data?.thread?.id ?? "missing"}`,
  }),
);

await check(
  "离线托管日报",
  {
    url: `${baseUrl}/api/support/handoff-report`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      Array.isArray(data?.reports) &&
      data.reports.length > 0 &&
      Array.isArray(data?.highRiskThreads) &&
      Array.isArray(data?.needsHumanThreads),
    detail: `日报 ${data?.reports?.length ?? 0}，高风险 ${data?.highRiskThreads?.length ?? 0}`,
  }),
);

await check(
  "AI 客服托管闭环汇总",
  {
    url: `${baseUrl}/api/support/autopilot-summary`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      data?.summary?.totalThreads >= 1 &&
      data?.summary?.pendingDrafts >= 1 &&
      data?.summary?.highRiskThreads >= 1 &&
      data?.guardrails?.aiAutoSendEnabled === false &&
      data?.guardrails?.highRiskAutoSendBlocked === true &&
      data?.guardrails?.realCustomerMessageWriteEnabled === false &&
      Array.isArray(data?.reviewQueue) &&
      data.reviewQueue.some((item) => item.riskLevel === "high" && item.canAutoSend === false) &&
      data?.handoff?.reportsCount >= 1,
    detail: `会话 ${data?.summary?.totalThreads ?? 0}，待审核草稿 ${data?.summary?.pendingDrafts ?? 0}，高风险 ${data?.summary?.highRiskThreads ?? 0}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`客服 API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`客服 API 烟测通过：${checks.length}/${checks.length}`);
