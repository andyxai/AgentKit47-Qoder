---
name: ak47-skill-knowledge-retrieval
description: "ak47 知识检索 Skill，系统化检索项目知识资产以支撑决策"
---

# 知识检索 Skill

## 用途

在执行任务前,加载本 Skill 检索 `.ak47/experiences/` 中的知识资产,避免重复踩坑、复用已有经验。

## 何时检索

遇到以下场景时**必须检索**知识资产:

| 场景 | 检索目标 |
|------|---------|
| Agent 分工决策 | 主Agent vs 子Agent 的使用场景 |
| 经验沉淀 | 何时由主Agent/KE 执行经验沉淀 |
| 架构决策 | ADR 决策记录、架构原则 |
| 创建文档模板 | 模板管理最佳实践、命名规范 |
| 遇到报错 | 踩坑记录、反模式、解决方案 |
| 开始新任务 | 检查是否有相关经验可复用 |

## 检索方法

### 方式 1: 语义检索(推荐)

使用 `search_codebase` 工具:
```
search_codebase:
  query: "描述你的问题或需求"
  target_directories: [".ak47/experiences/"]
  key_words: "关键词1,关键词2,关键词3"
```

### 方式 2: 索引检索

读取 `.ak47/experiences/index.md`:
- 查看知识条目列表
- 点击相关条目链接直接读取

### 方式 3: 关键词检索

使用 `grep_code`:
```bash
grep_code --path .ak47/experiences/ --regex "关键词"
```

### 方式 4: 记忆检索

高频知识已写入 Qoder Memory:
```
search_memory:
  query: "关键词"
  category: "expert_experience,learned_skill_experience"
```

## 知识资产结构

```
.ak47/experiences/
├── index.md                      # 知识资产索引
├── trigger-guide.md              # 知识检索触发指南
├── best-practices/               # 最佳实践
│   ├── BP-agent-subagent-decision-strategy.md
│   ├── BP-architectural-decision-evolution-methodology.md
│   └── ...
├── decisions/                    # 架构决策(ADR)
│   ├── ADR-001-template-directory-location.md
│   ├── ADR-002-experience-summarization-boundary.md
│   └── ...
├── pitfall-records/              # 踩坑记录
│   └── ...
└── tool-research/                # 工具调研
    └── ...
```

## 检索流程

1. **判断场景**: 当前任务属于哪个检索场景
2. **选择方法**: 优先语义检索,已知文件名用索引检索
3. **读取内容**: 获取相关知识条目
4. **应用知识**: 将知识应用到当前决策
5. **记录缺失**: 如无相关知识,标记需要沉淀

## 配合使用

- **知识沉淀**: `experience-summarization` Skill (完成任务后)
- **知识研究**: `knowledge-research` Skill (外部调研)
- **术语管理**: `terminology-management` Skill (术语一致性)
