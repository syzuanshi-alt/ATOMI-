const baseUrl = process.env.SYNC_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

const checks = [];

const check = async (name, request, verify) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const response = await fetch(request.url, { ...request, signal: controller.signal });
  clearTimeout(timeout);
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
  "管理员触发 Demo 同步任务护栏",
  {
    url: `${baseUrl}/api/sync`,
    method: "POST",
    headers: jsonHeaders("admin"),
    body: JSON.stringify({ provider: "shopify" }),
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      data?.provider === "shopify" &&
      data?.realSyncStarted === false &&
      typeof data?.queued === "boolean" &&
      typeof data?.noteZh === "string" &&
      data.noteZh.includes("不代表真实平台同步") &&
      data?.syncAudit?.provider === "shopify" &&
      data?.syncAudit?.requestedBy === "demo:admin" &&
      data?.syncAudit?.realSyncStarted === false &&
      data?.syncAudit?.persistenceTable === "sync_runs" &&
      ["demo_response_only", "postgres_sandbox"].includes(data?.syncAudit?.persistenceMode) &&
      ["queued", "skipped", "failed"].includes(data?.syncAudit?.status) &&
      data?.syncAudit?.containsRealSecrets === false &&
      data?.syncAudit?.containsCustomerData === false &&
      data?.guardrails?.noRealPlatformWrite === true &&
      data?.guardrails?.noRealSecretsRequired === true &&
      data?.guardrails?.manualReviewBeforeLiveMode === true,
    detail: `排队 ${String(data?.queued)}，真实同步 ${String(data?.realSyncStarted)}，审计 ${data?.syncAudit?.persistenceMode ?? "missing"}，说明 ${data?.noteZh ?? "missing"}`,
  }),
);

await check(
  "客服角色不能触发数据同步",
  {
    url: `${baseUrl}/api/sync`,
    method: "POST",
    headers: jsonHeaders("support"),
    body: JSON.stringify({ provider: "shopify" }),
  },
  (response) => ({
    ok: response.status === 403,
    detail: response.status === 403 ? "权限拦截正常" : `预期 403，实际 ${response.status}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`同步 API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`同步 API 烟测通过：${checks.length}/${checks.length}`);
