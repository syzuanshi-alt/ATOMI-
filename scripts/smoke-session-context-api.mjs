const baseUrl = process.env.SESSION_CONTEXT_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

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
  "管理员读取真实 Session 上下文映射草案",
  {
    url: `${baseUrl}/api/auth/session-context-readiness`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      data?.source === "session_context_readiness" &&
      data?.currentContext?.role === "admin" &&
      data?.sessionContext?.realSessionEnabled === false &&
      data?.sessionContext?.fallbackProvider === "demo" &&
      data?.sessionContext?.requiredClaims?.includes("userId") &&
      data?.sessionContext?.requiredClaims?.includes("tenantId") &&
      data?.sessionContext?.requiredClaims?.includes("role") &&
      data?.sessionContext?.requiredDatabaseTables?.includes("tenant_members") &&
      data?.sessionContext?.permissionSource === "postgres_rbac" &&
      data?.guardrails?.notRealLogin === true &&
      data?.guardrails?.noRealSessionCookieAccepted === true &&
      data?.guardrails?.businessApisUseUnifiedContext === true,
    detail: `来源 ${data?.sessionContext?.fallbackProvider ?? "unknown"}，权限 ${data?.sessionContext?.permissionSource ?? "unknown"}`,
  }),
);

await check(
  "无效 Demo 角色仍不能伪造成真实 Session",
  {
    url: `${baseUrl}/api/auth/session-context-readiness`,
    method: "GET",
    headers: { "x-demo-role": "hacker" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.currentContext?.role === "gm" &&
      data?.currentContext?.authSource === "default" &&
      data?.sessionContext?.realSessionEnabled === false &&
      data?.guardrails?.productionMustDisableDemoHeader === true,
    detail: `角色 ${data?.currentContext?.role ?? "unknown"}，来源 ${data?.currentContext?.authSource ?? "unknown"}`,
  }),
);

await check(
  "当前用户接口返回真实 Session 上下文入口",
  {
    url: `${baseUrl}/api/me`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok: response.status === 200 && data?.sessionContextReadinessEndpoint === "/api/auth/session-context-readiness",
    detail: `Session 上下文入口 ${data?.sessionContextReadinessEndpoint ?? "missing"}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`真实 Session 上下文 API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`真实 Session 上下文 API 烟测通过：${checks.length}/${checks.length}`);
