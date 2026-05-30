---
type: execution-manual
status: active
phase: v1
owner: project-lead
tags: [github, project, execution, board, weekly-review]
---

# GitHub Project看板配置手册

## 目的

GitHub Project 是本项目的每日执行主控。Obsidian 负责讲清楚大图和决策，GitHub Project 负责让每个任务有状态、负责人、截止日期、风险等级和审核节点。

当前环境说明：

- 已创建 GitHub 仓库：`syzuanshi-alt/ATOMI-`
- 已创建第 1-2 周 Issues：`#1` 到 `#10`
- 本机未安装 GitHub CLI `gh`，当前插件也没有 Project 字段创建能力，所以 Project 看板需要在 GitHub 网页端按本手册配置。

参考 GitHub 官方说明：

- GitHub Projects 可以用表格、看板、路线图等视图管理 Issue 和 PR。
- Project 可添加自定义字段，用于跟踪状态、负责人、日期、优先级、审核等元数据。
- Project 可通过新增视图来按状态、负责人、周次、风险筛选和分组。

官方文档链接：

- [GitHub Projects 总览](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [创建 Project](https://docs.github.com/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project)
- [添加 Issues 到 Project](https://docs.github.com/enterprise-cloud@latest/issues/planning-and-tracking-with-projects/managing-items-in-your-project/adding-items-to-your-project)
- [管理 Project 视图](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/managing-your-views)
- [切换表格/看板/路线图视图](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view)

## 看板名称

建议名称：

```text
AI电商自动化平台 V1 执行看板
```

描述：

```text
用于 AI 电商自动化平台 V1 试点开发，跟踪 A/B/C 三人分工、8-10 周节奏、节点审核、风险和交付状态。
```

## 必建字段

| 字段名 | 类型 | 选项/格式 | 用途 | 必填 |
|---|---|---|---|---|
| Status | Single select | 未开始、进行中、待审核、已完成、阻塞 | 每日执行状态 | 是 |
| Owner | Single select | A、B、C、项目负责人 | 当前责任角色 | 是 |
| Due Date | Date | 日期 | 截止日期 | 是 |
| Risk Level | Single select | 低、中、高 | 风险判断 | 是 |
| Review Gate | Single select | 无需审核、项目负责人审核、Claude辅助审核、客户可见审核 | 审核方式 | 是 |
| Phase | Single select | 第1周、第2周、第3周、第4周、第5周、第6周、第7周、第8周、第9周、第10周 | 所属周次 | 是 |
| Customer Visible | Single select | 是、否 | 是否可给客户看 | 是 |
| Blocker | Text | 自由填写 | 阻塞原因 | 否 |
| Evidence | Text | PR/截图/文档链接 | 验收证据 | 否 |

字段原则：

1. 不要一开始建太多字段，小白团队会维护不动。
2. `Owner` 先用 A/B/C，等真实 GitHub 账号确定后再用 Assignee。
3. `Due Date` 必须填，否则周五审核没有依据。
4. `Risk Level` 为高的任务，每周五必须单独过一遍。
5. `Evidence` 必须放验收证据：PR 链接、截图路径、Obsidian 页面、测试结果。

## 建 Project 步骤

### 第 1 步：进入 Project 创建入口

1. 打开 GitHub。
2. 进入你的账号或仓库所在页面。
3. 找到 `Projects`。
4. 点击 `New project`。
5. 选择 Table 或 Board 模板均可。建议先选 Table，因为字段配置最清楚。

### 第 2 步：命名和描述

1. 名称填：`AI电商自动化平台 V1 执行看板`。
2. 描述填本手册上面的描述。
3. 保存。

### 第 3 步：创建字段

按“必建字段”表逐个添加。

建议顺序：

1. `Status`
2. `Owner`
3. `Due Date`
4. `Risk Level`
5. `Review Gate`
6. `Phase`
7. `Customer Visible`
8. `Blocker`
9. `Evidence`

如果 GitHub 页面提示字段名称已存在，就直接复用，不要重复创建。

### 第 4 步：添加第 1-2 周 Issues

把以下 Issues 加入 Project：

| Issue | 标题 | Owner | Due Date | Phase | Risk Level | Review Gate | Customer Visible |
|---|---|---|---|---|---|---|---|
| [#1](https://github.com/syzuanshi-alt/ATOMI-/issues/1) | A-01 创建 Next.js 项目骨架 | A | 2026-06-03 | 第1周 | 中 | 项目负责人审核 | 否 |
| [#2](https://github.com/syzuanshi-alt/ATOMI-/issues/2) | A-02 配置 Prisma 和 PostgreSQL | A | 2026-06-05 | 第1周 | 高 | Claude辅助审核 | 否 |
| [#3](https://github.com/syzuanshi-alt/ATOMI-/issues/3) | A-03 建 tenants/users/roles 基础模型 | A | 2026-06-10 | 第2周 | 高 | Claude辅助审核 | 否 |
| [#4](https://github.com/syzuanshi-alt/ATOMI-/issues/4) | A-04 写租户隔离测试 | A | 2026-06-12 | 第2周 | 高 | Claude辅助审核 | 否 |
| [#5](https://github.com/syzuanshi-alt/ATOMI-/issues/5) | B-01 绘制平台总控页面结构 | B | 2026-06-03 | 第1周 | 中 | 项目负责人审核 | 是 |
| [#6](https://github.com/syzuanshi-alt/ATOMI-/issues/6) | B-02 客户后台信息架构 | B | 2026-06-05 | 第1周 | 中 | 项目负责人审核 | 是 |
| [#7](https://github.com/syzuanshi-alt/ATOMI-/issues/7) | B-03 手机端轻工作台结构 | B | 2026-06-12 | 第2周 | 中 | 项目负责人审核 | 是 |
| [#8](https://github.com/syzuanshi-alt/ATOMI-/issues/8) | C-01 配置飞书测试应用信息清单 | C | 2026-06-03 | 第1周 | 高 | Claude辅助审核 | 否 |
| [#9](https://github.com/syzuanshi-alt/ATOMI-/issues/9) | C-02 接口准备清单 | C | 2026-06-05 | 第1周 | 高 | Claude辅助审核 | 否 |
| [#10](https://github.com/syzuanshi-alt/ATOMI-/issues/10) | C-03 AI 日报字段和测试清单 | C | 2026-06-12 | 第2周 | 高 | Claude辅助审核 | 是 |

添加方法：

1. 在 Project 表格底部点击 `Add item`。
2. 搜索 `repo:syzuanshi-alt/ATOMI- #1` 或直接粘贴 Issue 链接。
3. 添加后补齐字段。
4. 重复到 `#10`。

## 必建视图

### 视图 1：执行总览

用途：每天看所有任务。

配置：

- Layout：Table
- Sort：Due Date 升序
- Group：Status
- 显示字段：Title、Status、Owner、Due Date、Risk Level、Review Gate、Phase、Evidence

### 视图 2：本周任务

用途：周一到周五推进。

配置：

- Layout：Table
- Filter：`Phase` = 当前周
- Sort：Owner + Due Date
- 显示字段：Title、Status、Owner、Due Date、Blocker、Evidence

第 1 周过滤：

```text
Phase: 第1周
```

### 视图 3：按负责人看板

用途：看 A/B/C 谁卡住。

配置：

- Layout：Board
- Column field：Owner
- 显示字段：Status、Due Date、Risk Level

### 视图 4：风险审核

用途：每周五重点检查高风险任务。

配置：

- Layout：Table
- Filter：Risk Level = 高
- Sort：Due Date 升序
- 显示字段：Title、Owner、Status、Review Gate、Blocker、Evidence

### 视图 5：客户可见交付

用途：准备对外演示或阶段汇报。

配置：

- Layout：Table
- Filter：Customer Visible = 是
- 显示字段：Title、Owner、Status、Due Date、Evidence

## 第 1 周默认状态

创建完成后，先按下面设置：

| Issue | Status | 操作 |
|---|---|---|
| #1 | 进行中 | A 号先做 |
| #5 | 进行中 | B 号先做 |
| #8 | 进行中 | C 号先做 |
| #2 | 未开始 | 等 #1 基础结构确认 |
| #6 | 未开始 | 等 #5 总控结构确认 |
| #9 | 未开始 | 等 #8 飞书权限清单确认 |
| #3 | 未开始 | 第 2 周开始 |
| #4 | 未开始 | 第 2 周开始 |
| #7 | 未开始 | 第 2 周开始 |
| #10 | 未开始 | 第 2 周开始 |

## 每日更新规则

每天下班前，每个人必须更新自己的 Issue：

1. `Status`：是否进行中、待审核、阻塞。
2. `Blocker`：卡在哪里，不要只写“有问题”。
3. `Evidence`：有产出就放链接。
4. Issue 评论：当天做了什么、明天做什么。

示例评论：

```markdown
今日进展：
- 已完成后台总控页面结构草案。
- 已标记订单、客服、AI、同步异常四类数据来源。

明日计划：
- 和 A 对齐字段。
- 和 C 对齐飞书/AI 日报入口。

阻塞：
- 等 A 确认订单和同步异常字段。
```

## 周五节点审核流程

周五下午按这个顺序：

1. 打开 `风险审核` 视图。
2. 先看所有 `Risk Level = 高` 的任务。
3. 再看 `Status = 阻塞` 的任务。
4. 每个 Owner 用 3 分钟汇报：
   - 本周完成什么。
   - 哪个 Issue 没完成。
   - 有没有跑偏。
   - 有没有安全/权限/接口/AI 风险。
   - 下周需要什么支持。
5. Claude/Codex 辅助审核。
6. 结论写入 [[节点审核记录]]。
7. 调整下周 Issues。

## 不允许的用法

1. 不允许只在微信群/聊天里说完成，GitHub Issue 必须更新。
2. 不允许 Issue 没有验收证据就标记已完成。
3. 不允许把 Obsidian 当任务状态主控。
4. 不允许把客户敏感信息写入公开截图或 Issue。
5. 不允许 AI 审核结论不落文档。

## 完成标准

看板搭建完成后，应满足：

- 能看到 `#1` 到 `#10`。
- 每个 Issue 都有 Owner、Due Date、Risk Level、Review Gate、Phase。
- 有 5 个视图：执行总览、本周任务、按负责人看板、风险审核、客户可见交付。
- 第 1 周的 `#1`、`#5`、`#8` 已设为进行中。
- 本手册链接已放入 Obsidian 首页和周计划。
## GitHub 跟踪 Issue

- [#11 PM-01 建立 GitHub Project V1 执行看板](https://github.com/syzuanshi-alt/ATOMI-/issues/11)

