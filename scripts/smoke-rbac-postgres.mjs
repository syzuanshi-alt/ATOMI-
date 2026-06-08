import { DEMO_TENANT_ID, withPostgres } from "./support-postgres-utils.mjs";

const checks = [];

const expectedRoles = {
  admin: [
    "dashboard.read",
    "integrations.manage",
    "creators.read",
    "creators.manage",
    "creatives.read",
    "creatives.manage",
    "ads.read",
    "ads.recommend",
    "orders.read",
    "orders.manage",
    "support.read",
    "support.reply",
    "support.autopilot.manage",
    "actions.read",
    "actions.approve",
    "privacy.manage",
  ],
  gm: ["dashboard.read", "creators.read", "ads.read", "orders.read", "support.read", "actions.read", "actions.approve"],
  bd: ["dashboard.read", "creators.read", "creators.manage", "creatives.read", "actions.read", "actions.approve"],
  media_buyer: ["dashboard.read", "creatives.read", "creatives.manage", "ads.read", "ads.recommend", "actions.read", "actions.approve"],
  support: [
    "dashboard.read",
    "orders.read",
    "orders.manage",
    "support.read",
    "support.reply",
    "support.autopilot.manage",
    "actions.read",
    "actions.approve",
    "privacy.manage",
  ],
};

const expectedRoleCodes = Object.keys(expectedRoles).sort();

const check = async (name, run) => {
  try {
    const detail = await run();
    checks.push({ name, ok: true, detail });
  } catch (error) {
    checks.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
};

const sorted = (items) => [...items].sort();

const assertSameList = (actual, expected, label) => {
  const actualText = sorted(actual).join(",");
  const expectedText = sorted(expected).join(",");
  if (actualText !== expectedText) {
    throw new Error(`${label} 不一致。实际：${actualText || "空"}；期望：${expectedText}`);
  }
};

const assertIncludesAll = (actual, expected, label) => {
  const missing = expected.filter((item) => !actual.includes(item));
  if (missing.length) {
    throw new Error(`${label} 缺少：${missing.join(",")}`);
  }
};

try {
  await withPostgres(async (pool) => {
    await check("RBAC 角色已补齐", async () => {
      const result = await pool.query("select code from roles order by code");
      const roleCodes = result.rows.map((row) => row.code);
      assertIncludesAll(roleCodes, expectedRoleCodes, "角色列表");
      return `必需角色已存在：${expectedRoleCodes.join(",")}`;
    });

    await check("RBAC 权限已补齐", async () => {
      const expectedPermissions = [...new Set(Object.values(expectedRoles).flat())];
      const result = await pool.query("select code from permissions order by code");
      const permissionCodes = result.rows.map((row) => row.code);
      assertIncludesAll(permissionCodes, expectedPermissions, "权限列表");
      return `必需权限已存在：${expectedPermissions.length} 个`;
    });

    await check("每个角色的权限和静态矩阵一致", async () => {
      const result = await pool.query(
        `
          select roles.code as role_code, permissions.code as permission_code
          from roles
          join role_permissions on role_permissions.role_id = roles.id
          join permissions on permissions.id = role_permissions.permission_id
          order by roles.code, permissions.code
        `,
      );

      for (const [roleCode, permissions] of Object.entries(expectedRoles)) {
        const actualPermissions = result.rows
          .filter((row) => row.role_code === roleCode)
          .map((row) => row.permission_code);
        assertSameList(actualPermissions, permissions, `${roleCode} 权限`);
      }

      return "数据库角色权限与 Demo 静态矩阵一致";
    });

    await check("Demo 租户成员可读取角色和权限", async () => {
      const result = await pool.query(
        `
          select users.email, roles.code as role_code, permissions.code as permission_code
          from tenant_members
          join users on users.id = tenant_members.user_id
          join roles on roles.id = tenant_members.role_id
          join role_permissions on role_permissions.role_id = roles.id
          join permissions on permissions.id = role_permissions.permission_id
          where tenant_members.tenant_id = $1
            and tenant_members.status = 'active'
          order by users.email, permissions.code
        `,
        [DEMO_TENANT_ID],
      );

      const users = new Set(result.rows.map((row) => row.email));
      if (users.size !== expectedRoleCodes.length) {
        throw new Error(`期望 ${expectedRoleCodes.length} 个 Demo 成员，实际 ${users.size}`);
      }
      if (!result.rows.every((row) => row.email.endsWith(".test"))) {
        throw new Error("RBAC 沙箱成员必须使用 .test 假邮箱。");
      }

      return `成员 ${users.size} 个，权限映射 ${result.rowCount} 条`;
    });

    await check("错误 tenant_id 不能读取成员权限", async () => {
      const result = await pool.query(
        `
          select count(*)::int as count
          from tenant_members
          join role_permissions on role_permissions.role_id = tenant_members.role_id
          where tenant_members.tenant_id = $1
        `,
        ["00000000-0000-4000-8000-000000000000"],
      );

      if (result.rows[0].count !== 0) {
        throw new Error("错误 tenant_id 读取到了成员权限，租户隔离有风险。");
      }

      return "错误 tenant_id 返回 0 条成员权限";
    });
  });
} catch (error) {
  console.error("PostgreSQL RBAC 沙箱烟测未完成。");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`PostgreSQL RBAC 沙箱烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`PostgreSQL RBAC 沙箱烟测通过：${checks.length}/${checks.length}`);
