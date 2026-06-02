const baseUrl = process.env.INTEGRATIONS_POSTGRES_API_BASE_URL ?? "http://127.0.0.1:4174";

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

await check(
  "PostgreSQL 数据接入配置从沙箱读取",
  {
    url: `${baseUrl}/api/integrations`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "postgres" &&
      data?.source === "postgres_sandbox" &&
      data?.repository?.activeMode === "postgres" &&
      Array.isArray(data?.integrations) &&
      data.integrations.length === 6 &&
      data.integrations.map((item) => item.provider).join(",") ===
        "shopify,meta_ads,tiktok_ads,instagram_graph,logistics,support" &&
      data.integrations.every(
        (item) =>
          item.status === "demo" &&
          item.dataState === "postgres_sandbox" &&
          item.dataStateLabelZh === "PostgreSQL 沙箱数据" &&
          typeof item.accountRef === "string" &&
          item.accountRef.startsWith("SANDBOX-") &&
          item.hasEncryptedSecret === false &&
          item.encryptedSecret === undefined,
      ) &&
      data?.summary?.totalIntegrations === 6 &&
      data?.summary?.demoConnections === 6 &&
      data?.summary?.realConnections === 0 &&
      data?.summary?.encryptedSecretCount === 0 &&
      data?.guardrails?.noRealSecrets === true &&
      data?.guardrails?.noRealPlatformWrite === true &&
      Array.isArray(data?.auditEvents) &&
      data.auditEvents.some((item) => item.action === "integrations.read" && item.result === "postgres_sandbox_read"),
    detail: `连接 ${data?.integrations?.length ?? 0}，密钥数 ${data?.summary?.encryptedSecretCount ?? "unknown"}，模式 ${data?.mode ?? "unknown"}`,
  }),
);

await check(
  "PostgreSQL 客服角色不能读取数据接入管理配置",
  {
    url: `${baseUrl}/api/integrations`,
    method: "GET",
    headers: { "x-demo-role": "support" },
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
  console.error(`PostgreSQL 数据接入 API 烟测失败：${failed.length}/${checks.length}`);
  console.error("请确认服务是用 SUPPORT_REPOSITORY_MODE=postgres 和 ENABLE_POSTGRES_SUPPORT_REPOSITORY=true 启动的。");
  process.exit(1);
}

console.log(`PostgreSQL 数据接入 API 烟测通过：${checks.length}/${checks.length}`);
