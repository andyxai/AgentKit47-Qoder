# OpenSpec 工作流状态管理规则

> **注入方式**: Qoder 平台自动注入 `.qoder/rules/*.md`。
> **触发**: 当项目存在 `openspec/changes/` 目录或用户发起 `/status`、`/next-step`、`/unblock` 等命令时生效。

---

## 状态三层模型

- **Artifact 状态**: `not-started` / `drafting` / `completed` / `needs-revision`
- **Change 状态**: `proposing` / `specing` / `designing` / `tasking` / `implementing` / `testing` / `reviewing` / `ready-to-archive` / `archived`
- **Project 状态**: `idle` / `planning` / `developing` / `reviewing` / `completed`

状态**永远基于最新文件内容实时推断**（`always-refresh`），不依赖缓存。

---

## 状态查询规则

**触发条件**: 用户输入 `/status`、`/next-step` 或会话开始。

**执行步骤**:
1. 扫描 `openspec/changes/` 目录，列出所有 Change
2. 对每个 Change 分析 Artifact 完成度：
   - `proposal.md`：是否包含 `## Intent` 和 `## Scope`
   - `specs/*/spec.md`：是否包含 `## Requirements` 和 `Scenario:`
   - `design.md`：是否包含 `## Architecture`
   - `tasks.md`：`- [x]` 占比
3. 推断三层状态并输出

**输出格式**:
```
📊 项目状态概览

Project: {projectState}（{activeChanges} 个 Change 活跃）

Change 状态:
  {changeDetails}

💡 建议操作:
  {suggestedActions}
```

---

## 状态回退规则

**触发条件**: 用户表示"架构调整"、"需求变更"、"重新设计"、"方案不对"、"需要回退"。

**执行步骤**:
1. 识别需回退的层级：
   - 技术设计问题 → 回退到 `designing`
   - 需求规范问题 → 回退到 `specing`
   - 方向错误 → 回退到 `proposing` 或创建新 Change
2. 提示用户影响的下游 Artifact：
   - `designing` → 影响 tasks.md
   - `specing` → 影响 design.md 和 tasks.md
   - `proposing` → 影响所有下游 Artifact
3. 建议更新顺序：回退层 → 依赖层
4. 提供命令建议：
   - 更新 design：`/opsx:continue <change> design`
   - 更新 specs：`/opsx:continue <change> specs`
   - 更新 proposal：`/opsx:continue <change> proposal`

**禁止行为**:
- ❌ silently 回退而不告知用户影响
- ❌ 跳过下游 Artifact 更新
- ❌ 在重大方向调整时建议修改原 Change（应创建新 Change）

---

## 冲突避免（依赖 Git）

**核心原则**:
1. 状态永远基于最新文件内容
2. 使用 Git 的分支/merge 机制解决冲突
3. 不自己实现锁（Git 已提供完整方案）

**禁止行为**:
- ❌ 在 master/main 分支直接编辑 Change（应用 `feat/` 分支）
- ❌ 跳过 Git 提交（频繁提交保持历史清晰）
- ❌ 手动修改 `workflow-state.yaml` 的状态字段
- ❌ 自己实现锁机制

**最佳实践**:
- ✅ 每个 Change 一个 Git 分支
- ✅ 完成一个阶段就提交
- ✅ 冲突时用 Git 标准流程解决
- ✅ 归档时合并到 main 分支

---

## 多 Change 并行规则

**触发条件**: `openspec/changes/` 下有 > 1 个目录。

**执行步骤**:
1. 列出所有活跃 Change 及状态
2. 标识优先级：
   - 最接近完成（implementing 且 task 完成率高）
   - 阻塞中（超过 2 天未更新）
   - 刚开始（proposing/specing）
3. 聚焦策略：优先推进最接近完成的 Change，避免频繁切换
4. 检测资源冲突：多 Change 是否修改同一文件

**输出格式**:
```
📊 当前有 {count} 个 Change 并行开发：

  ✅ change-A    implementing  (进度: 6/8 tasks)
  🔄 change-B    specing       (等待需求明确)
  ⏳ change-C    proposing     (等待评审)

建议策略：
  1. 优先推进 change-A（最接近完成）
  2. change-B 需求明确后继续
  3. change-C 等待评审反馈
```

---

## 阻塞检测规则

**触发条件**: 会话开始或状态查询时。

**执行步骤**:
1. 检查每个 `implementing` 状态的 Change：
   - 最后活动时间（文件 mtime）
   - 任务完成进度（`tasks.md` 中 `- [x]` 占比）
2. 若超过 2 天未更新且完成率 < 50%：
   - 主动提示阻塞状态
   - 询问是否遇到问题
   - 提供 `/unblock` 命令建议

---

## 关键节点主动推送

| 场景 | 触发条件 |
|------|----------|
| 会话开始 | 读取工作流状态，摘要当前进展 |
| Change 状态变化 | 检测到 Artifact 更新，提示下一步 |
| 任务完成 | 标记 task `[x]` 后，提示下一个 task |
| tasks.md 完成 | tasks 全部完成，且变更规模超过阈值时，提示生成 Agent Brief |
| 阻塞检测 | 超过 2 天未活动，主动提醒 |

**推送格式**:
```
💡 下一步建议：
  当前：{currentState}
  建议：{nextAction}
  命令：{command}
```

---

## Brief 集成

**Agent Brief** 是复杂变更在 tasks 完成后、critical-review 开始前必须生成的中间产物（参见 `gate-control.md` G6.5）。它确保实施阶段不遗漏关键需求信息。

### 触发条件

tasks.md 全部完成后，评估以下指标（任一即触发）：
- 工作量 > 2 小时
- 跨模块 ≥ 2 个
- 文件数 > 3 个
- 涉及 API/函数签名变更

### 决策流程

```
tasks.md 全部完成
  ↓
评估变更规模
  ↓
符合 Brief 条件？
  ├─ 是 → 调用 ak47-skill-triage-brief 生成 brief.md
  │         ↓
  │       Brief 生成 + 信息损失校验
  │         ↓
  │       用户确认
  │         ↓
  │       进入 critical-review（G7）
  │
  └─ 否 → 记录理由："变更规模较小，跳过 Brief"
            ↓
          询问用户："是否确认跳过？"
            ↓
          用户确认 → 进入 critical-review（G7）
```

### Brief 存储位置

`.ak47/briefs/<change-name>.md`

### 与 OpenSpec 工作流的关系

| 阶段 | OpenSpec 产物 | Brief 状态 |
|------|-------------|-----------|
| proposing | proposal.md | — |
| specing | specs/*.md | — |
| designing | design.md | — |
| tasking | tasks.md | — |
| **briefing** | **brief.md** | 生成（复杂变更） |
| reviewing | audit-report.md | 已确认（进入 G7） |
| implementing | 代码变更 | 作为实施参考 |

### 禁止行为

- ❌ 复杂变更跳过 Brief 直接进入 critical-review
- ❌ 跳过 Brief 不提示用户
- ❌ 跳过 Brief 不记录偏离

---

## 老项目接入策略

**触发条件**: 检测到项目有代码但 `openspec/specs/` 为空。

**三种策略（用户选择）**:

**策略 1: 增量接入（推荐）** — 新功能走完整 OpenSpec 流程，老功能暂不处理，逐步积累 Spec。

**策略 2: 基线快照** — 逆向工程为现有代码创建 Spec 基线（Change 名：`baseline-current-state`），后续变更基于基线。

**策略 3: 混合模式** — 已规范模块放 `openspec/specs/`，待规范模块放 `openspec/legacy/`，并创建 `legacy/migration-plan.md`。

**禁止行为**:
- ❌ 强制老项目一次性完整迁移
- ❌ 迁移期间停止新功能开发
- ❌ 忽略迁移进度追踪

---

## 已完成项目新周期规则

**触发条件**: Project 状态为 `completed`，用户表示要"调整功能/新功能/新需求"。

**执行步骤**:
1. 识别意图并建议 Change 命名：
   - 调整现有功能 → `adjust-<feature>`
   - 添加新功能 → `add-<feature>`
   - 重构代码 → `refactor-<scope>`
   - 大版本更新 → `v2.0-<description>`
2. 说明状态流转：`completed` → `planning` → `developing` → `completed`
3. 引导 `/opsx:propose <change-name>`

**重要**: `completed` 不是终态，而是"当前无活跃工作"的临时状态。项目可无限次从 `completed` 进入新周期。

**禁止行为**:
- ❌ 认为 `completed` 是终态
- ❌ 不创建 Change 直接修改代码
- ❌ 累积多个版本的任务不清零

---

## Spec 审查与人工确认门控

**规则定义**: 逐 artifact 门控点、确认格式、偏离处理 → `gate-control.md`

**本文件 (workflow-state.md) 的职责**: artifact 创建顺序和状态切换的追踪规则。人工确认断点统一由 `gate-control.md` 定义，避免重复。

**关键引用**:
- `gate-control.md` G3-G7: OpenSpec 阶段逐 artifact 门控
- `gate-control.md` G7: 批判性审核门控（proposal/design/specs/tasks 全部评审通过后执行）
- `gate-control.md` 偏离处理: 跳过门控的日志记录规范
