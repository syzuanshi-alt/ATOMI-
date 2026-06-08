import "server-only";
import type { AppRequestContext } from "@/lib/request-context";

export type SessionProviderId = "demo" | "authjs_with_postgres_rbac" | "clerk";

export type SessionAdapterReadiness = {
  activeProvider: SessionProviderId;
  recommendedProvider: Exclude<SessionProviderId, "demo">;
  realSessionEnabled: boolean;
  authDependencyInstalled: boolean;
  businessApisUseUnifiedContext: boolean;
  currentContextSource: AppRequestContext["authSource"];
  requiredNextStepsZh: string[];
  blockedProductionInputsZh: string[];
};

export const getSessionAdapterReadiness = (context: AppRequestContext): SessionAdapterReadiness => {
  return {
    activeProvider: "demo",
    recommendedProvider: "authjs_with_postgres_rbac",
    realSessionEnabled: false,
    authDependencyInstalled: false,
    businessApisUseUnifiedContext: true,
    currentContextSource: context.authSource,
    requiredNextStepsZh: [
      "新增真实 Session 读取函数，但默认保持关闭。",
      "真实 Session 必须映射到 users、tenant_members、roles、permissions。",
      "业务 API 继续只通过 getRequestContext 或 requirePermission 获取身份和权限。",
      "确认后再安装 Auth.js 或单独试接 Clerk。",
    ],
    blockedProductionInputsZh: [
      "x-demo-role 请求头",
      "demo_role Cookie",
      "固定 Demo tenantId",
      "前端自报 role",
      "未落库的临时用户身份",
    ],
  };
};
