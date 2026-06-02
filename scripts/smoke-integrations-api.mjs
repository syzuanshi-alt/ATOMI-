const baseUrl = process.env.INTEGRATIONS_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

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
  "管理员读取数据接入配置草案",
  {
    url: `${baseUrl}/api/integrations`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      Array.isArray(data?.integrations) &&
      data.integrations.length === 6 &&
      data.integrations[0]?.provider === "shopify" &&
      data.integrations.every(
        (item) =>
          item.name &&
          item.status === "demo" &&
          item.dataStateLabelZh === "Demo 数据" &&
          Array.isArray(item.requiredFields) &&
          item.requiredFields.length >= 1 &&
          Array.isArray(item.forbiddenInputs) &&
          item.forbiddenInputs.some((value) => value.includes("真实")),
      ) &&
      data?.csvUpload?.enabled === true &&
      data?.csvUpload?.statusLabelZh === "等待上传" &&
      data?.summary?.totalIntegrations === 6 &&
      data?.summary?.demoConnections === 6 &&
      data?.guardrails?.noRealSecrets === true &&
      data?.guardrails?.demoModeOnly === true &&
      data?.guardrails?.noRealPlatformWrite === true,
    detail: `连接项 ${data?.integrations?.length ?? 0}，CSV ${data?.csvUpload?.statusLabelZh ?? "missing"}`,
  }),
);

await check(
  "客服角色不能管理数据接入配置",
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

await check(
  "管理员执行 Demo 连接探测护栏",
  {
    url: `${baseUrl}/api/integrations`,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-demo-role": "admin",
    },
    body: JSON.stringify({
      provider: "shopify",
      accountRef: "SANDBOX-SHOPIFY-STORE",
    }),
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      data?.provider === "shopify" &&
      data?.endpoint === "connection_probe" &&
      data?.accountRef === "SANDBOX-SHOPIFY-STORE" &&
      data?.realConnectionCreated === false &&
      data?.persisted === false &&
      data?.data?.status === "demo_probe_ok" &&
      data?.guardrails?.noRealSecrets === true &&
      data?.guardrails?.noRealPlatformWrite === true &&
      typeof data?.noteZh === "string" &&
      data.noteZh.includes("不代表真实平台已连接"),
    detail: `探测 ${data?.data?.status ?? "missing"}，真实连接 ${String(data?.realConnectionCreated)}`,
  }),
);

await check(
  "客服角色不能执行连接探测",
  {
    url: `${baseUrl}/api/integrations`,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-demo-role": "support",
    },
    body: JSON.stringify({
      provider: "shopify",
      accountRef: "SANDBOX-SHOPIFY-STORE",
    }),
  },
  (response) => ({
    ok: response.status === 403,
    detail: response.status === 403 ? "连接探测权限拦截正常" : `预期 403，实际 ${response.status}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`数据接入 API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`数据接入 API 烟测通过：${checks.length}/${checks.length}`);
