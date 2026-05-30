---
type: architecture
status: active
phase: v1
owner: owner-3
tags: [ai, audit]
---

# AI 输出审计

## 目标

所有 AI 建议必须能说明来源、输出内容和人工处理状态。

## `ai_outputs` 建议字段

- tenant_id
- type
- input_summary
- output
- model
- confidence
- approval_status
- approved_by
- approved_at
- created_at

## 审计规则

- 客服承诺、退款、售后、广告放量、营销邮件不得默认自动执行。
- AI 输出必须可人工确认、驳回或编辑。
- 所有 AI 输出都保留在数据库中，方便复盘和追责。
