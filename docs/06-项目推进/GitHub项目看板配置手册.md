---
type: execution-manual
status: active
phase: v1
owner: project-lead
tags: [github, project, execution, board, weekly-review, beginner]
---

# GitHub项目看板配置手册

## 先说清楚

GitHub 项目看板（Project）是每日执行主控。Obsidian 负责保存完整计划和决策，GitHub 负责跟踪每一张任务卡（Issue）有没有做完。

当前情况：

- GitHub 仓库：`syzuanshi-alt/ATOMI-`
- 已创建第 1-2 周任务卡：`#1` 到 `#10`
- 已创建看板配置跟踪任务：[#11](https://github.com/syzuanshi-alt/ATOMI-/issues/11)
- 本机没有 GitHub 命令行工具（GitHub CLI，简称 `gh`），所以看板需要你在 GitHub 网页端手动创建。

## 英文按钮对照

GitHub 页面有些按钮可能是英文，按下面理解：

| 英文按钮/字段 | 中文意思 |
|---|---|
| Projects | 项目看板 |
| New project | 新建项目看板 |
| Add item | 添加任务 |
| Table | 表格视图 |
| Board | 看板视图 |
| Roadmap | 路线图视图 |
| Field | 字段 |
| Single select | 单选 |
| Date | 日期 |
| Text | 文本 |
| Filter | 筛选 |
| Sort | 排序 |
| Group | 分组 |
| Layout | 布局 |

## 看板名称

```text
AI电商自动化平台 V1 执行看板
```

## 建议创建的字段

能用中文字段就用中文字段。括号里的英文是 GitHub 可能显示的英文或团队沟通时的对应词。

| 中文字段名 | 对应英文 | 类型 | 选项 | 用途 |
|---|---|---|---|---|
| 状态 | Status | 单选 | 未开始、进行中、待审核、已完成、阻塞 | 看任务现在到哪一步 |
| 负责人 | Owner | 单选 | A、B、C、项目负责人 | 看谁负责 |
| 截止日期 | Due Date | 日期 | 具体日期 | 看最晚哪天完成 |
| 风险等级 | Risk Level | 单选 | 低、中、高 | 看是否需要重点盯 |
| 审核关卡 | Review Gate | 单选 | 无需审核、项目负责人审核、Claude/Codex辅助审核、客户可见审核 | 看谁审核 |
| 周次 | Phase | 单选 | 第1周到第10周 | 看属于哪周 |
| 客户可见 | Customer Visible | 单选 | 是、否 | 看能不能给客户展示 |
| 阻塞原因 | Blocker | 文本 | 自由填写 | 卡住时写原因 |
| 验收证据 | Evidence | 文本 | 链接或说明 | 放 PR、截图、测试结果、文档链接 |

## 手动创建步骤

### 第 1 步：进入 GitHub

1. 打开浏览器。
2. 进入仓库：`https://github.com/syzuanshi-alt/ATOMI-`
3. 找到页面上的 `Projects（项目看板）`。
4. 点击 `New project（新建项目看板）`。
5. 选择 `Table（表格）`。小白先用表格最清楚。

### 第 2 步：填写名称

1. 名称填：`AI电商自动化平台 V1 执行看板`
2. 描述填：`用于跟踪 A/B/C 三人分工、每周节点、风险和交付状态。`
3. 保存。

### 第 3 步：添加字段

按顺序添加：

1. 状态（Status）
2. 负责人（Owner）
3. 截止日期（Due Date）
4. 风险等级（Risk Level）
5. 审核关卡（Review Gate）
6. 周次（Phase）
7. 客户可见（Customer Visible）
8. 阻塞原因（Blocker）
9. 验收证据（Evidence）

如果 GitHub 已经有默认的 `Status（状态）` 字段，可以直接用，不用重复建。

### 第 4 步：把任务卡加入看板

在看板底部点击 `Add item（添加任务）`，逐个粘贴下面链接：

| 任务卡 | 负责人 | 截止日期 | 周次 | 风险等级 | 审核关卡 | 客户可见 |
|---|---|---|---|---|---|---|
| [#1 A-01 创建 Next.js（网页应用框架）项目骨架](https://github.com/syzuanshi-alt/ATOMI-/issues/1) | A | 2026-06-03 | 第1周 | 中 | 项目负责人审核 | 否 |
| [#2 A-02 配置 Prisma（数据库工具）和 PostgreSQL（数据库）](https://github.com/syzuanshi-alt/ATOMI-/issues/2) | A | 2026-06-05 | 第1周 | 高 | Claude/Codex辅助审核 | 否 |
| [#3 A-03 建租户/用户/角色基础模型](https://github.com/syzuanshi-alt/ATOMI-/issues/3) | A | 2026-06-10 | 第2周 | 高 | Claude/Codex辅助审核 | 否 |
| [#4 A-04 写租户隔离测试](https://github.com/syzuanshi-alt/ATOMI-/issues/4) | A | 2026-06-12 | 第2周 | 高 | Claude/Codex辅助审核 | 否 |
| [#5 B-01 绘制平台总控页面结构](https://github.com/syzuanshi-alt/ATOMI-/issues/5) | B | 2026-06-03 | 第1周 | 中 | 项目负责人审核 | 是 |
| [#6 B-02 客户后台信息架构](https://github.com/syzuanshi-alt/ATOMI-/issues/6) | B | 2026-06-05 | 第1周 | 中 | 项目负责人审核 | 是 |
| [#7 B-03 手机端轻工作台结构](https://github.com/syzuanshi-alt/ATOMI-/issues/7) | B | 2026-06-12 | 第2周 | 中 | 项目负责人审核 | 是 |
| [#8 C-01 配置飞书测试应用信息清单](https://github.com/syzuanshi-alt/ATOMI-/issues/8) | C | 2026-06-03 | 第1周 | 高 | Claude/Codex辅助审核 | 否 |
| [#9 C-02 接口准备清单](https://github.com/syzuanshi-alt/ATOMI-/issues/9) | C | 2026-06-05 | 第1周 | 高 | Claude/Codex辅助审核 | 否 |
| [#10 C-03 AI 日报字段和测试清单](https://github.com/syzuanshi-alt/ATOMI-/issues/10) | C | 2026-06-12 | 第2周 | 高 | Claude/Codex辅助审核 | 是 |

### 第 5 步：设置第 1 周状态

| 任务卡 | 状态 |
|---|---|
| #1 | 进行中 |
| #5 | 进行中 |
| #8 | 进行中 |
| #2、#6、#9 | 未开始 |
| #3、#4、#7、#10 | 未开始 |

## 必建 5 个视图

### 视图 1：执行总览

- 布局（Layout）：表格（Table）
- 分组（Group）：状态（Status）
- 排序（Sort）：截止日期从近到远
- 显示字段：标题、状态、负责人、截止日期、风险等级、审核关卡、周次、验收证据

### 视图 2：本周任务

- 布局：表格
- 筛选（Filter）：周次 = 第1周
- 排序：负责人 + 截止日期
- 用途：每天早上看今天该做什么

### 视图 3：按负责人看板

- 布局：看板（Board）
- 列字段（Column field）：负责人
- 用途：看 A/B/C 谁任务多、谁卡住

### 视图 4：风险审核

- 布局：表格
- 筛选：风险等级 = 高
- 用途：周五优先看高风险任务

### 视图 5：客户可见交付

- 布局：表格
- 筛选：客户可见 = 是
- 用途：准备客户演示和阶段汇报

## 完成后必须做

1. 打开 [#11](https://github.com/syzuanshi-alt/ATOMI-/issues/11)。
2. 在评论区贴上项目看板链接。
3. 截图保存到项目资料里，或写明“已完成字段和视图配置”。
4. 把 #11 状态改为“待审核”。

## 官方文档

- [GitHub Projects 总览](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [创建 Project](https://docs.github.com/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project)
- [添加 Issues 到 Project](https://docs.github.com/enterprise-cloud@latest/issues/planning-and-tracking-with-projects/managing-items-in-your-project/adding-items-to-your-project)
