---
type: project
status: active
phase: v1
owner: project-lead
tags: [github, repository, push]
---

# GitHub 仓库创建与推送

## 当前状态

- `D:\SHKF` 已初始化为本地 Git 仓库。
- 主分支：`main`。
- 首次提交：`chore: initialize ai ecommerce ops project`。
- 本地已包含 Obsidian 知识库、正式方案、PRD、推进表、Issue/PR 模板和 CODEOWNERS。

## 推荐创建仓库

在 GitHub 创建私有仓库：

- Repository name: `ai-ecommerce-ops-platform`
- Visibility: `Private`
- 不要勾选 README、.gitignore、license，因为本地已经有。

## 创建后推送

复制 GitHub 给出的 HTTPS 或 SSH 地址，然后在 PowerShell 执行：

```powershell
D:\SHKF\scripts\connect-github-remote.ps1 -RepositoryUrl "你的GitHub仓库URL"
```

示例：

```powershell
D:\SHKF\scripts\connect-github-remote.ps1 -RepositoryUrl "https://github.com/你的用户名/ai-ecommerce-ops-platform.git"
```

## 推送后必须设置

- 开启 branch protection：保护 `main`。
- 禁止直接 push 到 `main`。
- PR 至少 1 人 review。
- 数据库、权限、同步、AI、飞书、邮件相关 PR 建议 2 人 review。
- 创建 GitHub Project，并参考 `.github/project-fields.md` 配置字段。

## 注意

- 当前本地 Git 提交身份是仓库级配置：`SHKF Project <shkf-project@example.local>`。
- 推送前可以改成你的 GitHub 邮箱：

```powershell
git -C D:\SHKF config user.name "你的名字"
git -C D:\SHKF config user.email "你的GitHub邮箱"
```
