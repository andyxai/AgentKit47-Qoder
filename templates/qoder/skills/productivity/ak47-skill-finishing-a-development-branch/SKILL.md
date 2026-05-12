---
name: ak47-skill-finishing-a-development-branch
version: 0.1.0
description: "当实施完成、所有测试通过，你需要决定如何集成工作时使用 - 通过为合并、PR或清理提供结构化选项来指导开发工作的完成"
---

# 完成开发分支

## 概述

通过提供清晰的选项并处理所选工作流，来指导开发工作的完成。

**核心原则：** 验证测试 → 展示选项 → 执行选择 → 清理。

**在开始时宣布：** “我正在使用 finishing-a-development-branch skill 来完成这项工作。”

## 流程

### 步骤 1：验证测试

**在展示选项之前，验证测试通过：**

```bash
# 运行项目的测试套件
npm test / cargo test / pytest / go test ./...
```

**如果测试失败：**
```
测试失败 (<N> 个)。在继续之前必须修复：

[显示失败信息]

在测试通过之前，无法继续合并或创建 PR。
```

停止。不要继续到步骤 2。

**如果测试通过：** 继续到步骤 2。

### 步骤 2：确定基础分支

```bash
# 尝试常见的基础分支
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

或者询问：“这个分支是从 main 分出来的 —— 对吗？”

### 步骤 3：展示选项

准确展示以下 4 个选项：

```
实施完成。你想做什么？

1. 本地合并回 <base-branch>
2. 推送并创建 Pull Request
3. 保持分支原样（我稍后处理）
4. 丢弃这项工作

哪个选项？
```

**不要添加解释** —— 保持选项简洁。

### 步骤 4：执行选择

#### 选项 1：本地合并

```bash
# 切换到基础分支
git checkout <base-branch>

# 拉取最新
git pull

# 合并功能分支
git merge <feature-branch>

# 验证合并结果的测试
<test command>

# 如果测试通过
git branch -d <feature-branch>
```

然后：清理 worktree（步骤 5）

#### 选项 2：推送并创建 PR

```bash
# 推送分支
git push -u origin <feature-branch>

# 创建 PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## 摘要
<2-3 个变更要点>

## 测试计划
- [ ] <验证步骤>
EOF
)"
```

然后：清理 worktree（步骤 5）

#### 选项 3：保持原样

报告："保持分支 <name>。Worktree 保留在 <path>。"

**不要清理 worktree。**

#### 选项 4：丢弃

**首先确认：**
```
这将永久删除：
- 分支 <name>
- 所有 commits: <commit-list>
- Worktree 位于 <path>

输入 'discard' 确认。
```

等待准确确认。

如果确认：
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

然后：清理 worktree（步骤 5）

### 步骤 5：清理 Worktree

**对于选项 1、2、4：**

检查是否在 worktree 中：
```bash
git worktree list | grep $(git branch --show-current)
```

如果是：
```bash
git worktree remove <worktree-path>
```

**对于选项 3：** 保持 worktree。

## 快速参考

| 选项 | 合并 | 推送 | 保持 Worktree | 清理分支 |
|--------|-------|------|---------------|----------------| 
| 1. 本地合并 | ✓ | - | - | ✓ |
| 2. 创建 PR | - | ✓ | ✓ | - |
| 3. 保持原样 | - | - | ✓ | - |
| 4. 丢弃 | - | - | - | ✓ (强制) |

## 常见错误

**跳过测试验证**
- **问题：** 合并损坏的代码，创建失败的 PR
- **修复：** 在提供选项之前始终验证测试

**开放式问题**
- **问题：** "我应该做什么？" → 模糊
- **修复：** 准确展示 4 个结构化选项

**自动清理 worktree**
- **问题：** 在可能需要时移除 worktree（选项 2、3）
- **修复：** 仅对选项 1 和 4 清理

**丢弃时未确认**
- **问题：** 意外删除工作
- **修复：** 需要输入 "discard" 确认

## 危险信号

**永远不要：**
- 在测试失败时继续
- 未验证测试结果就合并
- 未经确认删除工作
- 未经明确请求强制推送

**始终：**
- 在提供选项之前验证测试
- 准确展示 4 个选项
- 对选项 4 获取输入确认
- 仅对选项 1 和 4 清理 worktree

## 集成

**被调用：**
- **subagent-driven-development** (步骤 7) —— 所有任务完成后
- **executing-plans** (步骤 5) —— 所有批次完成后

**配对使用：**
- **using-git-worktrees** —— 清理由该 skill 创建的 worktree
