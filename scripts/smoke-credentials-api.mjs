const baseUrl = process.env.CREDENTIALS_SMOKE_BASE_URL ?? "http://127.0.0.1:4173";

const forbiddenFragments = [
  "SECRETS_ENCRYPTION_KEY",
  "replace-with-32-byte-base64-key",
  "META_APP_SECRET",
  "TIKTOK_CLIENT_SECRET",
  "SHOPIFY_APP_CLIENT_SECRET",
  "token",
  "secret",
  "password",
  "邮箱密码",
];

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

  const result = verify(response, data, text);
  checks.push({ name, status: response.status, ok: result.ok, detail: result.detail });
};

const collectStringValues = (value) => {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStringValues);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStringValues);
  }

  return [];
};

const assertNoSensitiveFragments = (data) => {
  const lowered = collectStringValues(data).join("\n").toLowerCase();
  const leaked = forbiddenFragments.filter((fragment) => lowered.includes(fragment.toLowerCase()));
  return {
    ok: leaked.length === 0,
    leaked,
  };
};

await check(
  "管理员读取凭证管理预检状态",
  {
    url: `${baseUrl}/api/integrations/credential-readiness`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => {
    const leakCheck = assertNoSensitiveFragments(data);
    return {
      ok:
        response.status === 200 &&
        leakCheck.ok &&
        data?.mode === "demo" &&
        data?.source === "server_side_credential_readiness" &&
        data?.credentialStorage?.serverSideOnly === true &&
        typeof data?.credentialStorage?.encryptionKeyConfigured === "boolean" &&
        typeof data?.credentialStorage?.encryptionKeyValid === "boolean" &&
        data?.credentialStorage?.plaintextReturned === false &&
        data?.credentialStorage?.realCredentialSaveAllowed === false &&
        Array.isArray(data?.requiredBeforeLiveMode) &&
        data.requiredBeforeLiveMode.includes("密钥加密存储") &&
        data?.guardrails?.noPlaintextCredentialReturned === true &&
        data?.guardrails?.noEnvValueReturned === true &&
        data?.guardrails?.demoProbeOnly === true,
      detail: leakCheck.ok
        ? `配置 ${String(data?.credentialStorage?.encryptionKeyConfigured)}，有效 ${String(data?.credentialStorage?.encryptionKeyValid)}`
        : `响应疑似外露敏感片段：${leakCheck.leaked.join(",")}`,
    };
  },
);

await check(
  "客服角色不能读取凭证管理预检状态",
  {
    url: `${baseUrl}/api/integrations/credential-readiness`,
    method: "GET",
    headers: { "x-demo-role": "support" },
  },
  (response, data) => {
    const leakCheck = assertNoSensitiveFragments(data);
    return {
      ok: response.status === 403 && leakCheck.ok && data?.requiredPermission === "integrations.manage",
      detail: response.status === 403 ? "权限拦截正常，且未外露敏感字段" : `预期 403，实际 ${response.status}`,
    };
  },
);

await check(
  "数据接入配置包含真实上线前置条件且不外露凭证",
  {
    url: `${baseUrl}/api/integrations`,
    method: "GET",
    headers: { "x-demo-role": "admin" },
  },
  (response, data) => {
    const leakCheck = assertNoSensitiveFragments(data);
    const integrations = Array.isArray(data?.integrations) ? data.integrations : [];
    return {
      ok:
        response.status === 200 &&
        leakCheck.ok &&
        integrations.length === 6 &&
        integrations.every(
          (item) =>
            Array.isArray(item.liveModePrerequisites) &&
            item.liveModePrerequisites.includes("密钥加密存储") &&
            item.liveModePrerequisites.includes("同步日志") &&
            item.liveModePrerequisites.includes("失败重试记录") &&
            Array.isArray(item.currentlyForbiddenActions) &&
            item.currentlyForbiddenActions.some((action) => action.includes("真实密钥")) &&
            item.credentialPolicy?.plaintextReturned === false &&
            item.credentialPolicy?.realCredentialSaveAllowed === false,
        ) &&
        data?.guardrails?.noRealSecrets === true,
      detail: leakCheck.ok
        ? `接入项 ${integrations.length}，前置条件已返回`
        : `数据接入响应疑似外露敏感片段：${leakCheck.leaked.join(",")}`,
    };
  },
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`凭证安全 API 烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`凭证安全 API 烟测通过：${checks.length}/${checks.length}`);
