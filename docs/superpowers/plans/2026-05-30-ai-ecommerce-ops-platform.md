# AI Ecommerce Ops Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a commercially deliverable AI ecommerce operations platform MVP for 3-person development over 8-10 weeks.

**Architecture:** GitHub is the source of truth for code, Issues, PRs, and node reviews. Obsidian opens the repository `/docs` folder as the knowledge base. The product is a multi-tenant SaaS with a PC admin console, mobile H5/PWA, Feishu collaboration outputs, AI daily reports, and extensible platform integrations.

**Tech Stack:** Next.js App Router, React, TypeScript, PostgreSQL, Prisma, Feishu OpenAPI, scheduled jobs, AI output audit records, GitHub Projects, Obsidian Markdown, DOCX and XLSX deliverables.

---

## File Structure

```text
ai-ecommerce-ops-platform/
  app/
  packages/
    core/
    integrations/
    jobs/
  prisma/schema.prisma
  docs/
    00-首页.md
    01-业务总览/
    02-产品设计/
    03-技术架构/
    04-数据库模型/
    05-平台接口/
    06-项目推进/
    07-交付资料/
```

## Three Development Modules

### 模块 A：平台底座与数据中台

**负责人：** 负责人 1

**范围：** GitHub 仓库、项目结构、PostgreSQL/Prisma、租户、用户、权限、模块开关、同步任务、审计日志。

**验收：** 可创建客户公司；客户数据隔离；平台方可开关模块；同步任务有状态、日志、错误原因和重试记录。

### 模块 B：产品后台与手机端体验

**负责人：** 负责人 2

**范围：** 电脑端 SaaS 后台、平台总控、客户经营看板、任务中心、AI 日报展示、手机端 H5/PWA。

**验收：** 平台方可看客户和同步状态；客户可登录自己的后台；手机端可看日报、异常和关键待办。

### 模块 C：平台集成、AI 自动化与交付质量

**负责人：** 负责人 3

**范围：** 飞书多维表格、飞书群通知、抖音/TK 内容数据、抖店/独立站订单预留、邮件自动化、AI 日报、测试和交付文档。

**验收：** 飞书日报自动输出；视频/订单/任务数据进入系统；AI 建议可追溯并可人工确认；节点有测试记录。


## 8-10 Week Timeline

| Start | End | Stage | Focus | Owner | Review Gate |
|---|---|---|---|---|---|
| 2026-06-01 | 2026-06-05 | 项目启动 | 仓库、Projects、Obsidian docs、PRD、数据库草案 | 3人共同 | 审核范围、职责、一期边界 |
| 2026-06-08 | 2026-06-12 | 平台底座 1 | Next.js 后台骨架、Prisma、租户、用户、角色 | A+B | 审核多租户隔离 |
| 2026-06-15 | 2026-06-19 | 平台底座 2 | 平台总控、模块开关、操作日志、基础看板 | A+B | 审核权限和日志 |
| 2026-06-22 | 2026-06-26 | 飞书闭环 | 飞书多维表格、群通知、同步任务、失败记录 | A+C | 审核飞书输出稳定性 |
| 2026-06-29 | 2026-07-03 | AI 日报 | 日报生成、AI 输出保存、人工确认、日报页面 | B+C | 审核 AI 是否跑偏 |
| 2026-07-06 | 2026-07-10 | 内容数据 | 抖音/TK 账号、视频指标、内容复盘、飞书表 | A+C | 审核数据口径 |
| 2026-07-13 | 2026-07-17 | 经营看板 | 视频、任务、日报、同步状态、异常提醒 | B+C | 审核客户展示效果 |
| 2026-07-20 | 2026-07-24 | 订单模型 | 抖店/独立站订单模型、物流模型、异常订单 | A+C | 审核订单数据结构 |
| 2026-07-27 | 2026-07-31 | 手机端 | H5/PWA、日报、异常、审批、轻客服入口 | B | 审核移动端可用性 |
| 2026-08-03 | 2026-08-07 | MVP 加固 | 测试、漏洞修复、交付文档、演示数据、试点验收 | 3人共同 | 决定是否进入客户试点 |

## GitHub Workflow

- `main` is protected and accepts changes only through pull requests.
- `dev` is the integration branch.
- `feature/*`, `docs/*`, and `fix/*` branches are used for implementation.
- Every Issue has owner, due date, acceptance criteria, module, and risk level.
- Every PR links to an Issue and needs at least one human review.
- Critical PRs touching database, permissions, sync jobs, customer-visible pages, AI replies, Feishu exports, or email sending require two reviews.
- `CODEOWNERS` routes module-specific reviews automatically.

## Obsidian Knowledge Base

- Obsidian opens `/docs` inside the GitHub repository.
- Obsidian stores architecture decisions, PRD, database notes, interface permissions, meeting notes, risk records, and node review conclusions.
- Obsidian does not replace GitHub Issues or PRs.

## Database Model

- `tenants`：客户公司/租户。关键字段：name, status, plan, created_at。范围：一期。负责人：A。
- `users`：平台用户。关键字段：email, name, password_hash, status。范围：一期。负责人：A。
- `tenant_members`：租户成员关系。关键字段：tenant_id, user_id, role_id, status。范围：一期。负责人：A。
- `roles`：角色。关键字段：tenant_id, name, scope。范围：一期。负责人：A。
- `permissions`：权限点。关键字段：key, description, module。范围：一期。负责人：A。
- `module_entitlements`：模块开通。关键字段：tenant_id, module_key, enabled。范围：一期。负责人：A。
- `platform_connections`：平台授权连接。关键字段：tenant_id, platform, auth_status, token_ref。范围：一期。负责人：A/C。
- `sync_jobs`：同步任务定义。关键字段：tenant_id, source, schedule, enabled。范围：一期。负责人：A/C。
- `sync_runs`：同步运行记录。关键字段：job_id, status, started_at, finished_at, error。范围：一期。负责人：A/C。
- `accounts`：短视频/店铺/广告账号。关键字段：tenant_id, platform, handle, external_id。范围：一期。负责人：C。
- `content_items`：视频/素材记录。关键字段：account_id, platform, title, url, published_at。范围：一期。负责人：C。
- `content_metrics`：内容指标快照。关键字段：content_id, views, likes, comments, saves, shares。范围：一期。负责人：C。
- `orders`：订单主表。关键字段：tenant_id, source, external_order_id, customer_id, status, total_amount。范围：一期。负责人：A/C。
- `order_items`：订单明细。关键字段：order_id, sku, title, quantity, price。范围：一期。负责人：A/C。
- `shipments`：物流记录。关键字段：order_id, carrier, tracking_no, status, last_event_at。范围：一期。负责人：A/C。
- `customers`：客户资料。关键字段：tenant_id, name, email, phone, tags。范围：一期。负责人：B/C。
- `customer_threads`：客服会话。关键字段：tenant_id, customer_id, channel, status。范围：二期。负责人：B/C。
- `messages`：消息记录。关键字段：thread_id, sender_type, body, sent_at。范围：二期。负责人：B/C。
- `ai_outputs`：AI 输出。关键字段：tenant_id, type, input_summary, output, approval_status。范围：一期。负责人：C。
- `feishu_exports`：飞书同步记录。关键字段：tenant_id, table_key, record_id, status。范围：一期。负责人：C。
- `tasks`：系统待办。关键字段：tenant_id, type, owner_id, status, due_date。范围：一期。负责人：B/C。
- `audit_logs`：审计日志。关键字段：tenant_id, actor_id, action, target, created_at。范围：一期。负责人：A。

## Platform Interfaces

- **飞书**：多维表格记录、群消息、应用授权；权限：自建应用 App ID/Secret、多维表格读写、群消息权限；阶段：一期核心；负责人：C。
- **抖音**：企业号私信、评论、短视频数据；权限：企业号授权、开放平台应用、对应能力审核；阶段：一期/二期分步；负责人：C。
- **抖店**：订单、售后、商品、物流；权限：抖店开放平台应用、店铺授权、订单/售后权限；阶段：一期订单模型，二期深化；负责人：C。
- **独立站/Shopify**：订单、客户、支付、Webhook；权限：Shopify Admin API/Webhook 权限或独立站后台接口；阶段：一期核心；负责人：A/C。
- **TikTok/TK**：账号内容、视频指标、后续 Shop/Ads 能力；权限：官方接口权限或内部测试数据源；阶段：一期内容监控；负责人：C。
- **邮件**：订单通知、节日祝福、达人建联；权限：SMTP/Resend/阿里云邮件服务、退订与频率控制；阶段：一期基础，二期自动化；负责人：C。

## Node Review Cadence

- Daily 10-minute standup: yesterday, today, blockers.
- Friday weekly review: schedule, business direction, code quality, data correctness, permission risks, next-week adjustment.
- Critical PR review: database, permissions, sync, AI reply, customer-visible UI, Feishu/email output.

## AI Tool Rules

- AI may draft Issues, docs, tests, review comments, and non-critical scaffolding.
- AI must not merge PRs, touch production secrets, send customer emails, auto-approve refunds, or auto-reply high-risk customer messages.
- Claude/Codex output must be reviewed by a human owner before adoption.

## Bite-Sized Execution Tasks

### Task 1: Repository and Project Control

**Files:**
- Create: `README.md`
- Create: `docs/00-首页.md`
- Create: `.github/pull_request_template.md`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/CODEOWNERS`

- [ ] Create the private GitHub repository `ai-ecommerce-ops-platform`.
- [ ] Add branch protection for `main`.
- [ ] Create GitHub Project fields: Module, Owner, Status, Due Date, Review Gate, Risk Level, Customer Visible.
- [ ] Commit the initial docs structure.

### Task 2: Multi-Tenant Foundation

**Files:**
- Create: `prisma/schema.prisma`
- Create: `packages/core/src/tenancy.ts`
- Create: `packages/core/src/rbac.ts`

- [ ] Define tenant, user, role, permission, membership, module entitlement, and audit log models.
- [ ] Add tests proving tenant A cannot access tenant B records.
- [ ] Implement permission helpers for platform admin, tenant admin, operator, customer service, BD, media buyer, and read-only owner.
- [ ] Commit as `feat: add multi-tenant foundation`.

### Task 3: Sync and Feishu Foundation

**Files:**
- Create: `packages/integrations/src/feishu.ts`
- Create: `packages/jobs/src/sync-runner.ts`
- Create: `app/api/jobs/feishu-daily-report/route.ts`

- [ ] Add Feishu connection config model usage.
- [ ] Implement idempotent Feishu record upsert.
- [ ] Record sync runs with started, succeeded, failed, and retry states.
- [ ] Generate one daily report row and one Feishu group notification from test data.
- [ ] Commit as `feat: add feishu sync foundation`.

### Task 4: Content Data and AI Daily Report

**Files:**
- Create: `packages/core/src/content-metrics.ts`
- Create: `packages/jobs/src/ai-daily-report.ts`
- Create: `app/(dashboard)/reports/page.tsx`

- [ ] Store content items and metric snapshots.
- [ ] Generate AI report records with input summary, output, confidence, and approval status.
- [ ] Display report and sync status in the dashboard.
- [ ] Commit as `feat: add content metrics and ai daily report`.

### Task 5: Orders, Logistics, and Mobile MVP

**Files:**
- Create: `packages/core/src/orders.ts`
- Create: `app/(dashboard)/orders/page.tsx`
- Create: `app/(mobile)/today/page.tsx`

- [ ] Add orders, order items, shipments, customers, and tasks.
- [ ] Display abnormal orders and logistics delays.
- [ ] Build mobile daily view with report, alerts, and task approvals.
- [ ] Commit as `feat: add order monitoring and mobile daily view`.

## Self-Review

- Spec coverage: 3 development modules, 8-10 week schedule, GitHub/Obsidian workflow, AI tool rules, database model, interface list, and node reviews are covered.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: module names, dates, owners, and acceptance gates match the DOCX and XLSX deliverables.
