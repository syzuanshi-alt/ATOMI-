---
type: github-issue-draft
status: draft
phase: v1
owner: A
start: 2026-06-01
due: 2026-06-03
tags: [github, issue, foundation]
---

# A-01 创建 Next.js 项目骨架

## 背景

项目需要先建立可多人协作的工程骨架，后续数据库、后台、手机端、AI 集成都依赖这个基础结构。

## 负责人角色

A

## 开始日期

2026-06-01

## 截止日期

2026-06-03

## 前置依赖

GitHub 仓库已初始化；Obsidian 知识库已建立。

## 操作步骤

1. 阅读 `完整工作计划.md` 和 `总体架构.md`。
2. 确认技术栈建议：Next.js、TypeScript、PostgreSQL、Prisma。
3. 建议建立 `apps/web`、`packages/db`、`packages/shared`、`docs` 结构。
4. 写 README 本地启动说明。
5. 提交 PR，说明目录设计。

## 验收标准

- 新成员能看懂目录用途。
- README 能说明如何启动。
- 没有真实密钥提交。

## 测试方式

本地执行安装/启动命令；截图或复制命令输出到 PR。

## 是否需要 Claude 审核

否，项目负责人审核即可。

## 是否客户可见

否。

## GitHub Issue 链接

[#1](https://github.com/syzuanshi-alt/ATOMI-/issues/1)

