---
type: github-issue-draft
status: draft
phase: v1
owner: A
start: 2026-06-08
due: 2026-06-10
tags: [github, issue, permission]
---

# A-03 建 tenants/users/roles 基础模型

## 背景

平台最终要交付给多个客户，权限和租户隔离必须一开始就做清楚。

## 负责人角色

A

## 开始日期

2026-06-08

## 截止日期

2026-06-10

## 前置依赖

A-02 数据库配置完成。

## 操作步骤

1. 建立 tenants、users、roles、permissions、user_tenant_roles。
2. 定义平台总管理员、客户老板、运营、客服、只读观察者。
3. 写基础 seed 数据。
4. 更新权限模型文档。
5. 在 PR 中说明每个角色能做什么。

## 验收标准

- 同一用户可属于多个租户。
- 权限按租户隔离。
- 文档和 schema 一致。

## 测试方式

写基础模型测试或 seed 验证步骤；PR 附验证结果。

## 是否需要 Claude 审核

是，重点检查权限和租户设计。

## 是否客户可见

否。

## GitHub Issue 链接

[#3](https://github.com/syzuanshi-alt/ATOMI-/issues/3)

