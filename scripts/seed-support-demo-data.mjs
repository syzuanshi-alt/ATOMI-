import { DEMO_SUPPORT_ROLE_ID, DEMO_SUPPORT_USER_ID, DEMO_TENANT_ID, withPostgres } from "./support-postgres-utils.mjs";

const ids = {
  permissionRead: "44444444-4444-4444-8444-444444444441",
  permissionReply: "44444444-4444-4444-8444-444444444442",
  permissionApprove: "44444444-4444-4444-8444-444444444443",
  channelChat: "55555555-5555-4555-8555-555555555551",
  customerEmily: "66666666-6666-4666-8666-666666666661",
  customerLi: "66666666-6666-4666-8666-666666666662",
  identityEmily: "77777777-7777-4777-8777-777777777771",
  identityLi: "77777777-7777-4777-8777-777777777772",
  threadShipping: "88888888-8888-4888-8888-888888888881",
  threadRefund: "88888888-8888-4888-8888-888888888882",
  messageShipping: "99999999-9999-4999-8999-999999999991",
  messageRefund: "99999999-9999-4999-8999-999999999992",
  translationShipping: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  draftShipping: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  draftRefund: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
  approvalRefund: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
  handoffReport: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  auditSeed: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
};

try {
  await withPostgres(async (pool) => {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const resetTables = ["ai_autoreplies", "ai_approvals", "ai_outputs", "audit_logs", "ai_reply_suggestions"];
    for (const table of resetTables) {
      await client.query(`delete from ${table} where tenant_id = $1`, [DEMO_TENANT_ID]);
    }

    await client.query(
      `
        insert into tenants (id, name)
        values ($1, 'Demo 沙箱租户 - 仅假数据')
        on conflict (id) do update set name = excluded.name
      `,
      [DEMO_TENANT_ID],
    );

    await client.query(
      `
        insert into users (id, email, display_name, status)
        values ($1, 'support.sandbox@example.test', '沙箱客服', 'active')
        on conflict (email) do update
        set display_name = excluded.display_name,
            status = excluded.status,
            updated_at = now()
      `,
      [DEMO_SUPPORT_USER_ID],
    );

    await client.query(
      `
        insert into roles (id, code, name)
        values ($1, 'support', '客服')
        on conflict (code) do update set name = excluded.name
      `,
      [DEMO_SUPPORT_ROLE_ID],
    );

    const permissions = [
      [ids.permissionRead, "support.read", "查看客服消息"],
      [ids.permissionReply, "support.reply", "生成客服回复草稿"],
      [ids.permissionApprove, "actions.approve", "审核 AI 动作"],
    ];

    for (const permission of permissions) {
      await client.query(
        `
          insert into permissions (id, code, name)
          values ($1, $2, $3)
          on conflict (code) do update set name = excluded.name
        `,
        permission,
      );
    }

    await client.query(
      `
        insert into role_permissions (role_id, permission_id)
        select $1, id
        from permissions
        where code = any($2::text[])
        on conflict (role_id, permission_id) do nothing
      `,
      [DEMO_SUPPORT_ROLE_ID, permissions.map((permission) => permission[1])],
    );

    await client.query(
      `
        insert into tenant_members (tenant_id, user_id, role_id, status)
        values ($1, $2, $3, 'active')
        on conflict (tenant_id, user_id) do update
        set role_id = excluded.role_id,
            status = excluded.status,
            updated_at = now()
      `,
      [DEMO_TENANT_ID, DEMO_SUPPORT_USER_ID, DEMO_SUPPORT_ROLE_ID],
    );

    await client.query(
      `
        insert into support_channels (id, tenant_id, channel_type, name, status, difficulty)
        values ($1, $2, 'independent_site_chat', '独立站在线客服沙箱', 'demo', 'low')
        on conflict (id) do update
        set name = excluded.name,
            status = excluded.status,
            difficulty = excluded.difficulty
      `,
      [ids.channelChat, DEMO_TENANT_ID],
    );

    const customers = [
      [ids.customerEmily, "Emily Sandbox", "emily.sandbox@example.test", "US", "en-US"],
      [ids.customerLi, "李先生沙箱", "li.sandbox@example.test", "OTHER", "zh-CN"],
    ];

    for (const customer of customers) {
      await client.query(
        `
          insert into customers (id, tenant_id, display_name, primary_email, country, language)
          values ($1, $2, $3, $4, $5, $6)
          on conflict (id) do update
          set display_name = excluded.display_name,
              primary_email = excluded.primary_email,
              country = excluded.country,
              language = excluded.language,
              updated_at = now()
        `,
        [customer[0], DEMO_TENANT_ID, customer[1], customer[2], customer[3], customer[4]],
      );
    }

    const identities = [
      [ids.identityEmily, ids.customerEmily, "site_chat_sandbox_88421", "Emily S."],
      [ids.identityLi, ids.customerLi, "li.sandbox@example.test", "李先生沙箱"],
    ];

    for (const identity of identities) {
      await client.query(
        `
          insert into customer_identities (id, tenant_id, customer_id, channel_type, external_user_id, display_name)
          values ($1, $2, $3, 'independent_site_chat', $4, $5)
          on conflict (tenant_id, channel_type, external_user_id) do update
          set display_name = excluded.display_name
        `,
        [identity[0], DEMO_TENANT_ID, identity[1], identity[2], identity[3]],
      );
    }

    const threads = [
      [ids.threadShipping, ids.customerEmily, "客户询问沙箱订单发货时间", "ai_managed", "medium", "en-US", "SANDBOX-1041"],
      [ids.threadRefund, ids.customerLi, "客户要求沙箱退款", "needs_human", "high", "zh-CN", "SANDBOX-1028"],
    ];

    for (const thread of threads) {
      await client.query(
        `
          insert into customer_threads (
            id, tenant_id, customer_id, channel_type, subject, status, risk_level, language, order_ref, last_message_at
          )
          values ($1, $2, $3, 'independent_site_chat', $4, $5, $6, $7, $8, now())
          on conflict (id) do update
          set subject = excluded.subject,
              status = excluded.status,
              risk_level = excluded.risk_level,
              language = excluded.language,
              order_ref = excluded.order_ref,
              last_message_at = now(),
              updated_at = now()
        `,
        [thread[0], DEMO_TENANT_ID, thread[1], thread[2], thread[3], thread[4], thread[5], thread[6]],
      );
    }

    const messages = [
      [ids.messageShipping, ids.threadShipping, "customer", "site_chat_sandbox_88421", "Hi, when will my sandbox order SANDBOX-1041 be delivered?"],
      [ids.messageRefund, ids.threadRefund, "customer", "li.sandbox@example.test", "我要退款，沙箱订单 SANDBOX-1028 的刻字好像不对。"],
    ];

    for (const message of messages) {
      await client.query(
        `
          insert into messages (
            id, tenant_id, thread_id, channel_type, direction, sender_type, sender_ref, original_text, original_payload
          )
          values ($1, $2, $3, 'independent_site_chat', 'inbound', $4, $5, $6, '{"sandbox": true}'::jsonb)
          on conflict (id) do update
          set original_text = excluded.original_text,
              original_payload = excluded.original_payload
        `,
        [message[0], DEMO_TENANT_ID, message[1], message[2], message[3], message[4]],
      );
    }

    await client.query(
      `
        insert into message_translations (
          id, tenant_id, message_id, source_language, target_language, translated_text, model_name, human_edited
        )
        values ($1, $2, $3, 'en-US', 'zh-CN', '您好，我的沙箱订单 SANDBOX-1041 什么时候送达？', 'sandbox-translation', false)
        on conflict (id) do update
        set translated_text = excluded.translated_text,
            model_name = excluded.model_name
      `,
      [ids.translationShipping, DEMO_TENANT_ID, ids.messageShipping],
    );

    const drafts = [
      [
        ids.draftShipping,
        ids.threadShipping,
        ids.messageShipping,
        "Hi, thanks for your message. Please send your order email so our sandbox support team can check faster.",
        "medium",
        "订单物流咨询需要人工确认，不承诺具体送达时间。",
        "pending_review",
        false,
      ],
      [
        ids.draftRefund,
        ids.threadRefund,
        ids.messageRefund,
        "您好，已收到您的沙箱退款诉求。客服会先核实订单与刻字信息后继续处理。",
        "high",
        "退款和定制争议属于高风险售后，AI 不允许承诺退款或补偿。",
        "pending_review",
        false,
      ],
    ];

    for (const draft of drafts) {
      await client.query(
        `
          insert into ai_reply_suggestions (
            id, tenant_id, thread_id, message_id, draft_text, risk_level, reason, status, can_auto_send
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          on conflict (id) do update
          set draft_text = excluded.draft_text,
              risk_level = excluded.risk_level,
              reason = excluded.reason,
              status = excluded.status,
              can_auto_send = excluded.can_auto_send
        `,
        [draft[0], DEMO_TENANT_ID, draft[1], draft[2], draft[3], draft[4], draft[5], draft[6], draft[7]],
      );
    }

    await client.query(
      `
        insert into ai_approvals (
          id, tenant_id, source_type, source_id, risk_level, decision, approver_ref, final_text, review_note, human_edited
        )
        values (
          $1, $2, 'ai_reply_suggestion', $3, 'high', 'rejected', 'demo:support',
          null, '沙箱退款争议必须人工继续处理，AI 草稿不发送。', false
        )
        on conflict (id) do update
        set decision = excluded.decision,
            review_note = excluded.review_note
      `,
      [ids.approvalRefund, DEMO_TENANT_ID, ids.draftRefund],
    );

    await client.query(
      `
        insert into handoff_reports (
          id, tenant_id, report_date, window_start, window_end, new_threads_count,
          ai_replies_count, needs_human_count, high_risk_count, summary
        )
        values (
          $1, $2, current_date, now() - interval '12 hours', now(), 2,
          0, 1, 1, '{"sandbox": true, "summary": "本地沙箱日报，只包含假数据。"}'::jsonb
        )
        on conflict (id) do update
        set new_threads_count = excluded.new_threads_count,
            needs_human_count = excluded.needs_human_count,
            high_risk_count = excluded.high_risk_count,
            summary = excluded.summary
      `,
      [ids.handoffReport, DEMO_TENANT_ID],
    );

    await client.query(
      `
        insert into audit_logs (id, tenant_id, actor, event, metadata)
        values (
          $1, $2, 'demo:support', 'support.sandbox.seed',
          '{"sandbox": true, "note": "本地假数据种子，不是真实客户数据。"}'::jsonb
        )
        on conflict (id) do update
        set metadata = excluded.metadata,
            created_at = now()
      `,
      [ids.auditSeed, DEMO_TENANT_ID],
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

console.log("本地 PostgreSQL 假客服数据写入完成。");
console.log(`Demo tenant_id：${DEMO_TENANT_ID}`);
console.log("已重置 Demo 租户下的 AI 草稿、AI 输出、审批和审计沙箱记录。");
console.log("注意：这些都是 .test 邮箱和 SANDBOX 订单号，不是真实客户数据。");
  });
} catch (error) {
  console.error("本地 PostgreSQL 假数据写入未完成。");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
