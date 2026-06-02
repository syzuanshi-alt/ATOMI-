# AI 电商自动化平台 Demo 工程

当前项目已切换为“AI 电商自动化平台”改造方向。原 ATOMI SHINE 腕表增长 Demo 保留为页面体验和客户演示基础，后续会按 `D:\SHKF\docs` Obsidian 知识库中的业务规则逐步改造成可商用试点的电商 AI 自动化平台。

## 先读这几个文件

1. `docs/AI电商自动化平台完整搭建执行计划.md`
2. `docs/第1周执行清单-AI客服托管原型.md`
3. `docs/Demo模式与真实模式边界.md`
4. `docs/AI客服消息中台与托管规则.md`

Claude Code / Codex 每次执行前必须先读完整计划和第 1 周清单。

## 当前禁止事项

- 不输入真实 token、secret、邮箱密码、客户资料。
- 不接个人微信自动化。
- 不自动发送真实客户消息。
- 不让 AI 自动承诺退款、补偿、发货时间、改价、取消订单。
- 不把 Demo 数据说成真实接口数据。

This workspace now contains two deliverables:

1. A zero-dependency static demo at `index.html`.
2. A production-oriented Next.js + TypeScript app template under `app/`, `components/`, `lib/`, `db/`, and `workers/`.

## Run the Next.js app

For immediate visual review without installing dependencies, double-click:

```text
launch-app.cmd
```

This opens the static interactive demo at `index.html`.

For the production-oriented Next.js app:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

## Local services

```bash
docker compose up -d postgres redis
```

Then copy `.env.example` to `.env.local` and replace credentials.

## Repository mode guardrails（数据访问层模式护栏）

当前客服消息中台默认使用 Demo Repository（演示数据访问层），不会连接真实数据库，也不会读取真实客户消息。

环境变量：

```text
SUPPORT_REPOSITORY_MODE=demo
ENABLE_POSTGRES_SUPPORT_REPOSITORY=false
DATABASE_URL=postgres://atomi:atomi@127.0.0.1:5432/atomi_growth
```

小白团队先按这个规则理解：

- `demo`：默认模式，使用内置模拟数据，适合演示和开发。
- `postgres`：未来真实 PostgreSQL（数据库）模式，现在只做边界预留，仍会回退 Demo。
- `DATABASE_URL`：数据库连接地址，真实值只能放 `.env.local` 或部署平台环境变量里，不能提交到 Git。
- `ENABLE_POSTGRES_SUPPORT_REPOSITORY=true`：未来真正实现 PostgreSQL Repository 后才允许打开；当前仍是占位实现，不能用于生产。

检查当前模式：

```text
GET http://127.0.0.1:4173/api/support/repository-status
```

如果误配置为 `SUPPORT_REPOSITORY_MODE=postgres`，系统会回退到 Demo Repository，并在接口返回里说明原因。这样可以避免页面直接崩掉，也能防止团队误以为已经接入真实数据库。

## Local PostgreSQL sandbox（本地数据库沙箱）

本地 PostgreSQL 沙箱只用于验证表结构和假数据读写，不代表已经接入真实客户数据。

操作顺序：

```bash
docker compose up -d postgres
copy .env.example .env.local
npm run db:schema:check
npm run db:support:seed
npm run smoke:support:postgres
```

脚本说明：

- `npm run db:schema:check`：执行并检查 `db/schema.sql`，确认关键表存在，客服表有 `tenant_id`。
- `npm run db:support:seed`：写入本地假租户、假客户、假客服会话、假 AI 草稿。
- `npm run smoke:support:postgres`：按 `tenant_id` 查询沙箱客服数据，并检查没有真实邮箱域名。

注意：

- 只允许使用 `.test` 邮箱和 `SANDBOX` 订单号。
- 不要把真实 `DATABASE_URL`、客户消息、邮箱、手机号写进 Git。
- `next build` 不能依赖数据库是否启动；数据库连接必须懒加载。
- 默认客服 API 仍使用 Demo Repository。PostgreSQL 沙箱只是验证数据库能力，不切正式模式。

## Included modules

- Demo Mode / Live Mode shell.
- Integration intake for Shopify or independent store, Meta Ads, TikTok Ads, Instagram Graph, logistics, support systems, and CSV.
- Connector layer with rate limiting and circuit breaker.
- PostgreSQL schema for tenants, integrations, creators, creatives, ad metrics, orders, AI actions, GDPR requests, and audit logs.
- Redis/BullMQ queue endpoint and worker skeleton.
- Creator CRM, creative scoring, ads cockpit, order fulfillment, human approval center, and GDPR workflow.

## Production notes

- Money should remain stored as integer cents.
- Third-party API calls need rate limiting and circuit breakers.
- Secrets must be stored server-side only, encrypted at rest.
- Budget changes and outbound creator messages must remain human-confirmed.
- GDPR deletion should cover orders, support tickets, ad audiences, AI datasets, and audit records.
- Do not assume third-party API response formats. Probe read-only endpoints first, then map fields.
