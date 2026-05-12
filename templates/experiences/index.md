# ak47 知识资产索引

> 本目录存储项目的知识资产,包括工具调研、最佳实践、踩坑记录和架构决策。
> 
> **维护者**: ak47-agent-knowledge-engineer  
> **更新机制**: 自动触发(工具调研完成、Bug 解决、技术决策后)

---

## 📚 知识分类

### 1. 工具调研报告 (`tool-research/`)

记录对工具、框架、平台的官方文档调研成果。

**适用场景**: 技术选型、工具配置、能力边界探索

### 2. 最佳实践 (`best-practices/`)

记录项目中验证的有效做法和推荐方案。

**适用场景**: 流程规范、开发模式、配置策略

### 3. 踩坑记录 (`pitfall-records/`)

记录项目中遇到的典型问题、根因分析和解决方案。

**适用场景**: 问题排查、避免重复踩坑、反模式识别

### 4. 架构决策 (`decisions/`)

记录重要的技术决策背景、选项对比和最终选择(ADR 格式)。

**适用场景**: 架构设计、技术选型、方案评审

---

## 📋 知识条目列表

### 最新条目

| ID | 标题 | 类型 | 日期 | 路径 |
|----|------|------|------|------|
| _暂无条目_ | - | - | - | - |

### 按分类统计

| 分类 | 数量 | 最新条目 |
|------|------|---------|
| tool-research | 0 | - |
| best-practices | 0 | - |
| pitfall-records | 0 | - |
| decisions | 0 | - |

---

## 🔍 快速检索指南

### 方式 1: 语义检索(推荐)

使用 `search_codebase` 工具搜索 `.ak47/experiences/` 目录:

```
search_codebase:
  query: "Qoder Hook 配置"
  target_directories: [".ak47/experiences/"]
```

### 方式 2: 索引检索

直接浏览本索引文件,按分类查找相关条目。

### 方式 3: 关键词检索

使用 `grep_code` 在 `.ak47/experiences/` 中搜索关键词:

```bash
grep_code --path .ak47/experiences/ --regex "关键词"
```

### 方式 4: 委托知识工程师

复杂场景下,调用 `ak47-agent-knowledge-engineer` Agent 进行综合检索和冲突检测。

---

## 🎯 检索触发指南

遇到任务时,先查阅 [trigger-guide.md](trigger-guide.md) 判断应检索哪些知识。

**快速参考**:

| 当前场景 | 应检索的知识 | 检索路径 |
|---------|-------------|---------|
| Agent 分工决策 | 主Agent vs 子Agent 的使用场景 | `best-practices/*agent-subagent*` |
| 经验沉淀 | 何时由主Agent/KE 执行经验沉淀 | `best-practices/*experience-scenario*` |
| 配置 Qoder Hook | Qoder Hook 配置方式、支持的事件节点 | `tool-research/*qoder-hook*` |
| 创建新功能分支 | ak47 Git 工作流规范 | `best-practices/*git-workflow*` |
| 技术选型 | 相关工具调研报告 | `tool-research/` |
| 遇到报错 | 踩坑记录、反模式 | `pitfall-records/` |
| 架构设计 | ADR 决策记录 | `decisions/` |

---

## 📊 知识资产健康度

### 覆盖度

- [ ] 工具链核心组件已调研(Qoder、ak47、Git 工作流)
- [ ] 常见开发场景有最佳实践覆盖
- [ ] 历史踩坑已归档

### 时效性

- [ ] 所有知识条目标注了最后验证日期
- [ ] 过时内容已标记或归档

### 一致性

- [ ] 知识条目之间无矛盾
- [ ] 与 AGENTS.md 规则保持一致

---

## 🔄 维护规则

1. **新增知识**: 通过 KE Agent 按 experience-summarization 流程沉淀
2. **更新知识**: 在原文件上更新,保留版本历史
3. **冲突处理**: KE 负责检测冲突并裁决,无法判定的上报用户
4. **定期回顾**: 每周回顾索引,确保知识资产健康

---

**创建时间**: {{date}}  
**维护工具**: ak47-agent-knowledge-engineer
