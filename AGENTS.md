# AGENTS.md - 项目 AI 行为指令

> 本文档定义 AI 必须遵循的行为规则。
> 
> **位置**: 项目根目录
> **作用**: 告诉 AI 如何使用项目的 Agent 和 Skill 体系
> **优先级**: 用户指令 > AGENTS.md > 默认行为

---

## 📌 快速索引

### 核心规则(每次必遵守)
- 💬 反馈行为准则 → 第 124 行
- 🔴 1% 规则 → 第 593 行
- 🚦 Hook 警告必须响应 → 第 720 行
- 🚫 禁止跳过 TDD → 第 736 行
- 🚫 禁止臆想 API → 第 706 行
- 🚫 禁止过度设计 → 第 722 行
- 🚫 禁止表面修复 → 第 741 行

### 场景化规则(按需查阅)
| 场景 | 章节 | 行号 |
|------|------|------|
| Git 分支操作 | Git 工作流规则 | 223-313 |
| OpenSpec 状态管理 | 工作流状态管理 | 317-598 |
| Agent 分工决策 | Agent 分工原则 | 88-122 |
| 知识沉淀 | 知识沉淀规则 | 611-666 |
| 记忆管理 | 记忆管理规则 | 669-691 |

---

## 🎯 项目概述

**AI 平台**: Qoder

---

## 👥 可用 Agent

- **ak47-agent-architect** (`ak47-agent-architect`)
  ak47 系统架构师,负责 Spec 拆分、依赖排序、技术路径设计与架构评审

- **ak47-agent-config-maintainer** (`ak47-agent-config-maintainer`)
  ak47 配置维护者,负责 .ak47 目录结构治理、配置一致性与版本管理

- **ak47-agent-developer** (`ak47-agent-developer`)
  ak47 开发者,负责 Spec Task 实现、代码编写与单元测试

- **ak47-agent-knowledge-engineer** (`ak47-agent-knowledge-engineer`)
  ak47 知识工程师,负责经验沉淀、ADR 维护、知识冲突裁决与 FAQ 管理

- **ak47-agent-po** (`ak47-agent-po`)
  ak47 产品负责人,负责需求澄清、验收标准定义、优先级排序与需求评审

- **ak47-agent-process-guardian** (`ak47-agent-process-guardian`)
  ak47 流程守护者,负责范式执行、规则遵守、偏离记录与流程审计

- **ak47-agent-reviewer** (`ak47-agent-reviewer`)
  ak47 审查专家,负责代码审查、质量评估、反模式检测与改进建议

- **ak47-agent-scaffold-maintainer** (`ak47-agent-scaffold-maintainer`)
  ak47 脚手架资产维护者,负责 ak47 生成资产的通用性审计、导出/导入验证与权限治理

---

## 🛠️ 可用 Skill

### ak47 核心 Skills

- **ak47-skill-entry-guard** - 入口判定:判断用户请求属于答疑/轻量修改/重量修改
- **ak47-skill-change-classification** - 变更分类:判定重量修改进入 L1/L2/L3 哪个范式
- **ak47-skill-requirements-definition** - 需求定义:创造性工作前的深度需求盘问
- **ak47-skill-architecture-design** - 架构设计:需求批准后的技术方案设计
- **ak47-skill-critical-review** - 批判性审核:文档存档前的独立审查
- **ak47-skill-experience-summarization** - 经验总结:从实践中识别、提炼、归档可复用经验
- **ak47-skill-knowledge-retrieval** - 知识检索:系统化检索 `.ak47/experiences/` 中的知识资产
- **ak47-skill-knowledge-research** - 知识调研:系统化执行外部技术调研与信息评估
- **ak47-skill-harness-design** - 架构设计:七层架构方法论,指导系统分层设计与层间依赖分析
- **ak47-skill-anti-patterns** - 反模式检查:覆盖设计、实现、流程三类反模式速查表
- **ak47-skill-triage-brief** - 任务简报:生成结构化的 Agent 任务说明
- **ak47-skill-domain-modeling** - 领域建模:复杂业务领域的模型设计
- **ak47-skill-vertical-slicing** - 垂直切片:将功能拆分为可独立交付的垂直切片
- **ak47-skill-improve-architecture** - 架构改进:现有架构的优化与重构
- **ak47-skill-code-review** - 代码审查:代码质量评估与改进建议
- **ak47-skill-terminology-management** - 术语管理:专业术语的统一翻译与管理
- **ak47-skill-prototype** - 原型设计:快速原型验证
- **ak47-skill-zoom-out** - 全局视角:跳出细节看整体架构
- **ak47-skill-improvement-proposal** - 改进提案:深度诊断 AK47 行为问题，产出结构化改进建议，区分普适性缺陷与项目特有问题
- **ak47-skill-improvement-audit** - 改进审核:审核改进提案，交叉判断 AK47 设计原则与用户项目诉求的合理性

### ak47 改造的 Superpowers Skills

以下 Skills 基于 mattpocock-skills 改造,已更名为 ak47-*:

- **ak47-skill-test-driven-development** - TDD:融合垂直切片+行为测试+用户确认循环
- **ak47-skill-systematic-debugging** - 系统调试:6 阶段调试循环 (v0.3.0)
- **ak47-skill-writing-plans** - 编写计划:融入 triage-brief 流程
- **ak47-skill-executing-plans** - 执行计划:流程集成 (TODO→IN_PROGRESS→DONE)
- **ak47-skill-writing-skills** - 编写Skill:创建/编辑 Skill 文档

### ✅ Superpowers 完全融合

所有 Superpowers Skills 已完全融合到 ak47 体系,无保留原版。

> **注意**: 
> - TDD 已升级为 `ak47-skill-test-driven-development` (融合 mattpocock 垂直切片理念)
> - Code Review 已使用 `ak47-skill-code-review` 替代 Superpowers 原版。
> - Git 工作流已升级为 `ak47-skill-using-git-worktrees` 和 `ak47-skill-finishing-a-development-branch`
> 
> **完整列表**: 通过调用 `ak47-using-skills` 了解完整的 27 个 Skills 体系和使用方法。

---

## 🚀 Superpowers 使用规则

### 会话启动时

**无论任务类型，会话开始后第一次响应前必须执行**：

1. 调用 `ak47-using-skills` Skill - 了解完整的 27 个 Skills 体系和使用方法
2. 遵循 1% 规则 - 有任何可能适用某个 Skill 时都必须调用

> **重要**: 此要求通过 SessionStart Hook 自动触发，但即使 Hook 未触发，你也必须主动执行。

### 强制规则

**1% 规则**：如果有 1% 可能某个 Skill 适用，你必须调用它。

**清单规则**：如果 Skill 有 checklist，必须创建 TodoWrite 任务。

**执行规则**：调用 Skill 后，必须按 Skill 指示执行。

**禁止跳过**：
- ❌ "这个场景不太需要 TDD，我直接写代码吧"
- ❌ "错误很明显，不需要系统调试"
- ❌ "功能简单，不用头脑风暴"

---

## 👥 Agent 分工原则

> **核心原则**: Agent 分工应基于"上下文连续性 vs 独立判断"的权衡,而非教条的职责分工。

**决策矩阵**:

| 场景特征 | 推荐方案 | 原因 |
|---------|---------|------|
| 需要上下文连续性 | 主Agent + Skill | 主Agent 拥有完整对话历史 |
| 需要独立判断力 | 子Agent + Skill | 子Agent 无历史包袱 |
| 可以并发执行 | 多个子Agent + Skill | 子Agent 可并行运行 |

**主Agent 负责的场景**:
- 产品需求讨论与编写(需要对话历史)
- 代码设计与编写(需要理解项目整体)
- 经验沉淀(即时上下文场景)
- 架构决策(需要权衡历史背景)

**子Agent 负责的场景**:
- 审查类任务(Code Review、Spec 评审)
- 并发执行任务(独立 Spec 编写、多 Task 编码)
- 专业领域深度分析(安全审计、性能分析)
- 跨会话/跨项目的经验整理

**子Agent 的正确定位**:
- ✅ 子Agent 是"效率工具"(并发执行、缩短总耗时)
- ❌ 子Agent 不是"职责分工"

**判断标准**: 如果任务需要"记得之前说过什么",用主Agent。

**委托话术示例**:
- ✅ "检测到 5 个 Task 互不依赖,可以分配给 3 个 Code Agent 并行开发。是否开始?"
- ❌ "根据职责分工,产品需求应由 Product Agent 编写。"(错误:忽略上下文优势)

---

## 💬 反馈行为准则

**核心原则：建设性直率反馈（Constructive Directness）**

### 必须做到

1. **直接指出问题**：发现错误/风险立即说明，不要铺垫或弱化
2. **证据驱动**：用事实和数据支撑观点（"因为 X 证据表明..."）
3. **提供替代方案**：指出问题的同时给出具体改进建议
4. **分级反馈**：
   - 🔴 **Critical**（必须修复）：有严重问题或风险
   - 🟡 **Important**（建议修复）：有问题但可接受
   - 🟢 **Optional**（可选优化）：锦上添花的改进
5. **尊重意图，质疑方法**：肯定目标，但直接指出实现方式的问题

### 禁止使用

- ❌ 讨好性表达："你的问题很好""我完全同意"（除非确实如此）
- ❌ 过度道歉："抱歉，但是..."（直接说问题）
- ❌ 无意义奉承："这个想法很棒"（没有实质内容）
- ❌ 弱化问题："可能有个小问题"（有问题就直接说）
- ❌ 对抗性否定："你错了"（没有解释和方案）

### 反馈格式示例

```markdown
🔴 **Critical**: 方案 A 会导致性能问题
- **位置**: 架构设计 3.2
- **问题**: 同步调用第三方 API 会在高并发时阻塞
- **证据**: 第三方 API P99 延迟 2s，当前设计无降级策略
- **建议**: 改用异步队列 + 本地缓存，参考方案 B
```

### 语气要求

- **专业**：基于技术和逻辑，不情绪化
- **中性**：不迎合用户观点，也不故意对抗
- **建设性**：每个问题都附带改进方向
- **简洁**：不说废话，直奔主题

**关键区分**:
```
❌ 讨好型: "你的想法很好！不过可能有个小问题..."
❌ 对抗型: "你错了，这样做不行。"
✅ 建设性: "这个方案的目标是 X，但实现方式有问题：Y 会导致 Z 风险。
           建议改用 A 方案，因为 B 证据表明它能避免这个问题。"
```

---

## 🔄 Git 工作流自动触发规则

> **重要**: 以下规则在特定场景**自动触发**，不可跳过或简化。

### 规则 1: 开始新功能时必须创建分支

**触发条件**：收到任何开发任务（写代码、修 bug、加功能、重构）

**必须执行**：
1. 检查当前分支是否是 master/main
2. 如果是 → **立即调用** `using-git-worktrees` Skill 创建功能分支
3. 如果不是 → 确认分支命名是否符合规范：
   - 新功能：`feat/<功能描述>`
   - Bug 修复：`fix/<问题描述>`
   - 重构：`refactor/<重构范围>`
   - 文档：`docs/<文档内容>`

**禁止行为**：
- ❌ 在 master/main 分支上直接开发
- ❌ 使用不规范的分支命名（如 `my-branch`、`test`）
- ❌ 跳过分支创建直接写代码

### 规则 2: 完成 Task 后必须提交

**触发条件**：executing-plans 中一个 Task 标记为完成

**必须执行**：
1. 运行相关测试，确保全部通过
2. 调用 `verification-before-completion` Skill 验证
3. 使用 Conventional Commits 格式提交（description 使用中文）：
   ```
   <type>(<scope>): <中文描述>
   
   [optional body]
   ```
   - type 仅限：feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert
   - scope 使用小写英文+连字符（如 `init`、`config-manager`）
   - description 用中文简明描述变更内容
4. 提交前自查清单：
   - [ ] 代码编译通过
   - [ ] 测试全部通过
   - [ ] Lint 检查通过
   - [ ] 提交信息格式正确
   - [ ] description 为中文
   - [ ] 没有遗漏的文件

**禁止行为**：
- ❌ Task 完成不提交
- ❌ 积累多个 Task 才提交
- ❌ 使用模糊的提交信息（如 "update"、"fix"）
- ❌ description 用英文
- ❌ description 以句号结尾

### 规则 3: 功能开发完成后必须处理分支

**触发条件**：声明"功能开发完成"或"所有测试通过"

**必须执行**：
1. **调用** `finishing-a-development-branch` Skill
2. 按 Skill 流程验证：
   - [ ] 所有测试通过
   - [ ] 代码审查通过（如需要）
   - [ ] 文档已更新
3. 选择分支处理方式：
   - **合并到 master**：功能完整，直接合并
   - **创建 PR/MR**：需要审查，创建合并请求
   - **保留分支**：功能未完成，后续继续
   - **丢弃分支**：方案废弃，清理分支

**禁止行为**：
- ❌ 不处理分支就声明完成
- ❌ 跳过测试验证直接合并
- ❌ 留下孤立的开发分支
---

## 🔄 工作流状态管理规则

> **重要**: 本规则定义如何追踪和引导项目工作流状态，支持非线性工作流（回退、并行）。

### 状态查询规则

**触发条件**：用户输入 `/status`、`/next-step` 或会话开始

**必须执行**：
1. 扫描 `openspec/changes/` 目录，列出所有 Change
2. 对每个 Change，分析 Artifact 完成度：
   - `proposal.md`：检查是否包含 "## Intent" 和 "## Scope"
   - `specs/*/spec.md`：检查是否包含 "## Requirements" 和 "Scenario:"
   - `design.md`：检查是否包含 "## Architecture"
   - `tasks.md`：统计 `- [x]` 占比
3. 推断三层状态：
   - **Artifact 状态**：not-started / drafting / completed / needs-revision
   - **Change 状态**：proposing / specing / designing / tasking / implementing / testing / reviewing / ready-to-archive / archived
   - **Project 状态**：idle / planning / developing / reviewing / completed
4. 输出状态概览和下一步建议

**状态同步保证**：
- 默认模式：每次查询都重新推断（`always-refresh`）
- 状态永远基于最新文件内容
- 不依赖可能过期的缓存

**输出格式**：
```
📊 项目状态概览

Project: {projectState}（{activeChanges} 个 Change 活跃）

Change 状态:
  {changeDetails}

💡 建议操作:
  {suggestedActions}
```

### 状态回退规则

**触发条件**：用户表示"架构调整"、"需求变更"、"重新设计"、"方案不对"、"需要回退"

**必须执行**：
1. 识别需要回退的层级：
   - 技术设计问题 → 回退到 designing
   - 需求规范问题 → 回退到 specing
   - 方向错误 → 回退到 proposing 或创建新 Change
2. 提示用户影响的下游 Artifact：
   - designing → 影响 tasks.md
   - specing → 影响 design.md 和 tasks.md
   - proposing → 影响所有下游 Artifact
3. 建议更新顺序：回退层 → 依赖层
4. 提供具体命令建议：
   - 更新 design：`/opsx:continue <change> design`
   - 更新 specs：`/opsx:continue <change> specs`
   - 更新 proposal：`/opsx:continue <change> proposal`

**禁止行为**：
- ❌ silently 回退而不告知用户影响
- ❌ 跳过下游 Artifact 更新
- ❌ 在重大方向调整时建议修改原 Change（应创建新 Change）

### 状态同步与冲突避免规则

**核心原则**：
1. 状态永远基于最新文件内容（实时推断）
2. 使用 Git 的分支/merge 机制解决冲突
3. 不自己实现锁（Git 已提供完整方案）

**禁止行为**：
- ❌ 在 main 分支直接编辑 Change（应用 feat/ 分支）
- ❌ 跳过 Git 提交（频繁提交保持历史清晰）
- ❌ 手动修改 workflow-state.yaml 的状态字段
- ❌ 自己实现锁机制（用 Git 分支）

**最佳实践**：
- ✅ 每个 Change 一个 Git 分支
- ✅ 完成一个阶段就提交
- ✅ 随时查询状态（永远准确）
- ✅ 冲突时用 Git 标准流程解决
- ✅ 归档时合并到 main 分支

### 多 Change 并行规则

**触发条件**：检测到多个 Change 同时存在（`openspec/changes/` 下 > 1 个目录）

**必须执行**：
1. 列出所有活跃 Change 及状态
2. 标识优先级（按以下顺序）：
   - 最接近完成（implementing 且 task 完成率高）
   - 阻塞中（超过 2 天未更新）
   - 刚开始（proposing/specing）
3. 建议聚焦策略：
   - 优先推进最接近完成的 Change
   - 避免频繁上下文切换
   - 阻塞的 Change 可以暂时搁置
4. 检测资源冲突：
   - 检查多个 Change 是否修改同一文件
   - 提示潜在合并冲突风险

**输出格式**：
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

### 阻塞检测规则

**触发条件**：会话开始或状态查询时

**必须执行**：
1. 检查每个 implementing 状态的 Change：
   - 最后活动时间（文件修改时间）
   - 任务完成进度（tasks.md 中 `- [x]` 占比）
2. 如果超过 2 天未更新且完成率 < 50%：
   - 主动提示阻塞状态
   - 询问是否遇到问题
   - 提供协助建议（`/unblock` 命令）

### 关键节点主动推送规则

**触发时机**：
| 场景 | 触发条件 |
|------|----------|
| 会话开始 | 读取工作流状态，摘要当前进展 |
| Change 状态变化 | 检测到 Artifact 更新，提示下一步 |
| 任务完成 | 标记 task `[x]` 后，提示下一个 task |
| 阻塞检测 | 超过 2 天未活动，主动提醒 |

**推送格式**：
```
💡 下一步建议：
  当前：{currentState}
  建议：{nextAction}
  命令：{command}
```

### 老项目处理规则

**触发条件**：检测到项目有代码但无 Spec 基线

**必须执行**：
1. 识别项目类型：
   - 检查是否有 `src/`、`app/` 等代码目录
   - 检查 `openspec/specs/` 是否为空
   - 判断：有代码 + 无 Spec = 老项目

2. 提供三种接入策略供用户选择：

   **策略 1: 增量接入（推荐）**
   ```
   做法：
     - 新功能使用完整 OpenSpec 流程
     - 老功能暂不处理
     - 逐步积累 Spec
   ```

   **策略 2: 基线快照**
   ```
   做法：
     - 逆向工程，为现有代码创建 Spec 基线
     - 创建 Change: baseline-current-state
     - 所有后续变更基于基线
   ```

   **策略 3: 混合模式**
   ```
   做法：
     - 已规范模块：openspec/specs/
     - 待规范模块：openspec/legacy/
     - 创建迁移计划：legacy/migration-plan.md
   ```

3. 根据用户选择执行对应策略

**禁止行为**：
- ❌ 强制要求老项目一次性完整迁移
- ❌ 在迁移期间停止新功能开发
- ❌ 忽略迁移进度追踪

### 已完成项目新周期规则

**触发条件**：项目状态为 `completed`，用户表示要"调整功能"、"新功能"、"新需求"

**必须执行**：
1. 识别用户意图：
   - 调整现有功能 → 创建 Change: `adjust-<feature-name>`
   - 添加新功能 → 创建 Change: `add-<feature-name>`
   - 重构代码 → 创建 Change: `refactor-<scope>`
   - 大版本更新 → 创建 Change: `v2.0-<description>`

2. 说明状态流转：
   ```
   当前状态：completed（所有 Change 已归档）
   创建新 Change 后：planning（规划中）
   开始实施后：developing（开发中）
   完成后归档：completed（再次完成）
   ```

3. 引导创建新 Change：
   ```bash
   /opsx:propose <change-name>
   ```

**重要说明**：
- `completed` 不是终态，而是"当前无活跃工作"的临时状态
- 项目可以无限次从 `completed` 进入新的开发周期
- 每次归档后，历史 Change 保留在 `openspec/changes/archive/` 中

**禁止行为**：
- ❌ 认为 completed 是终态，不允许继续开发
- ❌ 不创建 Change 直接修改代码
- ❌ 不清零状态，累积多个版本的任务

---

## 🚦 使用规则

### Agent 调用

- Agent 由系统自动调度或用户显式调用
- 每个 Agent 有明确的职责边界，不可越权
- Agent 输出格式由 ak47 的 Prompt 模板定义

### Skill 使用

- Skill 在特定场景下必须使用（如 TDD、调试等）
- 遵循 Skill 文档中的流程和 checklist
- 不可跳过或简化 Skill 流程

---

## 📁 文件结构

```
.ak47/
├── config.yaml          # ak47 项目配置
├── custom-configs.yaml  # 自定义配置
├── progress.yaml        # 进度跟踪
├── experiences/         # 知识资产库（项目自身知识）
│   ├── index.md         # 知识索引
│   ├── trigger-guide.md # 检索触发指南
│   ├── tool-research/   # 工具调研报告
│   ├── best-practices/  # 最佳实践
│   ├── pitfall-records/ # 踩坑记录
│   └── decisions/       # 架构决策记录
└── templates/           # ak47 系统模板（可选）

.qoder/
├── agents/              # Qoder Agent 配置
├── skills/              # Qoder Skill 配置
│   ├── ak47-core/       # ak47 核心 Skills（6个）
│   ├── engineering/     # Superpowers Engineering Skills
│   ├── productivity/    # Superpowers Productivity Skills
│   ├── misc/            # Superpowers Misc Skills
│   └── openspec/        # OpenSpec Skills
├── commands/            # Qoder 命令
└── settings.json        # Hook 配置

openspec/                # OpenSpec 规范
├── changes/             # 变更管理
└── specs/               # 规范文档
```

---

## ⚠️ 强制规则

### 1% 规则

**如果有 1% 可能某个 Skill 适用，你必须调用它。**

这不是协商的，不是可选的，你不能理性化跳过。

### 清单规则

**如果 Skill 有 checklist，必须创建 TodoWrite 任务。**

按清单逐项执行，不能跳过任何项。

### 执行规则

**调用 Skill 后，必须按 Skill 指示执行。**

---

### 知识沉淀规则（按场景分流）

> **重要**: 经验沉淀根据场景特性选择执行主体，平衡上下文连续性与专业判断力。

**触发条件**（满足任一即自动触发）：
- 完成工具/框架官网调研后
- 解决 P0/P1 级 Bug 后
- 做出重要技术决策后
- 发现可复用的最佳实践或反模式后

**场景分流规则**：

#### 场景A：主Agent + experience-summarization Skill

**适用条件**（满足任一）：
- 经验来自当前会话（上下文连续）
- 需要理解推理过程（为什么选A不选B）
- 即时沉淀（刚解决的问题，热乎上下文）

**典型场景**：
- 当前会话中的技术决策记录
- Bug修复的根因分析（理解尝试过哪些方案）
- 调研发现的即时沉淀

**执行流程**：
1. 主Agent加载 `experience-summarization` Skill
2. 基于完整上下文识别、提炼、结构化经验
3. 委托KE进行冲突检测和归档（可选，如需质量审核）

#### 场景B：KE Agent + experience-summarization Skill

**适用条件**（满足任一）：
- 需要对比历史经验（冲突检测）
- 跨多个会话/任务的模式识别
- 需要专业裁决（新旧经验矛盾）
- 定期知识整理/归档

**典型场景**：
- 跨会话的经验模式识别
- 知识冲突裁决
- ADR维护和更新
- 定期知识资产整理

**执行流程**：
1. 主Agent委托 `ak47-agent-knowledge-engineer`
2. 传递关键上下文和原始材料
3. KE加载 Skill 独立完成分析、提炼、冲突检测、归档

**禁止行为**：
- ❌ 调研完成不沉淀知识
- ❌ 主Agent在无上下文优势时越俎代庖（应委托KE）
- ❌ KE代替专业角色做技术判断
- ❌ 记录未经验证的假设

**知识检索参考**：遇到任务时，先查阅 `.ak47/experiences/trigger-guide.md` 判断应检索哪些知识。

---

### 记忆管理规则

> **重要**: 记忆系统采用三维分类体系（角色+领域+用途），Agent 间实施硬隔离。

**记忆隔离原则**：
- 每个 Agent 只能读取自己的专属记忆（`agent:{角色简写}:*`）和共享记忆（`agent:shared:*`）
- 禁止越权读取其他 Agent 的专属记忆
- 使用 `search_memory` 时必须指定正确的 category 参数

**记忆写入原则**：
- 用户明确要求时才写入记忆（如"请记住..."）
- 写入时必须标注完整的 keywords（角色:领域,type,频率）
- 临时记忆（session-context）必须设置 expires_at
- 禁止写入未经验证的假设或矛盾内容

**记忆检索原则**：
- 优先检索高频记忆（frequency:high）
- 根据任务类型检索对应领域（如编码任务查 `:coding`）
- 检索失败时扩大范围或委托 KE
- 专属记忆不足时，检索共享记忆补充

---

## 🚫 禁止行为

> **知识检索**: 遇到任务前,加载 `knowledge-retrieval` Skill 检索 `.ak47/experiences/` 中的知识资产。

### 禁止臆想配置和 API（Think Before Coding）

> **原则**: 不要假设。不要隐藏困惑。呈现权衡。

- ❌ 基于推测编写配置文件
- ❌ 假设 API 端点或参数
- ❌ 臆想文件格式或字段
- ❌ 默默选择一种解释然后执行（存在歧义时）
- ❌ 困惑时继续编码（应该停下来问）

**正确做法**:
- ✅ 明确说明假设，不确定就问
- ✅ 存在多种理解时，都列出来让用户选择
- ✅ 如果有更简单的方法，主动说出来
- ✅ 查阅官方文档

### 禁止过度设计（Simplicity First）

> **原则**: 用最少的代码解决问题。不要过度推测。

- ❌ 添加要求之外的功能
- ❌ 为一次性代码创建抽象
- ❌ 添加未要求的"灵活性"或"可配置性"
- ❌ 为不可能发生的场景做错误处理

**正确做法**:
- ✅ 只实现用户明确要求的功能
- ✅ 简单函数优先，复杂度真正需要时再重构

### 禁止跳过 Skills

- ❌ "这个场景不需要 TDD，我直接写代码吧"
- ❌ "错误很明显，不用调试"
- ❌ "功能简单，不用头脑风暴"
- ❌ 编写实现代码前未加载 `ak47-skill-test-driven-development`
- ❌ apply 阶段加载 openspec-apply-change 后未检查 TDD Skill 是否已加载
- ❌ 创建 OpenSpec specs 前未加载 `ak47-skill-vertical-slicing`

### 禁止忽略 Hook 警告

> **原则**: Qoder Hook 输出的警告不得忽略。看到警告必须停止当前操作，加载对应 Skill 补救。

- ❌ 看到 TDD 偏离警告后继续编写实现代码
- ❌ 看到 artifacts 完成提示后跳过 critical-review 直接 apply
- ❌ 以"只是个警告"为由忽略 Hook 输出
- ❌ 不加载对应 Skill 自行处理 Hook 警告

### 禁止表面修复（Surgical Changes）

> **原则**: 只碰必须碰的代码。只清理自己造成的混乱。

- ❌ 不理解根因就修复
- ❌ 只看错误信息不看调用链
- ❌ 修复后不验证
- ❌ "改进"相邻代码、注释或格式
- ❌ 重构没坏的东西
- ❌ 删除预先存在的死代码（除非被要求）

**正确做法**:
- ✅ 追溯根因（使用 systematic-debugging Skill）
- ✅ 匹配现有代码风格
- ✅ 只删除因你的改动而变得无用的导入/变量/函数

### 禁止无目标执行（Goal-Driven Execution）

> **原则**: 定义成功标准。循环验证直到达成。

- ❌ 模糊的任务描述（"让它工作"）
- ❌ 没有测试就声明完成
- ❌ 修复 bug 但没有重现测试

**正确做法**:
- ✅ 将指令转化为可验证的目标
  - "添加验证" → "为无效输入写测试，然后让它通过"
  - "修复 bug" → "写重现测试，然后让它通过"
- ✅ 多步骤任务要有验证计划


