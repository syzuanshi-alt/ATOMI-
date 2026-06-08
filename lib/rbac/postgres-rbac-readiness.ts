import "server-only";
import { getDatabaseUrl, query } from "@/lib/db";
import { appRoles, rolePermissions, type AppPermissionRole, type Permission } from "@/lib/permissions";

const POSTGRES_DEMO_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const WRONG_TENANT_ID = "00000000-0000-4000-8000-000000000000";

type RolePermissionRow = {
  roleCode: string;
  permissionCode: string;
};

type CountRow = {
  count: number;
};

type RbacReadinessResult = {
  database: {
    configured: boolean;
    reachable: boolean;
    errorZh: string | null;
  };
  rbac: {
    requiredRoles: AppPermissionRole[];
    requiredRolesReady: boolean;
    requiredPermissionsCount: number;
    requiredPermissionsReady: boolean;
    rolePermissionsMatchStaticMatrix: boolean;
    activeTenantMembersCount: number;
    wrongTenantCanReadPermissions: boolean;
    sandboxUsersOnly: boolean;
    mismatchNotesZh: string[];
  };
};

const uniquePermissions = (): Permission[] => {
  return [...new Set(appRoles.flatMap((role) => rolePermissions[role]))];
};

const sorted = (items: string[]): string[] => [...items].sort();

const sameList = (left: string[], right: string[]): boolean => {
  return sorted(left).join(",") === sorted(right).join(",");
};

export const getPostgresRbacReadiness = async (): Promise<RbacReadinessResult> => {
  const requiredRoles = [...appRoles];
  const requiredPermissions = uniquePermissions();
  const databaseConfigured = Boolean(getDatabaseUrl());

  const emptyResult = (errorZh: string | null): RbacReadinessResult => ({
    database: {
      configured: databaseConfigured,
      reachable: false,
      errorZh,
    },
    rbac: {
      requiredRoles,
      requiredRolesReady: false,
      requiredPermissionsCount: requiredPermissions.length,
      requiredPermissionsReady: false,
      rolePermissionsMatchStaticMatrix: false,
      activeTenantMembersCount: 0,
      wrongTenantCanReadPermissions: false,
      sandboxUsersOnly: false,
      mismatchNotesZh: errorZh ? [errorZh] : [],
    },
  });

  if (!databaseConfigured) {
    return emptyResult("缺少 DATABASE_URL，无法读取 PostgreSQL RBAC 沙箱。");
  }

  try {
    const roleRows = await query<{ code: string }>("select code from roles order by code");
    const permissionRows = await query<{ code: string }>("select code from permissions order by code");
    const rolePermissionRows = await query<RolePermissionRow>(
      `
        select roles.code as "roleCode", permissions.code as "permissionCode"
        from roles
        join role_permissions on role_permissions.role_id = roles.id
        join permissions on permissions.id = role_permissions.permission_id
        order by roles.code, permissions.code
      `,
    );
    const tenantMemberRows = await query<{ email: string }>(
      `
        select users.email
        from tenant_members
        join users on users.id = tenant_members.user_id
        where tenant_members.tenant_id = $1
          and tenant_members.status = 'active'
        order by users.email
      `,
      [POSTGRES_DEMO_TENANT_ID],
    );
    const wrongTenantRows = await query<CountRow>(
      `
        select count(*)::int as count
        from tenant_members
        join role_permissions on role_permissions.role_id = tenant_members.role_id
        where tenant_members.tenant_id = $1
      `,
      [WRONG_TENANT_ID],
    );

    const roleCodes = roleRows.map((row) => row.code);
    const permissionCodes = permissionRows.map((row) => row.code);
    const mismatchNotesZh: string[] = [];
    const requiredRolesReady = requiredRoles.every((role) => roleCodes.includes(role));
    const requiredPermissionsReady = requiredPermissions.every((permission) => permissionCodes.includes(permission));

    if (!requiredRolesReady) {
      const missingRoles = requiredRoles.filter((role) => !roleCodes.includes(role));
      mismatchNotesZh.push(`缺少角色：${missingRoles.join(",")}`);
    }

    if (!requiredPermissionsReady) {
      const missingPermissions = requiredPermissions.filter((permission) => !permissionCodes.includes(permission));
      mismatchNotesZh.push(`缺少权限：${missingPermissions.join(",")}`);
    }

    let rolePermissionsMatchStaticMatrix = true;
    for (const role of requiredRoles) {
      const actualPermissions = rolePermissionRows
        .filter((row) => row.roleCode === role)
        .map((row) => row.permissionCode);
      const expectedPermissions = rolePermissions[role];
      if (!sameList(actualPermissions, expectedPermissions)) {
        rolePermissionsMatchStaticMatrix = false;
        mismatchNotesZh.push(`${role} 权限和静态矩阵不一致。`);
      }
    }

    const activeTenantMembersCount = tenantMemberRows.length;
    const sandboxUsersOnly = tenantMemberRows.every((row) => row.email.endsWith(".test"));
    if (!sandboxUsersOnly) {
      mismatchNotesZh.push("发现非 .test 邮箱，RBAC 沙箱可能混入真实用户。");
    }

    const wrongTenantCanReadPermissions = (wrongTenantRows[0]?.count ?? 0) > 0;
    if (wrongTenantCanReadPermissions) {
      mismatchNotesZh.push("错误 tenant_id 读取到了成员权限，租户隔离有风险。");
    }

    return {
      database: {
        configured: true,
        reachable: true,
        errorZh: null,
      },
      rbac: {
        requiredRoles,
        requiredRolesReady,
        requiredPermissionsCount: requiredPermissions.length,
        requiredPermissionsReady,
        rolePermissionsMatchStaticMatrix,
        activeTenantMembersCount,
        wrongTenantCanReadPermissions,
        sandboxUsersOnly,
        mismatchNotesZh,
      },
    };
  } catch (error) {
    return emptyResult(error instanceof Error ? error.message : "PostgreSQL RBAC 沙箱读取失败。");
  }
};
