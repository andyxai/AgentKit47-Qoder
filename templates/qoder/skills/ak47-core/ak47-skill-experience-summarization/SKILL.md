---
name: ak47-skill-experience-summarization
description: "ak47 经验总结 Skill，从实践中识别、提炼、结构化和归档可复用经验"
---

# 经验总结 Skill

## 用途

项目关键节点完成后，加载本 Skill 将实践中的经验沉淀为可复用知识资产。

## 四步方法论

### 步骤 1：识别

从以下场景中识别可复用的经验模式：
- L1/L2 变更完成后的复盘
- P0 级 Bug 的根因分析
- 技术调研的关键发现
- 审查中发现的典型问题
- **批量修改后的完整性检查**（如路径变更、API重命名）

**识别标准**: 该模式是否可能在其他场景/项目中复现？

### 步骤 2：提炼

去除项目特定细节，抽象为通用规律：
- ❌ "在 . 里用 Redis 缓存订单数据"
- ✅ "热点读场景下，缓存层可降低 80% 数据库压力"

### 步骤 3：结构化

每条经验使用标准格式：

```markdown
## 场景
在什么情况下遇到该问题/发现该模式

## 问题
具体的问题描述或挑战

## 方案
采取的解决方案及关键步骤

## 效果
量化或定性的改善结果

## 适用条件
该经验适用的前提和边界（技术栈、规模、版本等）
```

### 步骤 4：归档

- 通用经验 → 写入 Skill 模板目录（如 anti-patterns、harness-design）
- 项目特定经验 → 写入 `.ak47/experiences/` 目录
- 技术决策 → 写入 `documents/decisions/ADR-{序号}.md`
- **流程改进** → 更新对应 Skill 的检查清单

## 输出格式

```yaml
experience_record:
  id: "EXP-YYYYMMDD-{序号}"
  title: "一句话概括"
  type: "反模式" | "最佳实践" | "踩坑记录" | "方案推荐"
  source: "{变更ID} / {BugID} / 用户请求"
  version: "v1"
  date: "YYYY-MM-DD"
  structured_content:
    scenario: "..."
    problem: "..."
    solution: "..."
    effect: "..."
    conditions: "..."
```

## 红线

- ❌ 未去除项目细节 = 无法复用
- ❌ 缺少适用条件 = 误用风险
- ❌ 只记录结论不记录推理过程 = 难以更新
