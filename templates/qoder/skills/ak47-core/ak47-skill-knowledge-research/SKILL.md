---
name: ak47-skill-knowledge-research
description: "ak47 知识调研 Skill，系统化执行技术调研与信息评估"
---

# 知识调研 Skill

## 用途

技术选型、架构设计或验证假设时，加载本 Skill 执行系统化调研，产出可支撑决策的结构化报告。

## 调研方法论

```
定义问题 → 搜索策略 → 证据评估 → 结论综合
```

### 1. 定义问题

- 将模糊需求转化为 1-3 个可回答的具体问题
- 示例: ❌ "了解微服务" → ✅ "gRPC vs REST 在内部通信中的性能差异"

### 2. 搜索策略

- 优先英文关键词搜索技术内容
- 限定高质量来源: site:github.com / site:arxiv.org
- 优先近 2 年内容，过时内容标注时效风险

### 3. 证据评估

| 信息源分级 | 可信度 | 适用场景 |
|-----------|--------|---------|
| 官方文档 | 最高 | 技术选型、API使用 |
| 学术论文 | 高 | 算法、架构理论验证 |
| 知名技术博客 | 中 | 实践经验、方案对比 |
| 社区讨论 | 低（辅证） | 边缘 case、踩坑记录 |

- 关键结论需至少 2 个独立来源交叉验证
- 单一来源标注"仅供参考"

### 4. 结论综合

- 区分"事实"与"观点"
- 给出明确的行动建议（非"视情况而定"）
- 标注调研局限性

## 输出格式

```yaml
research_report:
  question: "调研问题"
  findings:
    - claim: "关键发现1"
      evidence: ["来源A URL", "来源B URL"]
      confidence: "high"
    - claim: "关键发现2"
      evidence: ["来源C URL"]
      confidence: "medium"
  recommendation: "明确的行动建议"
  limitations: ["信息不足xxx", "时效性风险xxx"]
```

## 与 Knowledge Engineer 的关系

- 本 Skill 提供**调研方法论和流程**
- Knowledge Engineer（KE）**调用此 Skill** 执行具体调研任务
- KE 负责将调研报告转化为 ADR 或经验条目

## 红线

- ❌ 未交叉验证就采信单一来源
- ❌ 只堆砌信息不做结论综合
- ❌ 混淆事实与个人观点
