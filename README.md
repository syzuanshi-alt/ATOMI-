# AI 电商自动化平台

面向电商客户的 AI 业务自动化与经营数据中台项目。

## 项目定位

本项目用于构建一套可商用交付的电商 AI 自动化系统，统一抖音、抖店、独立站、TikTok/TK、飞书、邮件、客服、订单和物流数据，支持电脑端后台、手机网页/可安装网页应用（H5/PWA）、飞书协同和 AI 日报。

## 协作方式

- GitHub：代码、任务卡（Issue）、拉取请求（PR）、节点审核、版本记录的主控中心。
- Obsidian：打开 `docs/` 作为知识库，记录业务逻辑、架构决策、接口清单、数据库模型、风险和节点审核。
- 飞书：业务团队协同出口，不替代 GitHub 和主数据库。
- AI 工具：辅助文档、审查、测试和拆分任务，不自动合并拉取请求（PR），不直接执行高风险动作。

## 目录

```text
docs/                       Obsidian 知识库
docs/superpowers/plans/     Superpowers 工程实施计划
output/documents/           正式方案和 PRD
output/spreadsheets/        项目推进、责任、接口、风险工作簿
.github/                    任务卡/拉取请求（Issue/PR）模板与代码负责人配置（CODEOWNERS）
```

## 当前交付物

- `docs/superpowers/plans/2026-05-30-ai-ecommerce-ops-platform.md`
- `output/documents/AI电商自动化平台_客户正式方案.docx`
- `output/documents/AI电商自动化平台_PRD_V1.docx`
- `output/spreadsheets/AI电商自动化平台_项目推进与责任表.xlsx`

## 一期目标

- 周期：2026-06-01 至 2026-08-07。
- 团队：3 人。
- 目标：交付可内部试点的 AI 电商自动化平台最小可用版本（MVP）。

## 本地开发启动

本项目使用 pnpm（包管理工具）管理多包工作区。

常见英文词说明：

- pnpm：包管理工具，用来安装和运行项目依赖。
- Next.js：网页应用框架，用来开发电脑端后台和手机端 H5/PWA。
- Prisma：数据库工具，用来管理数据库模型和生成数据库访问代码。
- TypeScript：带类型检查的 JavaScript，用来提前发现代码错误。

### 第一次安装

```powershell
cd D:\SHKF
pnpm install
```

### 启动电脑端后台

```powershell
cd D:\SHKF
pnpm dev
```

默认访问：

```text
http://localhost:3000
```

### 数据库骨架检查

第一次检查前，先生成数据库访问代码：

```powershell
cd D:\SHKF
pnpm db:generate
```

再检查数据库结构：

```powershell
cd D:\SHKF
pnpm db:validate
```

注意：真实数据库连接写到 `.env` 或 `.env.local`，不要提交到 GitHub。

### 一次性完整检查

提交代码前建议执行：

```powershell
cd D:\SHKF
pnpm verify
```

这条命令会依次完成：生成数据库访问代码、检查数据库结构、检查代码类型、构建网页应用。
