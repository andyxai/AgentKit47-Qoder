# Skills 目录索引

> ak47 完整能力体系，按使用场景分类组织。

---

## 📂 目录结构

```
skills/
├── ak47-core/            # ak47 核心 Skills（6 个）
├── engineering/          # 日常代码工作（12 个 Skills）
├── productivity/         # 非代码工作流（6 个 Skills）
├── misc/                 # 偶尔使用（3 个 Skills）
├── openspec/             # OpenSpec 工作流（4 个 Skills）
├── in-progress/          # 草稿，未发布
├── deprecated/           # 已废弃，保留参考
├── ak47-using-skills/    # 使用说明和会话启动
└── README.md             # 本文件
```

---

## 🎯 快速查找

### 按场景查找

| 场景 | 推荐 Skill | 位置 |
|------|-----------|------|
| **开始新功能** | requirements-definition → architecture-design | [engineering/](engineering/README.md) |
| **编写代码前** | test-driven-development | [engineering/](engineering/README.md) |
| **遇到错误** | systematic-debugging | [engineering/](engineering/README.md) |
| **合并前** | code-review → verification-before-completion | [engineering/](engineering/README.md) |
| **文档存档前** | critical-review | [engineering/](engineering/README.md) |
| **规划复杂任务** | writing-plans → executing-plans | [productivity/](productivity/README.md) |
| **并行任务** | dispatching-parallel-agents | [productivity/](productivity/README.md) |
| **Git 分支管理** | using-git-worktrees → finishing-a-development-branch | [productivity/](productivity/README.md) |
| **验证方案** | prototype | [misc/](misc/README.md) |
| **知识沉淀** | experience-summarization | [ak47-core/](ak47-core/) |
| **入口判定** | entry-guard | [ak47-core/](ak47-core/) |
| **规范驱动开发** | openspec-propose → apply-change | [openspec/](openspec/README.md) |

---

## 📊 分类统计

| 分类 | Skills 数量 | 说明 |
|------|------------|------|
| [ak47-core/](ak47-core/) | 6 | 入口判定、变更分类、反模式、架构设计、知识调研、经验总结 |
| [engineering/](engineering/README.md) | 12 | 需求分析、架构设计、TDD、调试、代码审查等 |
| [productivity/](productivity/README.md) | 6 | Git 工作流、计划管理、并行执行等 |
| [misc/](misc/README.md) | 3 | 原型设计、术语管理、全局视角等 |
| [openspec/](openspec/README.md) | 4 | OpenSpec 规范驱动工作流 |
| **总计** | **31** | - |

---

## 📚 使用说明

### 完整指南

- [ak47-using-skills](ak47-using-skills/SKILL.md) - 如何查找和使用 Skills
- [session-start](ak47-using-skills/session-start) - 会话启动检查清单

### 宪法级保障

ak47 采用**双重保障机制**：

1. **第一道防线**：设计者自查（requirements-definition / architecture-design）
2. **第二道防线**：独立审查者（critical-review）
3. **两道防线都通过** → 文档才能存档

### 必须使用的 Skills

根据 [AGENTS.md](../../../AGENTS.md)，以下场景**必须**使用对应 Skill：

- ✅ 创造性工作前 → `requirements-definition`
- ✅ 需求批准后 → `architecture-design`
- ✅ 文档存档前 → `critical-review`
- ✅ 编写代码前 → `test-driven-development`
- ✅ 遇到错误时 → `systematic-debugging`
- ✅ 合并前 → `code-review`

---

## 🔗 相关资源

- [AGENTS.md](../../../AGENTS.md) - AI 行为指令和 Skill 使用规范
- [CONTEXT.md](../../../templates/qoder/CONTEXT.md) - 领域上下文和术语表
- [经验文档索引](../../../.ak47/experiences/index.md) - 已沉淀的知识资产
- [Agents 目录](../../../templates/qoder/agents/) - 可用的 Agent 列表
