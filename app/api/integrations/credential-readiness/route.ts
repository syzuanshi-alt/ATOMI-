import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getSecretEncryptionReadiness } from "@/lib/security/secrets";

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "integrations.manage");
  if (forbidden) return forbidden;

  const credentialStorage = getSecretEncryptionReadiness();

  return NextResponse.json({
    mode: "demo",
    source: "server_side_credential_readiness",
    noteZh: "当前只做凭证管理预检，不保存真实平台访问凭证，不创建真实平台连接。",
    credentialStorage,
    requiredBeforeLiveMode: [
      "密钥加密存储",
      "官方只读接口权限",
      "同步日志",
      "失败重试记录",
      "人工审核开关",
      "操作审计",
    ],
    currentlyForbiddenActions: [
      "保存真实平台访问凭证",
      "读取真实客户数据",
      "创建真实平台连接",
      "自动发送客户消息",
      "绕过人工审核",
    ],
    guardrails: {
      noPlaintextCredentialReturned: true,
      noEnvValueReturned: true,
      noRealCredentialSaved: true,
      serverSideOnly: true,
      demoProbeOnly: true,
      manualReviewBeforeLiveMode: true,
    },
  });
}
