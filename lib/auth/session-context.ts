import "server-only";
import type { AppRequestContext, AppRole } from "@/lib/request-context";

export type LiveSessionClaim = "sessionId" | "userId" | "tenantId" | "role" | "issuedAt" | "expiresAt";

export type SessionContextReadiness = {
  realSessionEnabled: boolean;
  fallbackProvider: "demo";
  recommendedProvider: "authjs_with_postgres_rbac";
  permissionSource: "postgres_rbac";
  requiredClaims: LiveSessionClaim[];
  requiredDatabaseTables: string[];
  resolvedContextShape: {
    mode: "live";
    isDemo: false;
    tenantId: "from_session_and_tenant_members";
    userId: "from_session";
    role: "from_roles";
    permissions: "from_role_permissions";
    actorRef: "user:<userId>";
  };
  demoFallback: {
    role: AppRole;
    tenantId: string;
    userId: string;
    authSource: AppRequestContext["authSource"];
  };
};

export const getSessionContextReadiness = (context: AppRequestContext): SessionContextReadiness => {
  return {
    realSessionEnabled: false,
    fallbackProvider: "demo",
    recommendedProvider: "authjs_with_postgres_rbac",
    permissionSource: "postgres_rbac",
    requiredClaims: ["sessionId", "userId", "tenantId", "role", "issuedAt", "expiresAt"],
    requiredDatabaseTables: ["users", "tenant_members", "roles", "permissions", "role_permissions", "audit_logs"],
    resolvedContextShape: {
      mode: "live",
      isDemo: false,
      tenantId: "from_session_and_tenant_members",
      userId: "from_session",
      role: "from_roles",
      permissions: "from_role_permissions",
      actorRef: "user:<userId>",
    },
    demoFallback: {
      role: context.role,
      tenantId: context.tenantId,
      userId: context.userId,
      authSource: context.authSource,
    },
  };
};
