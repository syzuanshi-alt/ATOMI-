---
type: architecture-plan
status: draft
phase: v1
owner: project-lead
created: 2026-06-03
tags: [auth, session, rbac, postgres, production-readiness]
---

# 真实登录 Session 与权限落地方案

## 1. 当前结论

一期推荐路线：

```text
Auth.js + PostgreSQL RBAC
```

中文解释：

- Auth.js：开源登录框架，适合 Next.js 后台项目。
- PostgreSQL RBAC：用数据库里的租户、成员、角色、权限表判断用户能做什么。
- Session：登录会话，用来证明“当前请求是谁发起的”。
- RBAC：角色权限控制，用角色和权限决定用户能访问哪些功能。

当前不直接安装登录依赖，不直接接真实登录供应商。先把方案、边界、数据库权限读取和验收标准锁住。

## 2. 为什么推荐 Auth.js

项目当前已经具备：

- `tenant_members`：租户成员表。
- `roles`：角色表。
- `permissions`：权限表。
- `role_permissions`：角色权限表。
- `audit_logs`：审计日志表。
- `GET /api/permissions/rbac-readiness`：PostgreSQL RBAC 准备状态接口。

Auth.js 适合当前项目的原因：

- 更容易把登录 Session 接到现有 PostgreSQL 权限表。
- 不强绑定第三方用户管理后台，后续客户交付和私有化空间更大。
- 适合先做后台 SaaS 的服务端权限校验。
- 成本可控，长期维护自由度更高。

不足：

- 登录页面、邮箱登录、账号邀请、密码策略等需要自己设计。
- 小白团队需要严格按文档和烟测推进，不能随便改认证逻辑。

## 3. Clerk 是否适合

Clerk 可以作为快速试点备选。

适合场景：

- 想快速看到真实登录页面。
- 需要现成用户管理、组织管理、登录组件。
- 前期更看重速度，不急于私有化。

风险：

- 用户身份和组织能力会绑定 Clerk。
- 后续客户私有化、本地化部署、费用、国内访问稳定性要提前确认。
- 不能让 Clerk 的组织角色直接绕过本项目自己的 PostgreSQL 权限表。

如果以后试接 Clerk，建议单独开分支，不直接替换当前权限系统。

## 4. 自建登录为什么暂不推荐

自建登录不是不能做，但一期不适合小白团队。

原因：

- 密码加密、Session 轮换、Cookie 安全、登录风控都容易出错。
- 一旦接客户真实数据，登录漏洞就是高风险漏洞。
- 当前项目更重要的是业务闭环、权限边界、AI 审批和数据同步，不应该先消耗大量时间造登录轮子。

## 5. 一期最小落地顺序

第 1 步：保持 Demo 模式

- `x-demo-role` 继续只用于本地演示。
- 页面和接口必须继续提示这不是真实登录。

第 2 步：做 Session 适配层

- 新增统一读取真实 Session 的函数。
- 没有真实 Session 时继续走 Demo 上下文。
- 不让业务 API 自己读取 Cookie 或请求头。
- 当前已新增 `GET /api/auth/session-adapter-readiness`，用于检查适配层状态。
- 当前已新增 `GET /api/auth/session-context-readiness`，用于检查真实 Session 如何映射到统一请求上下文。

第 3 步：接 PostgreSQL RBAC

- 根据真实用户 ID 和租户 ID 查询 `tenant_members`。
- 根据角色查询 `role_permissions`。
- 把权限结果映射成当前 `Permission` 类型。

第 4 步：业务 API 切换权限来源

- 当前 Demo 静态权限继续保留为回退。
- 真实模式必须使用数据库权限。
- 管理员、客服、BD、投手、老板权限必须通过烟测。

第 5 步：再决定是否安装 Auth.js

- 如果项目负责人确认使用 Auth.js，再安装依赖。
- 安装前必须新建分支。
- 安装后必须补登录、登出、Session、权限、审计烟测。

## 6. 一期暂时不做

- 不接真实客户账号。
- 不开放客户自助注册。
- 不做复杂 SSO。
- 不做多登录供应商同时接入。
- 不把 Clerk/Auth.js 直接接到生产。
- 不让前端自报角色。
- 不让 `x-demo-role` 进入真实模式。

## 7. 验收标准

必须通过：

```text
npm run smoke:auth-readiness
npm run smoke:permissions
npm run smoke:rbac
npm run smoke:rbac:postgres
npm run smoke:session-adapter
npm run smoke:session-context
npm run smoke:credentials
npm run smoke:support
npm run smoke:integrations
npm run typecheck
npm run lint
npm run build
node scripts/verify-template.mjs
git diff --check
```

验收结论必须满足：

- 能说明当前仍是 Demo 登录。
- 能说明真实登录推荐方案。
- 能从 PostgreSQL 沙箱读取 RBAC 状态。
- 能从 Session 适配层接口看到当前仍是 Demo provider，真实 Session 未启用。
- 能从真实 Session 上下文接口看到未来必须提供 `userId / tenantId / role / permissions`。
- 客服不能读取 RBAC 管理自检。
- 数据库 RBAC 和 Demo 静态权限矩阵一致。
- 错误租户不能读取成员权限。
- 不返回真实用户邮箱、密钥、客户资料。

## 8. 下一步建议

下一步不要直接安装 Auth.js。

更稳的下一步是：

```text
新增 Session 适配层草案
```

目标：

- 业务 API 只依赖统一上下文。
- Demo 模式和真实模式切换点清楚。
- 真实登录供应商后续可以替换，不影响客服、订单、数据接入等业务模块。
