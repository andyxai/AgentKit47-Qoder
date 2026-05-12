---
name: ak47-skill-harness-design
description: "ak47 七层架构方法论 Skill，指导系统分层设计与层间依赖分析"
---

# 七层架构方法论 Skill

## 用途

设计系统架构或评审架构方案时，加载本 Skill 用七层模型分析系统分层，确保职责清晰、依赖正确。

## 七层定义

| 层级 | 名称 | 职责 | 典型内容 |
|------|------|------|---------|
| 7 | 表现层 | 用户交互与界面渲染 | UI组件、API Gateway、CLI |
| 6 | 应用层 | 用例编排与流程协调 | Service、Controller、UseCase |
| 5 | 领域层 | 核心业务逻辑与规则 | Entity、Domain Service、Value Object |
| 4 | 基础设施层 | 技术能力抽象与封装 | Repository Interface、Cache、MQ |
| 3 | 数据层 | 数据持久化与访问 | DB、ORM、Migration、Query |
| 2 | 集成层 | 外部系统对接与适配 | SDK、Client、Adapter、Webhook |
| 1 | 运维层 | 部署、监控、可观测性 | CI/CD、Logging、Metrics、Alerting |

## 层间依赖规则

```
上层 ──依赖──→ 下层

表现层 → 应用层 → 领域层 → 基础设施层 → 数据层
                          ↓
                        集成层
                          ↓
                        运维层（独立，被所有层依赖）
```

- **只允许上层依赖下层**，禁止反向依赖
- **领域层最纯净**，不依赖任何框架或基础设施细节
- **跨层调用必须经过中间层**，禁止跳跃

## 分层分析指南

分析现有系统或设计新系统时，按以下步骤：

1. **识别每层组件**: 将现有代码/模块映射到七层
2. **检查依赖方向**: 确认无反向依赖、无跨层跳跃
3. **评估层内聚**: 每层内部组件是否职责一致
4. **标注边界模糊处**: 某组件难以归类 = 拆分信号

## 输出格式

```yaml
architecture_review:
  layer_mapping:
    presentation: ["api-gateway", "cli-parser"]
    application: ["change-service", "review-orchestrator"]
    domain: ["change-entity", "classification-rule"]
    infrastructure: ["repository-interface", "cache-manager"]
    data: ["postgres-adapter", "migration-scripts"]
    integration: ["git-client", "webhook-handler"]
    ops: ["docker-compose", "prometheus-config"]
  issues:
    - severity: "critical"
      description: "domain层直接调用了postgres驱动"
      fix: "通过repository-interface抽象数据访问"
  score: "7/10"
```

## 红线

- ❌ 领域层出现框架import = 分层失败
- ❌ 数据层调用应用层 = 循环依赖
- ❌ 以"方便"为由跳过层间抽象
