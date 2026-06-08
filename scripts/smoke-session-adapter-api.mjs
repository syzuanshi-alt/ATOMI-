const baseUrl = process.env.SESSION_ADAPTER_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

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
  "管理员读取 Session 适配层准备状态",
  {
    url: `${baseUrl}/api/auth/session-adapter-readiness`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      data?.source === "session_adapter_readiness" &&
      data?.currentActor?.role === "admin" &&
      data?.adapter?.activeProvider === "demo" &&
      data?.adapter?.realSessionEnabled === false &&
      data?.adapter?.businessApisUseUnifiedContext === true &&
      data?.adapter?.recommendedProvider === "authjs_with_postgres_rbac" &&
      data?.sessionContextReadinessEndpoint === "/api/auth/session-context-readiness" &&
      data?.guardrails?.noAuthDependencyInstalled === true &&
      data?.guardrails?.demoHeaderStillDemoOnly === true &&
      data?.guardrails?.productionMustDisableDemoHeader === true,
    detail: `当前适配器 ${data?.adapter?.activeProvider ?? "unknown"}，真实 Session ${String(data?.adapter?.realSessionEnabled)}`,
  }),
);

await check(
  "客服也能读取 Session 适配说明但不能被当成真实登录",
  {
    url: `${baseUrl}/api/auth/session-adapter-readiness`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.currentActor?.role === "support" &&
      data?.currentActor?.authSource === "header" &&
      data?.adapter?.realSessionEnabled === false &&
      data?.guardrails?.notRealLogin === true,
    detail: `角色 ${data?.currentActor?.role ?? "unknown"}，来源 ${data?.currentActor?.authSource ?? "unknown"}`,
  }),
);

await check(
  "当前用户接口返回 Session 适配层入口",
  {
    url: `${baseUrl}/api/me`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok: response.status === 200 && data?.sessionAdapterReadinessEndpoint === "/api/auth/session-adapter-readiness",
    detail: `Session 适配入口 ${data?.sessionAdapterReadinessEndpoint ?? "missing"}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`Session 适配层 API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Session 适配层 API 烟测通过：${checks.length}/${checks.length}`);
