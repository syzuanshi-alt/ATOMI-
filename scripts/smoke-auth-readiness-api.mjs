const baseUrl = process.env.AUTH_READINESS_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

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
  "管理员读取真实登录准备状态",
  {
    url: `${baseUrl}/api/auth/session-readiness`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      data?.source === "demo_auth_readiness" &&
      data?.currentAuth?.role === "admin" &&
      data?.currentAuth?.authSource === "header" &&
      data?.guardrails?.notRealLogin === true &&
      data?.guardrails?.liveSessionConfigured === false &&
      data?.guardrails?.productionMustDisableDemoHeader === true &&
      Array.isArray(data?.liveModeRequirements) &&
      data.liveModeRequirements.includes("正式登录 Session（会话）") &&
      data.liveModeRequirements.includes("租户成员表 tenant_members") &&
      data?.recommendedAuthPlan?.recommended === "authjs_with_postgres_rbac" &&
      data?.recommendedAuthPlan?.stage === "design_locked_not_installed" &&
      data?.recommendedAuthPlan?.nextStep === "先做本地 Session 适配层和 PostgreSQL RBAC 读取，不直接接真实供应商。" &&
      data?.sessionAdapterReadinessEndpoint === "/api/auth/session-adapter-readiness" &&
      data?.sessionContextReadinessEndpoint === "/api/auth/session-context-readiness" &&
      Array.isArray(data?.authProviderOptions) &&
      data.authProviderOptions.length >= 3 &&
      Array.isArray(data?.blockedForLiveMode) &&
      data.blockedForLiveMode.includes("x-demo-role 请求头"),
    detail: `模式 ${data?.mode ?? "unknown"}，当前角色 ${data?.currentAuth?.role ?? "unknown"}`,
  }),
);

await check(
  "无效 Demo 角色不会被当成真实登录",
  {
    url: `${baseUrl}/api/auth/session-readiness`,
    method: "GET",
    headers: { "x-demo-role": "hacker" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.currentAuth?.role === "gm" &&
      data?.currentAuth?.authSource === "default" &&
      data?.guardrails?.notRealLogin === true &&
      data?.demoAuthBoundary?.invalidDemoRoleFallsBackToDefault === true,
    detail: `无效角色回退为 ${data?.currentAuth?.role ?? "unknown"}，来源 ${data?.currentAuth?.authSource ?? "unknown"}`,
  }),
);

await check(
  "当前用户接口返回真实登录准备入口",
  {
    url: `${baseUrl}/api/me`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.role === "support" &&
      data?.authReadinessEndpoint === "/api/auth/session-readiness" &&
      data?.authBoundary?.notRealLogin === true &&
      data?.authBoundary?.realLoginRequiredForLiveMode === true,
    detail: `当前角色 ${data?.role ?? "unknown"}，认证准备入口 ${data?.authReadinessEndpoint ?? "missing"}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`真实登录准备 API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`真实登录准备 API 烟测通过：${checks.length}/${checks.length}`);
