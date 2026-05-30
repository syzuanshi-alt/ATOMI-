---
type: github-issue-draft
status: draft
phase: v1
owner: A
start: 2026-06-03
due: 2026-06-05
tags: [github, issue, database]
---

# A-02 配置 Prisma（数据库工具）和 PostgreSQL（数据库）

## 背景

一期需要稳定的数据模型和迁移方式，避免后续订单、客服、AI 日报、飞书同步字段混乱。

## 负责人角色

A

## 开始日期

2026-06-03

## 截止日期

2026-06-05

## 前置依赖

A-01 项目骨架完成。

## 操作步骤

1. 建立 Prisma（数据库工具） 配置草案。
2. 准备 PostgreSQL（数据库） 连接方式和 `.env.example`。
3. 不提交真实数据库密码。
4. 对齐 `一期数据库模型.md`。
5. 写迁移和 初始化测试数据（seed） 的执行说明。

## 验收标准

- Prisma（数据库工具） 数据库结构文件（schema） 能表达一期核心实体方向。
- `.env.example` 字段完整但无真实密钥。
- 文档说明开发环境数据库如何准备。

## 测试方式

执行 Prisma（数据库工具） validate / migrate dev 或等价验证；失败原因写入 拉取请求（PR）。

## 是否需要 Claude 审核

是，重点检查数据库设计是否跑偏。

## 是否客户可见

否。

## GitHub 任务卡（Issue） 链接

[#2](https://github.com/syzuanshi-alt/ATOMI-/issues/2)
