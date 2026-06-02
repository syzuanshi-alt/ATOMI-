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

const supportHeaders = {
  "x-demo-role": "support",
};

const jsonHeaders = {
  ...supportHeaders,
  "content-type": "application/json",
};

await check(
  "Repository 已进入 PostgreSQL 只读模式",
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

await check(
  "PostgreSQL 只读模式阻断写入",
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
