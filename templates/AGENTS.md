# AGENTS.md - 项目 AI 行为指令

> 本文档定义 AI 在本项目中必须遵循的行为规则。
>
> - **位置**: 项目根目录
> - **作用**: 指导 AI 如何使用本项目的 Agent、Skill 与工作流
> - **优先级**: 用户指令 > `.qoder/rules/*.md`（全局注入） > AGENTS.md > 默认行为
> - **配套规则**:
>   - [`.qoder/rules/core-behavior.md`](.qoder/rules/core-behavior.md) — 跨场景硬规则（需求盘问 / 1% 规则 / 禁止臆想 / 禁止表面修复 / 反馈准则）
>   - [`.qoder/rules/workflow-state.md`](.qoder/rules/workflow-state.md) — OpenSpec 工作流状态机

---

## 📌 快速索引

| 主题 | 锚点 |
|------|------|
| 项目概述 | [🎯 项目概述](#-项目概述) |
| Agent 清单 | [👥 可用 Agent](#-可用-agent) |
| Skill 清单 | [🛠️ 可用 Skill](#️-可用-skill) |
| Agent 分工决策 | [🧭 Agent 分工原则](#-agent-分工原则) |
| Skills 使用（1% 规则） | [🚀 Skills 使用规则](#-skills-使用规则) |
| Git 工作流自动触发 | [🔄 Git 工作流规则](#-git-工作流规则) |
| OpenSpec 工作流 | [📐 OpenSpec 工作流](#-openspec-工作流) |
| 知识沉淀 | [📚 知识沉淀规则](#-知识沉淀规则) |
| 记忆管理 | [🧠 记忆管理规则](#-记忆管理规则) |
| 文件结构 | [📁 文件结构](#-文件结构) |
| 模块规则索引 | [📋 模块规则索引](#-模块规则索引) |

---

## 🎯 项目概述

**AI 平台**: Qoder

**工具链路径契约**:
- 全局行为规则: `.qoder/rules/*.md`（Qoder 自动注入）
- Agent 定义: `.qoder/agents/*.md`
- Skill 定义: `.qoder/skills/<category>/<name>/SKILL.md`
- Command 定义: `.qoder/commands/<category>/<name>.md`
- Hook 配置与脚本: `.qoder/settings.json` + `.qoder/hooks/*.sh`
- 项目知识资产: `.ak47/experiences/`
- 模块规则参考: `.ak47/rules/*.md`

---

## 👥 可用 Agent

项目内共 **9 个** Agent，定义位于 `.qoder/agents/`：

| Agent | 职责 |
|-------|------|
| `ak47-agent-architect` | 系统架构师 — Spec 拆分、依赖排序、技术路径、架构评审 |
| `ak47-agent-config-maintainer` | 配置维护者 — `.ak47/` 目录治理、配置一致性、版本管理 |
| `ak47-agent-ddd` | 领域建模师 — 领域驱动设计、限界上下文、聚合设计 |
| `ak47-agent-developer` | 开发者 — Spec Task 实现、代码编写、单元测试 |
| `ak47-agent-knowledge-engineer` | 知识工程师 — 经验沉淀、ADR 维护、知识冲突裁决 |
| `ak47-agent-po` | 产品负责人 — 需求澄清、验收标准、优先级、评审 |
| `ak47-agent-process-guardian` | 流程守护者 — 范式执行、规则遵守、偏离记录、流程审计 |
| `ak47-agent-reviewer` | 审查专家 — 代码审查、质量评估、反模式检测 |
| `ak47-agent-scaffold-maintainer` | 脚手架维护者 — 生成资产通用性审计、导入导出验证 |

---

## 🛠️ 可用 Skill

项目内共 **30 个** Skill，按类别组织于 `.qoder/skills/`：

### ak47 核心（`ak47-core/`，8 个）

| Skill | 用途 |
|-------|------|
| `ak47-skill-entry-guard` | 入口判定 — 答疑/轻量/重量分流 |
| `ak47-skill-change-classification` | 变更分类 — 判定 L1/L2/L3 范式 |
| `ak47-skill-anti-patterns` | 反模式速查 — 设计/实现/流程三类 |
| `ak47-skill-harness-design` | 七层架构方法论 |
| `ak47-skill-experience-summarization` | 经验总结 — 识别/提炼/归档可复用经验 |
| `ak47-skill-knowledge-retrieval` | 知识检索 — 系统化检索 `.ak47/experiences/` |
| `ak47-skill-knowledge-research` | 知识调研 — 外部技术调研与信息评估 |
| `ak47-using-skills` | Skills 体系概览与加载导航 |

### Engineering（`engineering/`，11 个）

`ak47-skill-architecture-design` · `ak47-skill-code-review` · `ak47-skill-critical-review` · `ak47-skill-domain-modeling` · `ak47-skill-improve-architecture` · `ak47-skill-requirements-definition` · `ak47-skill-systematic-debugging` · `ak47-skill-test-driven-development` · `ak47-skill-triage-brief` · `ak47-skill-vertical-slicing` · `ak47-skill-writing-skills`

### Productivity（`productivity/`，4 个）

`ak47-skill-executing-plans` · `ak47-skill-finishing-a-development-branch` · `ak47-skill-using-git-worktrees` · `ak47-skill-writing-plans`

### OpenSpec（`openspec/`，4 个）

`openspec-propose` · `openspec-apply-change` · `openspec-archive-change` · `openspec-explore`

### Misc（`misc/`，3 个）

`ak47-skill-prototype` · `ak47-skill-terminology-management` · `ak47-skill-zoom-out`

---

## 🧭 Agent 分工原则

> **核心原则**: Agent 分工基于"上下文连续性 vs 独立判断力"的权衡，而非教条的职责分工。

**决策矩阵**:

| 场景特征 | 推荐方案 | 原因 |
|---------|---------|------|
| 需要上下文连续性 | 主 Agent + Skill | 主 Agent 拥有完整对话历史 |
| 需要独立判断力 | 子 Agent + Skill | 子 Agent 无历史包袱 |
| 可以并发执行 | 多个子 Agent + Skill | 子 Agent 可并行运行 |

**主 Agent 负责**: 产品需求讨论、代码设计与编写、即时经验沉淀、架构决策。

**子 Agent 负责**: 审查类任务、并发独立任务、专业领域深度分析、跨会话经验整理。

**子 Agent 的正确定位**:
- ✅ "效率工具"（并发执行、缩短总耗时）
- ❌ 不是"职责分工"

**判断标准**: 如果任务需要"记得之前说过什么"，用主 Agent。

**委托话术示例**:
- ✅ "检测到 5 个 Task 互不依赖，可分配给 3 个 Code Agent 并行开发。是否开始？"
- ❌ "根据职责分工，产品需求应由 Product Agent 编写。"

---

## 🚀 Skills 使用规则

### 会话启动时必须执行

1. 加载 `ak47-using-skills` Skill 了解完整 Skills 体系
2. 遵循 1% 规则（详见 [`.qoder/rules/core-behavior.md`](.qoder/rules/core-behavior.md)）

> **注意**: Qoder 官方支持的 Hook 事件为 `UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PostToolUseFailure`、`Stop`。**不存在** `SessionStart` 事件，因此会话启动加载依赖 AI 主动执行，不能依赖 Hook 自动触发。

### 1% 规则（强制）

**如果有 1% 可能某个 Skill 适用，你必须调用它。** 详细规定与禁止跳过清单见 [`.qoder/rules/core-behavior.md`](.qoder/rules/core-behavior.md)。

---

## 🔄 Git 工作流规则

> 以下规则在特定场景**自动触发**。

### 规则 1: 开始新功能前必须创建分支

**触发条件**: 收到任何开发任务（写代码、修 bug、加功能、重构）。

**必须执行**:
1. 检查当前分支是否是 `master` / `main`
2. 若是 → 立即调用 `ak47-skill-using-git-worktrees` 创建功能分支
3. 分支命名规范：
   - 新功能：`feat/<描述>`
   - Bug 修复：`fix/<描述>`
   - 重构：`refactor/<范围>`
   - 文档：`docs/<内容>`

**禁止**:
- ❌ 在 `master`/`main` 上直接开发
- ❌ 使用不规范的分支命名（如 `my-branch`、`test`）

### 规则 2: 完成 Task 后必须提交

**必须执行**:
1. 运行相关测试
2. 调用 `ak47-skill-verification-before-completion` 验证（若存在）
3. 使用 Conventional Commits 格式：`<type>(<scope>): <description>`
   - description 使用中文（AK47 生成的项目默认中文）
   - type 仅限：feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert
   - scope 使用小写英文+连字符（如 `init`、`config-manager`）
   - description 简明扼要，不超过 72 字符，不以句号结尾
4. 提交前自查：编译通过 / 测试通过 / Lint 通过 / 信息格式正确 / description 为中文 / 无遗漏文件

**禁止**:
- ❌ Task 完成不提交
- ❌ 积累多个 Task 才提交
- ❌ 使用模糊的提交信息（如 "update"、"fix"）
- ❌ description 以句号结尾

### 规则 3: 功能开发完成后必须处理分支

**必须执行**:
1. 调用 `ak47-skill-finishing-a-development-branch`
2. 验证：测试通过 / 代码审查通过 / 文档已更新
3. 选择处理方式：合并到 master / 创建 PR / 保留分支 / 丢弃分支

**禁止**:
- ❌ 不处理分支就声明完成
- ❌ 跳过测试验证直接合并
- ❌ 留下孤立开发分支

---

## 📐 OpenSpec 工作流

> **详细状态机**: [`.qoder/rules/workflow-state.md`](.qoder/rules/workflow-state.md)（Qoder 自动注入）

### 速查

- 查询状态：`/status` 或 `/next-step`
- 创建 Change：`/opsx:propose <name>`
- 继续某环节：`/opsx:continue <change> <proposal|specs|design|tasks>`
- 归档：`/opsx:archive <change>`
- 解除阻塞：`/unblock <change>`

### 硬性约束

- ❌ 在 `master`/`main` 上直接编辑 Change（应用 `feat/` 分支）
- ❌ 手动修改 `workflow-state.yaml` 的状态字段
- ❌ `completed` 后累积任务不清零（应创建新 Change）

---

## 📚 知识沉淀规则

> **触发条件**（任一即自动触发）:
> - 完成工具/框架官网调研后
> - 解决 P0/P1 级 Bug 后
> - 做出重要技术决策后
> - 发现可复用的最佳实践或反模式后

### 场景 A：主 Agent + `ak47-skill-experience-summarization`

**适用**: 经验来自当前会话（上下文连续）/ 需要理解推理过程 / 即时沉淀。

**执行**: 主 Agent 加载 Skill → 基于上下文识别、提炼、结构化 → 可选委托 KE 做冲突检测和归档。

### 场景 B：`ak47-agent-knowledge-engineer` + `ak47-skill-experience-summarization`

**适用**: 需要对比历史经验（冲突检测）/ 跨会话模式识别 / 需要专业裁决 / 定期整理。

**执行**: 主 Agent 委托 KE → 传递关键上下文 → KE 独立完成分析、提炼、冲突检测、归档。

**禁止**:
- ❌ 调研完成不沉淀知识
- ❌ 主 Agent 在无上下文优势时越俎代庖（应委托 KE）
- ❌ KE 代替专业角色做技术判断
- ❌ 记录未经验证的假设

**知识检索入口**: `.ak47/experiences/trigger-guide.md`（首次由 AI 从系统模板创建）。

---

## 🧠 记忆管理规则

**记忆隔离原则**:
- 每个 Agent 只能读取自己的专属记忆（`agent:{角色简写}:*`）和共享记忆（`agent:shared:*`）
- 禁止越权读取其他 Agent 的专属记忆
- 使用 `search_memory` 时必须指定正确的 category 参数

**记忆写入原则**:
- 用户明确要求时才写入（如"请记住..."）
- 必须标注完整 keywords（角色:领域,type,频率）
- 临时记忆（`session-context`）必须设置 `expires_at`
- 禁止写入未经验证的假设或矛盾内容

**记忆检索原则**:
- 优先检索高频记忆（`frequency:high`）
- 按任务类型检索对应领域（如编码任务查 `:coding`）
- 专属记忆不足时检索共享记忆补充

---

## 📁 文件结构

```
.ak47/
├── config.yaml          # ak47 项目配置
├── custom-configs.yaml  # 自定义配置
├── progress.yaml        # 进度跟踪
├── rules.md             # 本项目硬规则（汇总）
├── rules/               # 模块级规则文件（按需查阅）
├── experiences/         # 知识资产库（渐进式创建）
│   ├── index.md
│   ├── trigger-guide.md
│   ├── tool-research/
│   ├── best-practices/
│   ├── pitfall-records/
│   └── decisions/
└── templates/           # ak47 系统模板

.qoder/
├── agents/              # Agent 定义（9 个）
├── skills/              # Skill 定义（30 个，目录+SKILL.md 结构）
│   ├── ak47-core/
│   ├── engineering/
│   ├── productivity/
│   ├── openspec/
│   └── misc/
├── commands/            # 自定义命令
├── hooks/               # Hook 脚本（shell）
├── rules/               # 全局注入规则
│   ├── core-behavior.md
│   └── workflow-state.md
└── settings.json        # Hook 绑定

openspec/                # OpenSpec 规范
├── changes/
└── specs/
```

---

## 📋 模块规则索引

> **说明**: Qoder 不支持基于 frontmatter 的路径过滤，模块规则需 AI **主动查阅**。

**查阅时机**: 处理对应模块时。

| 编辑对象 | 查阅规则 | 位置 |
|---------|---------|------|
| `src/cli/**/*` | CLI 规则 | `.ak47/rules/cli-rules.md` |
| `src/core/**/*` | 核心架构规则 | `.ak47/rules/core-architecture-rules.md` |
| `tests/**/*` | 测试规则 | `.ak47/rules/test-rules.md` |
| `src/types/**/*` | 类型规则 | `.ak47/rules/types-rules.md` |
| `docs/**/*` | 文档规则 | `.ak47/rules/docs-rules.md` |

### 强制规则（通过 Hooks 警告）

| 规则 | Hook 事件 | 脚本 |
|------|----------|------|
| 无 Spec 不写代码（警告） | `PreToolUse` on `Write\|Edit\|MultiEdit` | `.qoder/hooks/pre-write-spec-check.sh` |
| 无测试记偏离 | `PostToolUse` on `Write\|Edit\|MultiEdit` | `.qoder/hooks/post-code-tdd-check.sh` |
| 文档必须有引用 | `PostToolUse` on `Write\|Edit\|MultiEdit` | `.qoder/hooks/post-doc-reference-check.sh` |

> Hook 策略是**警告 + 记偏离到 `.ak47/deviations.log`**，不阻断。阻断式校验由 `ak47 validate` 统一执行。

---

## 🚫 禁止行为速查

详细清单见 [`.qoder/rules/core-behavior.md`](.qoder/rules/core-behavior.md)。核心条目：

1. **禁止臆想 API/配置** — 查阅官方文档，困惑即问
2. **禁止过度设计** — 只实现用户明确要求的
3. **禁止表面修复** — 追溯根因，不擦表面
4. **禁止跳过 Skills** — 1% 可能性即强制调用
5. **禁止无目标执行** — 定义可验证的成功标准
