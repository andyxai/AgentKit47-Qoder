# Misc Skills

偶尔使用的 Skills，涵盖原型设计、知识研究、经验总结、术语管理等辅助能力。

---

## 📋 Skills 列表

| Skill | 描述 | 触发场景 |
|-------|------|---------|
| [ak47-skill-prototype](ak47-skill-prototype/SKILL.md) | 原型设计 - 快速验证方案 | 逻辑/状态模型验证、UI 方案探索 |
| [ak47-skill-terminology-management](ak47-skill-terminology-management/SKILL.md) | 术语管理 - 统一领域语言 | 发现术语冲突、更新 CONTEXT.md |
| [ak47-skill-zoom-out](ak47-skill-zoom-out/SKILL.md) | 全局视角 - 宏观分析 | 架构决策、系统性问题 |

**已移至 ak47-core/**:
- `ak47-skill-entry-guard` → [../ak47-core/ak47-skill-entry-guard.md](../ak47-core/ak47-skill-entry-guard.md)
- `ak47-skill-experience-summarization` → [../ak47-core/ak47-skill-experience-summarization.md](../ak47-core/ak47-skill-experience-summarization.md)
- `ak47-skill-knowledge-research` → [../ak47-core/ak47-skill-knowledge-research.md](../ak47-core/ak47-skill-knowledge-research.md)

---

## 🎯 使用指南

### 原型设计流程

```
明确验证目标
  ↓
选择原型类型
  ├─ LOGIC 原型：逻辑/状态模型是否正确？
  └─ UI 原型：外观应该是什么样？
  ↓
遵循 6 条铁律
  1. 从第一天就是可抛弃的
  2. 一条命令运行
  3. 默认无持久化
  4. 跳过打磨（无测试、无错误处理）
  5. 每次操作后展示完整状态
  6. 完成后删除或吸收
  ↓
知识沉淀
  └─ 原型答案记录到耐久位置（commit message、ADR、Issue）
```

### 经验沉淀时机

- ✅ 完成复杂功能后
- ✅ 解决棘手问题后
- ✅ 发现新的最佳实践
- ✅ 遇到重要教训和陷阱

---

## 📚 参考资料

- [AGENTS.md](../../../../AGENTS.md) - AI 行为指令和 Skill 使用规范
- [经验文档索引](../../../../.ak47/experiences/index.md) - 已沉淀的知识资产
