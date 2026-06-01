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
