const baseUrl = process.env.RBAC_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

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
  "管理员读取 PostgreSQL RBAC 准备状态",
  {
    url: `${baseUrl}/api/permissions/rbac-readiness`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.mode === "demo" &&
      data?.source === "postgres_rbac_readiness" &&
      data?.currentActor?.role === "admin" &&
      data?.database?.configured === true &&
      data?.database?.reachable === true &&
      data?.rbac?.requiredRolesReady === true &&
      data?.rbac?.requiredPermissionsReady === true &&
      data?.rbac?.rolePermissionsMatchStaticMatrix === true &&
      data?.rbac?.activeTenantMembersCount === 5 &&
      data?.rbac?.wrongTenantCanReadPermissions === false &&
      data?.guardrails?.notRealLogin === true &&
      data?.guardrails?.readOnlyCheck === true &&
      data?.guardrails?.noRealUsers === true &&
      data?.guardrails?.noRealPlatformConnection === true,
    detail: `数据库 ${String(data?.database?.reachable)}，成员 ${data?.rbac?.activeTenantMembersCount ?? "unknown"}`,
  }),
);

await check(
  "客服不能读取 PostgreSQL RBAC 准备状态",
  {
    url: `${baseUrl}/api/permissions/rbac-readiness`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok: response.status === 403 && data?.requiredPermission === "integrations.manage",
    detail: response.status === 403 ? "权限拦截正常" : `预期 403，实际 ${response.status}`,
  }),
);

await check(
  "当前用户接口返回 RBAC 准备状态入口",
  {
    url: `${baseUrl}/api/me`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => ({
    ok: response.status === 200 && data?.rbacReadinessEndpoint === "/api/permissions/rbac-readiness",
    detail: `RBAC 入口 ${data?.rbacReadinessEndpoint ?? "missing"}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`RBAC API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`RBAC API 烟测通过：${checks.length}/${checks.length}`);
