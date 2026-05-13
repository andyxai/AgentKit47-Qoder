# 五大参考项目深度对比

---

## 背景

AK47 的架构设计并非凭空想象，而是系统研读了 5 个开源 AI 编程工具后整合而来。本文从设计哲学、Spec 管理、Agent/Skill 体系、工作流、测试评审、上下文管理六个维度，深度解剖这五个项目，帮你理解 AK47 为什么长成现在这个样子。

---

## 来源

在构建 AK47 的过程中，和 AI 助手一起研读了大量开源项目。最初只是看看别人怎么做的，但随着调研深入，发现每个项目都代表了一种独特的 AI 编程哲学。最终筛选出 5 个真正影响 AK47 设计的项目：spec-kit（GitHub 官方）、OpenSpec（Fission-AI）、mattpocock/skills、Superpowers（obra）、gstack（Garry Tan）。

这五个项目恰好形成了一个从"文档中心"到"Agent 协同"的光谱，AK47 的定位就落在这个光谱的某个区间上。

---

## 五大项目总览

| 项目 | 作者 | 定位 | 一句话概括 |
|------|------|------|-----------|
| **spec-kit** | GitHub | 规范驱动开发框架 | "先写 Spec，再写代码"——用宪法层文档约束开发流程 |
| **OpenSpec** | Fission-AI | 轻量 SDD 引擎 | "规范可以渐进式生长"——灵活适配存量项目与快速迭代 |
| **mattpocock/skills** | Matt Pocock | 个人 Claude Code 技能集 | "一个 Skill 一个方法论"——最纯粹的 Skill 设计范式 |
| **Superpowers** | Jesse Vincent | 工程化增强系统 | "把 AI 当需严格约束的初级工程师"——强制审查门控 |
| **gstack** | Garry Tan (YC) | 多 AI 平台软件工厂 | "23 个角色 + 七阶段流水线"——最完整的虚拟团队模型 |

---

## 核心维度对比

### 1. 设计哲学：五种 AI 观

| 哲学维度 | spec-kit | OpenSpec | mattpocock | Superpowers | gstack |
|---------|----------|----------|------------|-------------|--------|
| **AI 定位** | 规范执行者 | 协作伙伴 | 方法论载体 | 需约束的初级工程师 | 团队中的角色成员 |
| **核心理念** | 文档驱动 | 渐进式规范 | 方法论驱动 | 流程强制 | 角色分工 |
| **人机关系** | 人定规范，AI 执行 | 人控节奏，AI 落地 | 人选技能，AI 施展 | 人设门控，AI 过检 | 人定角色，AI 扮演 |
| **刚柔度** | 刚性强（宪法层） | 柔性高（渐进式） | 居中 | 刚性强（强制门控） | 居中 |

**核心差异**：这五种哲学的根本分歧在于——**AI 是工具、协作者还是团队成员？**

- spec-kit 和 Superpowers 偏向"工具观"：用结构化约束降低 AI 的不确定性
- OpenSpec 和 mattpocock 偏向"协作者观"：给 AI 正确的方法论，而不是强制的流程
- gstack 偏向"团队成员观"：给 AI 明确的角色，相信角色约束能导向正确行为

AK47 的核心立场是：**AI 是协作者，但需要工程化约束来降低协作风险**。这在 OpenSpec 的柔性规范和 Superpowers 的刚性门控之间取了一个中间态。

---

### 2. Spec/规范管理

| 对比维度 | spec-kit | OpenSpec | mattpocock | Superpowers | gstack |
|---------|----------|----------|------------|-------------|--------|
| **Spec 层级** | 宪法→模块→功能 | 无预设层级（灵活定义） | 无 Spec 概念 | 无 Spec 概念 | 无 Spec 概念 |
| **变更管理** | 无内置机制 | Delta 归档 + 版本追踪 | 无 | 无 | 文档化记录 |
| **格式标准** | 固定模板 | Scenario 格式（Given/When/Then） | 无固定格式 | 无固定格式 | 无固定格式 |
| **适应存量项目** | 弱（重文档基线） | 强（渐进式增量） | N/A | N/A（仅新功能） | N/A（仅新项目） |

**关键洞察**：

- **spec-kit** 和 **OpenSpec** 是仅有的两个有 Spec 管理概念的项目。其他三个项目没有独立的 Spec 层——它们的"Spec"散落在 Skills 定义和 Prompt 中。
- **spec-kit** 的宪法层文档体系很完善，但在存量项目上"先写文档再改代码"的成本极高。
- **OpenSpec** 的渐进式管理更适合现实项目——不需要一次性为所有代码建 Spec，只在新变更时写。

**AK47 的取舍**：以 **OpenSpec** 为 Spec 引擎（取其渐进式风格 + Delta 归档）。AK47 在 OpenSpec 基础上自行扩展了 L1/L2/L3 三级分级：根据变更类型（需求/实现/修复）选择不同的流程深度，在"灵活"和"强制"之间取得平衡——轻量修复走 L3（最小流程），重量需求走 L1（全流程）。

---

### 3. Agent/Skill 体系

| 对比维度 | spec-kit | OpenSpec | mattpocock | Superpowers | gstack |
|---------|----------|----------|------------|-------------|--------|
| **Agent 数量** | 0（无 Agent 体系） | 0（单 Agent） | 0（纯 Skill 驱动） | 0（主 Agent + 子 Agent） | 62 个目录（含 agents/、skills/、bin/ 等） |
| **Skill 数量** | 0 | 0 | 20 Skills（排除 deprecated/in-progress） | 14 Skills | ~31 Skills（其余为脚本/文档/配置） |
| **Skill 设计质量** | — | — | ★★★★★（最纯粹） | ★★★★（工程化） | ★★★（数量多但深浅不一） |
| **多 Agent 协同** | 无 | 无 | 无 | 子 Agent 并行编码 | 角色分工 + 七阶段 |
| **Agent 编排** | — | — | 无 | 有（AGENTS.md bootstrap 自动触发） | 用户手动 `/` 命令调用 |

**关键洞察**：

- **mattpocock** 的 Skill 设计是最纯粹的：每个 Skill 一个完整的方法论（如 `/diagnose` 六步调试循环，AK47 扩展为七步），Skill 之间没有编排依赖，用户按需选择。这种设计哲学直接影响了 AK47 的 Skill 架构——**Skill 应自包含、独立可用**。
- **Superpowers** 的 14 个 Skills 覆盖了完整的开发流程，Skills 之间存在明确的阶段依赖（brainstorming → writing-plans → subagent-driven-development），通过 AGENTS.md 中的 bootstrap 机制自动触发。这种强制单向流转在简化场景下有效，但不够灵活。
- **gstack** 的角色分工（62 个目录，其中 ~31 个是 Skills）是"角色化 Agent"思想的极端实践——每个角色都有独立的目录和 Skill 集，通过七阶段流水线串起来。

**AK47 的取舍**：
- 取 mattpocock 的 **Skill 自包含设计范式**（每个 Skill 完整、独立、可单独调用）
- 取 Superpowers 的 **阶段化编排思路**（但不强制单向流转）
- 取 gstack 的 **角色化 Agent 思想**（AK47 的 8 个 Agent 各司其职）

---

### 4. 工作流引擎

| 对比维度 | spec-kit | OpenSpec | mattpocock | Superpowers | gstack |
|---------|----------|----------|------------|-------------|--------|
| **工作流类型** | 命令链（`/speckit.*`） | 手动命令（`/opsx:*`） | 手动选择 Skill | 半自动状态机 | 手动 `/` 命令链 |
| **阶段划分** | 无显式阶段 | 无（统一 propose→apply→archive） | 无 | brainstorming→plan→build→review | Think→Plan→Build→Review→Test→Ship→Reflect（七阶段） |
| **流程强制** | 无 | 无（灵活） | 无 | 强（Skill 依赖自动触发） | 无（全靠手动调用） |
| **回退支持** | 无 | 有（归档机制） | N/A | 无 | 无 |
| **跨会话恢复** | 无 | Git 文件状态 | 无 | Git Worktrees | 文档化上下文 |

**关键洞察**：

gstack 的七阶段流水线（Think→Plan→Build→Review→Test→Ship→Reflect）是五个项目中最完整的工作流模型。但它的问题是——**全靠用户手动执行 `/` 命令驱动，没有自动化编排**。这意味着流程的完整性取决于使用者的纪律性。

---

### 5. 测试与评审机制

| 对比维度 | spec-kit | OpenSpec | mattpocock | Superpowers | gstack |
|---------|----------|----------|------------|-------------|--------|
| **测试理念** | 无内置 | 无内置 | Tracer Bullet（贯穿性测试） | 强制 TDD | 端到端 + Playwright |
| **代码审查** | 无内置 | 无内置 | 无内置 | 两阶段审查（规范+质量） | Review 阶段 |
| **审查独立性** | — | — | — | 子 Agent 审查 | 同流程角色切换 |

**关键洞察**：

Superpowers 的测试和审查是两个值得学习的设计：
- **强制 TDD**：在所有 Skill 中嵌入测试要求，不容跳过
- **两阶段审查**：规范匹配（Spec Compliance）+ 质量检测（Quality Check），分别由不同子 Agent 执行

但 Superpowers 的审查机制有一个隐性问题：审查子 Agent 和被审查的编码子 Agent 来自同一个 Skill 体系，没有真正的"独立视角"。

AK47 的解决方式：让 **Reviewer Agent** 和 **Developer Agent** 完全独立定义（各自有独立的 Agent 配置文件），确保审查视角的独立性。同时引入 **Process Guardian Agent** 作为第三方流程裁判。

---

### 6. 上下文管理

上下文污染是 AI 编程最大的敌人。五个项目各自有独特的应对策略：

| 策略 | 代表项目 | 具体做法 | 有效性 |
|------|---------|---------|--------|
| **物理隔离** | Superpowers | Git Worktrees 创建独立工作区 | ★★★★（代价大但有效） |
| **规范锚定** | OpenSpec | 每次只注入当前变更的 Spec 片段 | ★★★★（轻量但依赖规范质量） |
| **方法论注入** | mattpocock | Skill 内容就是上下文，不额外管理 | ★★★（适合小任务） |
| **角色隔离** | gstack | 不同角色加载不同 Skill，减少无关上下文 | ★★★（依赖用户正确选择角色） |
| **路径过滤** | AK47 采用 | Rules 按文件路径自动加载，非相关模块不注入 | ★★★★★（精准+自动化） |

**AK47 的路径过滤 Rules**：

这是 AK47 从实践中尝试的一种方式：当 AI 编辑 `src/cli/` 下的文件时，只加载 CLI 相关的 Rules，不加载数据库或架构规则。目标是实现"按需注入上下文"，比全局 Rules 更精准。

---

## AK47 的合成策略

```
                    spec-kit                        mattpocock
                    "先写 Spec"                     "纯 Skill 驱动"
                         │                              │
                         ▼                              ▼
              ┌─────────────────────────────────────────────┐
              │              AK47 合成层                    │
              │                                             │
              │  📋 Spec 引擎 ← OpenSpec (渐进式 + Delta)   │
              │  🎯 Skill 范式 ← mattpocock (自包含设计)    │
              │  🔒 流程门控 ← Superpowers (阶段化编排)      │
              │  👥 角色分工 ← gstack (多 Agent 协同)        │
              │  🏛️ 宪法文档 ← spec-kit (架构模板体系)      │
              │                                             │
              │  ➕ 独创能力:                                │
              │   • 路径过滤 Rules (减少上下文污染)         │
              │   • 经验沉淀系统 (BP + ADR 双轨)             │
              │   • Agent 决策矩阵 (上下文连续性优先)        │
              │   • Qoder 平台深度适配                        │
              └─────────────────────────────────────────────┘
                         │                              │
                         ▼                              ▼
                    OpenSpec                       Superpowers
                 "规范渐进生长"                  "强制流程门控"
                              │
                              ▼
                           gstack
                        "角色化团队"
```

---

## 选型参考

如果你在选型 AI 编程工具或框架，以下决策树可供参考：

```
你需要什么？
├─ 轻量 Spec 管理（存量项目迭代）         → OpenSpec
├─ 完整的流程强制（TDD + 审查 + 门控）     → Superpowers
├─ 纯粹的 Skill 方法论集合（个人提升）     → mattpocock/skills
├─ 多角色虚拟团队（新项目 0→1）           → gstack
├─ 重文档驱动的规范体系                   → spec-kit
└─ 以上都要，但需要定制和整合              → AK47
```

简单说：如果只是一个人写代码，用 mattpocock 或 Superpowers 就够了。如果想为自己建立一套可迁移的 AI 开发配置体系，并在过程中持续沉淀经验——那 AK47 就是给这种情况准备的。

---

## 延伸阅读

- **原始调研文档**：[`docs/research/07-four-frameworks-deep-comparison.md`](../research/07-four-frameworks-deep-comparison.md) — 四框架深度对比（Superpowers / OpenSpec / gstack / agency-agents）
- **项目源码**：以上五个项目均可在 GitHub 找到，表格中已附对应链接
- **AK47 架构总览**：[`docs/design/architecture/01-system-overview.md`](../design/architecture/01-system-overview.md)
- **Agent 分工决策**：[04 Agent 分工决策方法论](04-agent-task-delegation.md) — 上下文连续性优先原则的由来

---

**维护者**: andy.zx  
**创建时间**: 2026-05-12  
**来源**: 五大项目调研 + 社区分析 + 实际使用验证
