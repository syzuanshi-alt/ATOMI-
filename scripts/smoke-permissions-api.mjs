const baseUrl = process.env.PERMISSIONS_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

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

const findRole = (data, role) => {
  const roles = Array.isArray(data?.roles) ? data.roles : [];
  return roles.find((item) => item.role === role);
};

await check(
  "管理员读取权限矩阵",
  {
    url: `${baseUrl}/api/permissions/matrix`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => {
    const admin = findRole(data, "admin");
    const support = findRole(data, "support");
    const gm = findRole(data, "gm");
    return {
      ok:
        response.status === 200 &&
        data?.mode === "demo" &&
        data?.source === "demo_permission_matrix" &&
        data?.currentActor?.role === "admin" &&
        data?.guardrails?.demoRoleOnly === true &&
        data?.guardrails?.notRealLogin === true &&
        Array.isArray(data?.roles) &&
        data.roles.length === 5 &&
        admin?.canManageIntegrations === true &&
        support?.canManageIntegrations === false &&
        gm?.canReplySupport === false,
      detail: `角色 ${data?.roles?.length ?? 0}，当前 ${data?.currentActor?.role ?? "unknown"}`,
    };
  },
);

await check(
  "客服也能读取权限矩阵但不能被标记为真实登录",
  {
    url: `${baseUrl}/api/permissions/matrix`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.currentActor?.role === "support" &&
      data?.currentActor?.authSource === "header" &&
      data?.guardrails?.notRealLogin === true &&
      typeof data?.authBoundaryZh === "string" &&
      data.authBoundaryZh.includes("真实登录"),
    detail: `当前角色 ${data?.currentActor?.role ?? "unknown"}，认证来源 ${data?.currentActor?.authSource ?? "unknown"}`,
  }),
);

await check(
  "权限矩阵明确高风险接口边界",
  {
    url: `${baseUrl}/api/permissions/matrix`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => {
    const endpoints = Array.isArray(data?.apiPermissionChecks) ? data.apiPermissionChecks : [];
    const credentialReadiness = endpoints.find((item) => item.path === "/api/integrations/credential-readiness");
    const rbacReadiness = endpoints.find((item) => item.path === "/api/permissions/rbac-readiness");
    const aiDraftReview = endpoints.find((item) => item.path === "/api/support/ai-drafts/review");
    const sync = endpoints.find((item) => item.path === "/api/sync");
    return {
      ok:
        response.status === 200 &&
        credentialReadiness?.requiredPermissions?.includes("integrations.manage") &&
        credentialReadiness?.allowedRoles?.includes("admin") &&
        !credentialReadiness?.allowedRoles?.includes("support") &&
        rbacReadiness?.requiredPermissions?.includes("integrations.manage") &&
        rbacReadiness?.allowedRoles?.includes("admin") &&
        !rbacReadiness?.allowedRoles?.includes("support") &&
        aiDraftReview?.requiredPermissions?.includes("support.reply") &&
        aiDraftReview?.manualReviewRequired === true &&
        sync?.requiredPermissions?.includes("integrations.manage") &&
        sync?.realPlatformWriteAllowed === false,
      detail: `接口检查 ${endpoints.length}`,
    };
  },
);

await check(
  "当前用户接口返回权限矩阵入口",
  {
    url: `${baseUrl}/api/me`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => ({
    ok:
      response.status === 200 &&
      data?.role === "support" &&
      data?.permissionsMatrixEndpoint === "/api/permissions/matrix" &&
      data?.rbacReadinessEndpoint === "/api/permissions/rbac-readiness" &&
      data?.authBoundary?.demoRoleOnly === true &&
      data?.authBoundary?.notRealLogin === true,
    detail: `当前角色 ${data?.role ?? "unknown"}，权限入口 ${data?.permissionsMatrixEndpoint ?? "missing"}`,
  }),
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`权限矩阵 API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`权限矩阵 API 烟测通过：${checks.length}/${checks.length}`);
