# AI 电商自动化平台 - Team Handoff

这是一套给 ATOMI SHINE 的 AI 增长系统交互 Demo + 生产化模板。

当前项目已切换为 AI 电商自动化平台改造方向。原腕表 Demo 继续作为演示基础，但后续优先建设统一客服工作台、AI 客服离线托管、数据接入状态、订单物流、达人 BD、素材投流、飞书/邮件协同。

## Claude Code / Codex 先读

每次执行前，必须按顺序读取：

1. `docs/AI电商自动化平台完整搭建执行计划.md`
2. `docs/第1周执行清单-AI客服托管原型.md`
3. `docs/Demo模式与真实模式边界.md`
4. `docs/AI客服消息中台与托管规则.md`

执行时必须遵守：

- 只在当前 Demo 工程内修改，除非任务明确要求同步 Obsidian。
- 不写入真实密钥。
- 不删除原 Demo。
- 不接个人微信自动化。
- 不自动发送真实客户消息。
- 高风险 AI 回复必须人工审核。

## 先看这个

1. 双击 `launch-app.cmd`，打开可交互 Demo。
2. 如果脚本被 Windows 拦截，直接用浏览器打开 `index.html`。
3. 按 `CHECKOUT.md` 的路径查收功能。

## 当前能演示什么

- Demo Mode / Live Mode 切换。
- 按岗位切换不同权限视图：老板、BD、投流、客服、管理员。
- 经营看板：GMV、ROAS、CPA、国家表现、AI 建议。
- 数据接入：Shopify/独立站、Meta Ads、TikTok Ads、Instagram、物流、客服、CSV。
- 达人 CRM：达人列表、AI 评分、建联动作。
- 达人详情：BD 动作流、视频产出、投流摘要、达人 ROI。
- 内容中心：短视频素材评分和投流池。
- 广告驾驶舱：素材、国家、花费、收入、毛利、CPA、ROAS。
- 订单履约：定制信息结构化、生产、物流、售后风险。
- AI 确认中心：预算、发信、素材暂停、客服动作都进入人工确认。
- GDPR：删除/匿名化工单概念。

## 文件结构

- `index.html` + `src/`：零依赖静态 Demo，可直接打开。
- `app/` + `components/` + `lib/`：Next.js + TypeScript 生产化模板。
- `db/schema.sql`：PostgreSQL 数据库表结构。
- `workers/provider-sync-worker.ts`：Redis/BullMQ 同步任务骨架。
- `sample-data/`：演示用 CSV。
- `docs/architecture.md`：系统架构、权限和多区域部署说明。
- `docs/production-roadmap.md`：生产落地路线。
- `CHECKOUT.md`：查收流程。

## 权限设计

前端 Demo 有岗位切换；生产模板已经有服务端权限骨架：

- `lib/permissions.ts`：岗位权限矩阵。
- `lib/auth.ts`：Demo 角色识别，读取 `x-demo-role` 或 `demo_role` cookie。
- `app/api/*/route.ts`：API 层权限校验。

当前规则：

- GM / 老板：经营看板、广告摘要、达人 ROI、订单摘要、AI 预算确认。
- BD：达人 CRM、达人详情、内容移交、达人消息确认。
- Media Buyer：内容中心、广告驾驶舱、预算建议、素材暂停。
- Support：订单履约、客服回复、GDPR 工单。
- Admin：平台接入、全局配置、审计、合规。

## 生产化运行方式

当前环境里 `npm install` 曾超时，所以交付包默认先用静态 Demo 查收。

如果本机网络可访问 npm：

```bash
npm install
npm run dev
```

然后打开：

```text
http://127.0.0.1:4173
```

如需本地 PostgreSQL / Redis：

```bash
docker compose up -d postgres redis
```

复制 `.env.example` 为 `.env.local` 后填入配置。

## 注意事项

- 当前达人账号、广告数据、订单数据都是 Demo 数据，不是真实 AS 业务数据。
- 不要把真实 API key、secret、token 放到前端。
- 金额字段统一用整数分，例如 `revenue_cents`。
- 预算调整、达人发信、客服回复必须人工确认。
- GDPR 删除/匿名化需要覆盖订单、客服、广告受众、AI 样本和审计日志。
- 第三方 API 接入前必须先做只读探测，不要假设返回结构。
