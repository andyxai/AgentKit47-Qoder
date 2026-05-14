<div align="center">
    <h1>🔫 AgentKit47</h1>
    <h3><em>一条命令，快速搭建 AI 开发环境</em></h3>
</div>

<p align="center">
    <strong>一个仍在迭代中的 AI 工程化脚手架，为 Qoder 生成 Agent/Skill/规则/流程配置，探索让 AI 辅助开发更好用的方式。</strong>
</p>

<p align="center">
    <a href="https://github.com/andyxai/AgentKit47-Qoder/-/tags"><img src="https://img.shields.io/badge/version-0.6.8-blue" alt="Version"/></a>
    <a href="https://github.com/andyxai/AgentKit47-Qoder"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"/></a>
    <a href="https://github.com/andyxai/AgentKit47-Qoder"><img src="https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen" alt="Node"/></a>
</p>

> 📖 学习借鉴了 [spec-kit](https://github.com/github/spec-kit)、[OpenSpec](https://github.com/Fission-AI/OpenSpec)、[mattpocock-skills](https://github.com/mattpocock/mattpocock-skills)、[Superpowers](https://github.com/coleam00/superpowers)、[gstack](https://github.com/gstack-cn/gstack) 等开源项目。

---

## 目录

- [🤔 AK47 解决什么问题？](#-ak47-解决什么问题)
- [⚡ 快速开始](#-快速开始)
- [🔧 CLI 命令参考](#-cli-命令参考)
- [🎁 你的项目会获得什么？](#-你的项目会获得什么)
- [🧠 设计哲学](#-设计哲学)
- [📚 学习资源](#-学习资源)
- [👥 自定义配置](#-自定义配置)
- [📂 项目结构](#-项目结构)
- [🛠️ 开发指南](#️-开发指南)
- [📖 了解更多](#-了解更多)
- [📋 版本历史](#-版本历史)
- [📄 许可证](#-许可证)

> 💡 本文中，🖥️ 表示终端命令行操作，🤖 表示在 Qoder 中与 AI 对话完成的操作。

---

## 🤔 AK47 解决什么问题？

AI 编程助手（如 Qoder、Claude Code、Cursor）越来越强大，但**开箱不等于好用**。要让 AI 真正理解你的项目规范、遵循开发流程、沉淀开发经验，你需要：

- 🤖 定义专职的 AI Agent 角色（开发者、审查者、架构师……）
- 📋 配置开发 Skills（TDD、系统调试、Code Review……）
- 📜 编写项目规则（禁止臆想 API、1% 规则、禁止过度设计……）
- 🔄 搭建工作流（需求 → 架构 → 计划 → 实现 → 审查 → 归档）
- 🧠 建立知识沉淀机制（ADR、最佳实践、踩坑记录……）

这一切如果从零搭建，需要大量试错和领域知识。AK47 的目标是把这些标准化、模板化，减少从零开始的成本。

> **核心理念**：AK47 的核心是一套 Qoder 配置——包含 Agent（工具）、Skill（能力）、Rules（规范）、流程编排、知识沉淀机制。目标是提供一个可以跑起来的 AI 开发协作起点，而不是终点。

这个项目最初只是为了自己用着顺手，起步时认知有限——该参考什么、融合什么、自己写什么，都是边做边调整。认知升级是个过程，等把几个方向全揉进一套体系之后才发现已经积重难返。如果从零再来，可能会选在 spec-kit 上做插件——框架管规范，自己管定制。不过各有取舍，当前独立维护的形态对个人使用更灵活，做少量调整也可以约束多人协作。目前就是这个形态，还在用，也还在改。

---

## ⚡ 快速开始

### 1. 安装 🖥️

```bash
# 一键安装（推荐）
git clone --depth 1 https://github.com/andyxai/AgentKit47-Qoder.git /tmp/ak47-install && \
  bash /tmp/ak47-install/scripts/install.sh && \
  rm -rf /tmp/ak47-install

# 或静默安装（跳过交互确认）
curl -sSL https://github.com/andyxai/AgentKit47-Qoder/raw/master/scripts/install.sh | bash -s -- --yes
```

安装脚本会自动完成：Node.js 环境检查 → ak47 CLI 安装 → OpenSpec CLI 安装（必要依赖）→ 安装验证。

> **本地开发安装**：`git clone` → `npm install` → `npm run build` → `npm link`

### 2. 初始化你的项目 🖥️

```bash
cd your-project
ak47 init
```

`ak47 init` 会扫描你的项目结构（技术栈、现有配置、项目成熟度），推荐并生成 AI 开发环境配置。

### 3. 在 Qoder 中开始开发 🤖

在终端中初始化完成后，用 Qoder 打开项目，对 AI 说：

```
帮我修复一个 Bug               # Qoder 会走 L1（轻量级流程）
帮我开发 XXX 功能               # Qoder 会走 L2（中量级流程）
重构 XXX 模块                   # Qoder 会走 L3（全量级流程）
```

> 🖥️ 也可以用命令行启动：`ak47 change L1` / `ak47 change L2` / `ak47 change L3`，然后在 Qoder 中继续。

AI 会按照项目的 Agent/Skill/规则配置，尝试引导完成需求定义 → 架构设计 → 计划编写 → TDD 实现 → Code Review → 归档的流程。

详细安装步骤见 [安装指南](docs/guides/installation.md)。

---

## 🔧 CLI 命令参考 🖥️

| 命令 | 说明 |
|------|------|
| `ak47 init` | 扫描项目结构，推荐并生成 AI Agent/Skill/规则/流程配置 |
| `ak47 change <L1\|L2\|L3>` | 启动 L1（轻量）/ L2（中量）/ L3（全量）三级变更流程 |
| `ak47 config <get\|set\|list\|reset>` | 查看或修改项目级配置 |
| `ak47 config-manager` | 自定义配置管理（添加 Agent / Skill / 验证类型等） |
| `ak47 validate` | 验证项目配置完整性和一致性 |
| `ak47 upgrade` | 同步项目模板到 CLI 最新版本（SHA256 对比 + 三路 diff） |
| `ak47 update` | 检查并更新 CLI 工具自身到最新版本 |
| `ak47 doctor` | 项目健康体检（环境 / 结构 / 快照 / 升级待办，加 `--json` 可供 CI 消费） |

---

## 🎁 你的项目会获得什么？

运行 `ak47 init` 🖥️ 后，你的项目会获得以下能力：

### 🤖 9 个专职 AI Agent 角色 —— Qoder 内使用

产品负责人、架构师、开发者、审查者、流程守护者、知识工程师、配置维护者、脚手架维护者、领域驱动设计——每个 Agent 都有明确的职责边界和工作流程。在 Qoder 中 AI 会尝试调用合适的 Agent 角色。

### 🤖 29 个核心 Skills —— Qoder 内使用

覆盖需求定义、架构设计、批判性审核、TDD、系统调试、Code Review、领域建模、垂直切片、经验沉淀、知识检索、改进提案与审核等完整开发活动。每个 Skill 附带输入/输出合约说明。在 Qoder 中对 AI 说出需求，AI 会尝试匹配合适的 Skill。

### 🤖 项目规则体系 —— Qoder 自动加载

自动注入核心行为规则（禁止臆想 API、禁止过度设计、禁止表面修复、1% 规则等），由 Qoder 平台自动加载到每次 AI 上下文中，无需手动操作。

### 🤖 L1/L2/L3 智能变更流程 —— Qoder 内使用

根据变更复杂度选择流程深度——Bug 修复走轻量级（L1，仅 Code Review），常规功能走中量级（L2，Spec Delta + 实现），系统重构走全量级（L3，完整 Spec 驱动）。在 Qoder 中对 AI 描述任务，流程会尝试自动匹配。

### 🤖 知识沉淀体系 —— Qoder 内自动完成

架构决策记录（ADR）、最佳实践、踩坑记录——经验可由 AI 结构化归档到 `.ak47/experiences/`，供后续检索参考。

### 🤖 自我改进反馈体系 —— Qoder 内使用

AK47 自身行为不符合预期时，可触发改进提案和改进审核两个 Skill：提案方分析根因、区分普适性缺陷与项目特有问题并产出结构化报告；审核方比对 AK47 设计原则和用户项目诉求，给出接纳/修改/暂缓/拒绝/转上游五档裁决及具体修改方案。

### 🖥️ 验证测试体系 —— 命令行

可配置性能测试、回归测试、安全扫描等验证类型，支持自动/手动触发。

```bash
ak47 validate          # 验证项目配置完整性和一致性
ak47 doctor            # 项目健康体检
ak47 doctor --json     # JSON 输出，可接入 CI/CD
```

### 🖥️ Git Hooks 零 Token 消耗 —— 自动生效

commit-msg 格式检查、敏感信息检测等硬规则由 Git Hook 处理，`git commit` 时自动触发，不消耗 AI token，无需额外操作。

### 🖥️ 配置管理与升级 —— 命令行

```bash
ak47 config get/set/list/reset    # 查看或修改项目配置
ak47 config-manager               # 管理自定义 Agent / Skill
ak47 upgrade                      # 同步模板到最新版本
ak47 update                       # 更新 CLI 工具自身
```


---

## 📚 学习资源

AK47 不仅是一个工具，也是一套**仍在积累中的方法论**。在构建 AK47 的过程中，将实践经验整理成了系统化的学习材料。

> 每个模块都按照 **是什么 → 怎么来的 → 为什么有效 → 核心方法 → 对比其他方案** 的结构展开，希望能帮你不仅"知道"，还能"理解为什么"和"知道怎么用"。

| 模块 | 解决什么问题 | 阅读时长 |
|------|------------|---------|
| [01 四大工程纪律](docs/learn/01-four-core-disciplines.md) | TDD/DDD/调试SOP/反熵增——四维一体的工程纪律体系 | 15 min |
| [02 系统化调试方法论](docs/learn/02-systematic-debugging.md) | 用结构化方法替代"凭经验猜"，提升排障效率 | 10 min |
| [03 AI 时代的代码重构](docs/learn/03-ai-era-refactoring.md) | AI 生成代码快但乱，如何把"能跑"变得更好维护 | 12 min |
| [04 Agent 分工决策方法论](docs/learn/04-agent-task-delegation.md) | 多 AI Agent 协作时，主/子 Agent 如何分工 | 8 min |
| [05 需求文档双重保障机制](docs/learn/05-requirements-double-guarantee.md) | 四阶段门控 + 独立审核，减少需求返工 | 10 min |
| [06 垂直切分与 Spec 设计](docs/learn/06-vertical-slicing-and-spec-design.md) | DDD+OpenSpec+垂直切分三层协同，大需求拆成可交付小Spec | 15 min |

→ **[查看学习中心首页](docs/learn/index.md)**，按你的角色和需求选择阅读路线。

---

## 🧠 设计哲学

### 从个人使用整理出来

这个项目最初只是为了自己用着顺手。如果现在从零开始，可能会选择在 spec-kit 上开发插件的方式——框架管规范层，自己管定制层。但各有取舍：插件方式更标准化但灵活性受限，当前独立维护的方式对个人使用更灵活，做少量调整也可以用于多人协作，按统一范式约束开发过程，避免过度自由影响协同。目前就是这个形态，还在用，也还在改。SOP 和 TDD 环节还比较薄弱，测试体系也有不少需要优化的地方——这些都是接下来要补的。

### 静态化，零运行时开销

所有 Agent/Skill/规则配置在 `ak47 init` 时一次性生成为静态文件，运行时零渲染开销，可审计、可版本控制。

### 通用化方向

生成的配置尽量不含项目特定变量——目前的目标是同一个模板适用于大多数项目和语言。但仍在迭代中，适配范围还在验证。

### 开放可定制

Fork → 修改模板 → 安装，三步把你的工作流沉淀为可复用的标准。

---

## 👥 自定义配置

AK47 在设计中留出了**定制空间**——你可以根据自己的工作流自由调整。

### Fork → 定制 → 安装 🖥️

1. **Fork 本仓库**
2. **修改模板**：`templates/qoder/` 下的 Agent、Skill、规则、命令模板按需调整
3. **安装**：`git clone <你的仓库> && bash scripts/install.sh`

### Git 地址自动适配 🖥️

`install.sh` 会自动检测从哪个仓库克隆——Fork 后通常不需要手动改任何地址。

### 用 AI 辅助定制 🤖

克隆后在 Qoder 中对 AI 说：**"帮我把 git 地址换成你的仓库地址"**，项目内置 skill 会自动替换所有引用。

```bash
# 🖥️ 运行时指定仓库
AK47_REPO=https://你的仓库.git curl ... | bash

# 🖥️ 在已有项目中管理自定义配置
ak47 config-manager add-agent --id my-agent --name "我的 Agent" --file path/to/agent.md
```

---

## 📂 项目结构

```
AgentKit47/
├── src/
│   ├── cli/commands/          # 8 个 CLI 命令实现
│   ├── core/                  # 核心模块
│   │   ├── scanner/           # 项目扫描（技术栈 / 结构 / 平台）
│   │   ├── recommender/       # 智能推荐（规则引擎 + 范式预设）
│   │   ├── generator/         # 模板生成（静态拷贝 + 快照管理）
│   │   ├── orchestrator/      # 流程编排（进度追踪 + 偏离记录）
│   │   ├── validator/         # 配置验证（完整性 / 一致性检查）
│   │   ├── config-manager/    # 自定义配置管理（CRUD + 备份）
│   │   ├── upgrader/          # 升级管理（SHA256 + 三路 diff）
│   │   ├── flows/             # L1/L2/L3 变更流程定义
│   │   └── doctor/            # 项目健康体检
│   ├── types/                 # 共享类型定义
│   └── utils/                 # 工具函数
├── tests/                     # 25 个测试文件
├── templates/                 # 能力单元模板（Agent / Skill / 规则 / 命令）
├── docs/                      # 设计文档 / 用户指南 / 研究报告
├── scripts/install.sh         # 一键安装脚本
├── package.json
└── tsconfig.json
```

---

## 🛠️ 开发指南 🖥️

### 环境要求

- Node.js >= 20.19.0
- npm >= 10.0.0
- Git >= 2.30.0

### 本地开发

```bash
npm install          # 安装依赖
npm run build        # 编译
npm run dev          # 监听模式
npm test             # 运行测试
npm run test:run     # 一次性运行所有测试
npm run lint         # 代码检查
npm run format       # 代码格式化
```

### 质量保障

- TypeScript strict 模式
- ESLint v9 + Prettier 代码规范
- Vitest 测试框架，25 个测试文件
- 模板完整性自动验证（`validate-templates`）

---

## 📖 了解更多

| 文档 | 说明 |
|------|------|
| [CHANGELOG.md](CHANGELOG.md) | 版本更新日志 |
| [安装指南](docs/guides/installation.md) | 详细安装步骤 |
| [系统架构](docs/design/architecture/01-system-overview.md) | 架构设计概览 |
| [Agent 设计](docs/design/agents/01-agent-design.md) | Agent 体系设计文档 |
| [决策记录](docs/design/decisions/) | 架构决策记录（ADR） |
| [场景指南](docs/guides/scenarios.md) | 典型使用场景详解 |
| [迁移指南](docs/guides/migration.md) | 从旧版本迁移 |

---

## 📋 版本历史

> 每个版本的重要更新摘要，详细记录见 [CHANGELOG.md](CHANGELOG.md)。

| 版本 | 日期 | 重要更新 |
|------|------|---------|
| **0.6.8** | 2026-05-13 | 同步脚本 URL 替换修复，README 语气收敛 |
| **0.6.7** | 2026-05-13 | 门控规则体系（11 个门控点），自我改进双 Skill 体系（提案+审核），关键 Skill 强制触发规则 |
| **0.6.6** | 2026-05-13 | Spec 审查门禁，移除 openspec skill 目录（改由 openspec init 生成） |
| **0.6.5** | 2026-05-12 | 学习文档语气调整 |
| **0.6.4** | 2026-05-12 | 学习文档外部引用校准，格式统一 |
| **0.6.3** | 2026-05-12 | 新增 release-guide.sh / github-push.sh，安装脚本修复 |
| **0.6.2** | 2026-05-12 | 学习文档章节标题统一，《代码大全2》模块重写 |
| **0.6.1** | 2026-05-12 | README 语气收敛，学习文档全面谦虚化 |
| **0.6.0** | 2026-05-12 | Fork 后一键替换仓库地址，README 全面改版 |
| **0.5.8** | 2026-05-11 | Git 提交规范统一为中文 |
| **0.5.7** | 2026-05-11 | 新项目需求盘问流程自动触发规则 |
| **0.5.6** | 2026-05-11 | init 产出目录结构修复 |
| **0.5.3** | 2026-05-08 | triage-brief / improve-architecture 借鉴 mattpocock-skills，需求-架构-审核三重保障机制 |
| **0.5.2** | 2026-05-07 | Agent/Skill 完全静态化，模板目录彻底清理（删 ~100+ 废弃文件） |
| **0.5.1** | 2026-05-07 | Hook 配置 JSON 化，专注 Qoder 平台 |
| **0.5.0** | 2026-05-07 | 外部平台功能测试开放能力，Config Manager 配置管理器 |
| **0.4.2** | 2026-05-07 | `ak47 update` 命令，项目配置升级保护机制 |
| **0.4.1** | 2026-05-06 | Git 工作流自动触发规则 |
| **0.4.0** | 2026-05-06 | Git Hooks 体系（零 token 消耗） |
| **0.3.7** | 2026-05-06 | Superpowers 14 个 Skills 完整集成 |
| **0.3.5** | 2026-05-06 | 安装脚本快速参数，多个安装问题修复 |
| **0.3.0** | 2026-05-06 | init 初始化模式选择，平台手动选择 |
| **0.2.0** | 2026-05-03 | 完整复用 Superpowers 能力体系（Skills + Hooks + AGENTS.md） |
| **0.1.0** | 2026-05-03 | 初始版本：Scanner / Recommender / Generator / Orchestrator / Upgrader / Validator 核心模块 |

---

## 📄 许可证

MIT © andy.zx

---

## 🙏 致谢

AK47 站在以下开源项目的肩膀上：

- **spec-kit** — Spec 驱动开发框架
- **OpenSpec** — 规范驱动开发理念
- **mattpocock-skills** — Skill 设计模式
- **Superpowers** — AI 编码方法论与 Skill 体系
- **gstack** — 多平台协同思路

> 更详细的项目对比分析见 [学习中心 · 07 五大项目对比](docs/learn/07-five-projects-comparison.md)。

感谢这些优秀项目的启发！
