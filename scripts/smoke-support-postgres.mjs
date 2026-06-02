import { DEMO_TENANT_ID, withPostgres } from "./support-postgres-utils.mjs";

const checks = [];

const check = async (name, run) => {
  try {
    const detail = await run();
    checks.push({ name, ok: true, detail });
  } catch (error) {
    checks.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
};

try {
  await withPostgres(async (pool) => {
  await check("Demo 租户存在", async () => {
    const result = await pool.query("select id, name from tenants where id = $1", [DEMO_TENANT_ID]);
    if (result.rowCount !== 1) {
      throw new Error("没有找到 Demo 沙箱租户，请先运行 npm run db:support:seed");
    }
    return result.rows[0].name;
  });

  await check("客服会话按 tenant_id 查询", async () => {
    const result = await pool.query(
      `
        select id, subject, risk_level
        from customer_threads
        where tenant_id = $1
        order by risk_level desc, last_message_at desc
      `,
      [DEMO_TENANT_ID],
    );
    if (result.rowCount < 2) {
      throw new Error(`期望至少 2 条沙箱客服会话，实际 ${result.rowCount}`);
    }
    return `会话数 ${result.rowCount}`;
  });

  await check("错误 tenant_id 不能读到会话", async () => {
    const result = await pool.query(
      "select count(*)::int as count from customer_threads where tenant_id = $1",
      ["00000000-0000-4000-8000-000000000000"],
    );
    if (result.rows[0].count !== 0) {
      throw new Error("错误 tenant_id 读到了客服会话，租户隔离有风险。");
    }
    return "错误 tenant_id 返回 0 条";
  });

  await check("沙箱数据没有真实邮箱域名", async () => {
    const result = await pool.query(
      `
        select primary_email
        from customers
        where tenant_id = $1
          and coalesce(primary_email, '') <> ''
          and primary_email not like '%.test'
      `,
      [DEMO_TENANT_ID],
    );
    if (result.rowCount > 0) {
      throw new Error("发现非 .test 邮箱，疑似混入真实客户数据。");
    }
    return "所有客户邮箱均为 .test 假数据";
  });

  await check("AI 草稿和审批记录存在", async () => {
    const result = await pool.query(
      `
        select
          (select count(*)::int from ai_reply_suggestions where tenant_id = $1) as drafts_count,
          (select count(*)::int from ai_approvals where tenant_id = $1) as approvals_count
      `,
      [DEMO_TENANT_ID],
    );
    const row = result.rows[0];
    if (row.drafts_count < 2 || row.approvals_count < 1) {
      throw new Error(`AI 草稿或审批记录不足：drafts=${row.drafts_count}, approvals=${row.approvals_count}`);
    }
    return `草稿 ${row.drafts_count}，审批 ${row.approvals_count}`;
  });

  await check("只读 Repository 关联数据完整", async () => {
    const result = await pool.query(
      `
        select
          count(distinct threads.id)::int as threads_count,
          count(distinct customers.id)::int as customers_count,
          count(distinct messages.id)::int as messages_count,
          count(distinct translations.id)::int as translations_count,
          count(distinct drafts.id)::int as drafts_count
        from customer_threads threads
        left join customers
          on customers.tenant_id = threads.tenant_id
          and customers.id = threads.customer_id
        left join messages
          on messages.tenant_id = threads.tenant_id
          and messages.thread_id = threads.id
        left join message_translations translations
          on translations.tenant_id = threads.tenant_id
          and translations.message_id = messages.id
        left join ai_reply_suggestions drafts
          on drafts.tenant_id = threads.tenant_id
          and drafts.thread_id = threads.id
        where threads.tenant_id = $1
      `,
      [DEMO_TENANT_ID],
    );
    const row = result.rows[0];
    if (row.threads_count < 2 || row.customers_count < 2 || row.messages_count < 2 || row.drafts_count < 2) {
      throw new Error(
        `只读 Repository 关联数据不足：threads=${row.threads_count}, customers=${row.customers_count}, messages=${row.messages_count}, drafts=${row.drafts_count}`,
      );
    }
    return `会话 ${row.threads_count}，客户 ${row.customers_count}，消息 ${row.messages_count}，翻译 ${row.translations_count}，草稿 ${row.drafts_count}`;
  });
  });
} catch (error) {
  console.error("PostgreSQL 沙箱烟测未完成。");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${item.name}: ${item.detail}`);
}

if (failed.length) {
  console.error(`PostgreSQL 沙箱烟测失败：${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`PostgreSQL 沙箱烟测通过：${checks.length}/${checks.length}`);
