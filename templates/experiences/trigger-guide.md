# 知识检索触发指南

> 本文档指导 Agent 在不同任务场景下应检索哪些知识资产。
> 
> **适用范围**: 所有 ak47 项目 Agent

---

## 🎯 检索决策树

```
收到任务
  ↓
判断任务类型
  ↓
├─ 工具/框架调研 → 检索 tool-research/
├─ 编码实现 → 检索 best-practices/ (domain:coding)
├─ 问题排查 → 检索 pitfall-records/
├─ 架构设计 → 检索 decisions/
└─ 配置修改 → 检索 best-practices/ (domain:config)
```

---

## 📋 场景-知识映射表

| 场景 | 应检索目录 | 关键词过滤 | 优先级 |
|------|-----------|-----------|--------|
| 选择新工具/框架 | `tool-research/` | `tool:<工具名>` | P0 |
| 编写新功能代码 | `best-practices/` | `domain:coding` | P1 |
| 遇到 Bug/错误 | `pitfall-records/` | `type:pitfall` | P0 |
| 做技术决策 | `decisions/` | `type:adr` | P1 |
| 修改配置文件 | `best-practices/` | `domain:config` | P1 |
| 编写测试 | `best-practices/` | `domain:testing` | P2 |
| 代码审查 | `best-practices/` | `domain:review` | P2 |

---

## 🔑 关键词规范

### 角色标签
- `agent:developer` - 开发者相关
- `agent:architect` - 架构师相关
- `agent:reviewer` - 审查者相关
- `agent:shared` - 共享知识

### 领域标签
- `domain:coding` - 编码实现
- `domain:testing` - 测试相关
- `domain:config` - 配置管理
- `domain:review` - 代码审查
- `domain:architecture` - 架构设计

### 类型标签
- `type:tool-research` - 工具调研
- `type:best-practice` - 最佳实践
- `type:pitfall` - 踩坑记录
- `type:adr` - 架构决策

### 频率标签
- `frequency:high` - 高频使用
- `frequency:medium` - 中频使用
- `frequency:low` - 低频使用

---

## 💡 检索技巧

1. **优先检索高频知识**: `frequency:high` 的经验经过多次验证
2. **根据任务类型缩小范围**: 使用 `domain:` 标签过滤
3. **检索失败时扩大范围**: 去掉 domain 标签,仅保留 type
4. **冲突时查看 ADR**: 架构决策记录具有最高权威性

---

## ⚠️ 注意事项

- ❌ 不要检索过时的知识(检查 `lastVerified` 日期)
- ❌ 不要应用与当前技术栈不匹配的经验
- ✅ 检索后验证知识的适用性
- ✅ 发现知识冲突时触发 KE Agent 裁决

---

**维护者**: {{projectName}} Knowledge Engineer  
**更新时机**: 新增知识分类或调整检索策略时
