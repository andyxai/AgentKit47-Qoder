---
name: ak47-skill-domain-modeling
description: "ak47 Domain Modeling Skill,覆盖 Bounded Context 划分、Aggregate 设计、Domain Event 识别的方法论与 Checklist"
---

# Domain Modeling Skill

## 用途

进行 Domain Analysis、设计 Domain Model 或评审架构时，加载本 Skill 指导 Domain Modeling 过程。

## Bounded Context 划分

### 识别原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **单一职责** | 每个 Context 聚焦一个 Business Capability | Order Management、Inventory、Payment |
| **团队自治** | 单个 Context 可由一个团队独立开发部署 | 微服务边界 |
| **Ubiquitous Language** | Context 内术语含义一致，跨 Context 可能不同 | "Product"在 Catalog vs Order 中含义不同 |
| **高内聚低耦合** | Context 内高度内聚，Context 间最小依赖 | 通过 Domain Event 或 ACL 交互 |

### Context Map 关系

| 关系模式 | 说明 | 适用场景 |
|---------|------|---------|
| **Upstream-Downstream** | 上游提供能力，下游消费 | 基础服务 → 业务服务 |
| **Customer-Supplier** | 下游驱动上游需求 | 业务需求 → 平台能力 |
| **Conformist** | 下游直接遵循上游 Model | 强依赖且无需适配 |
| **Anti-Corruption Layer (ACL)** | 通过适配层隔离不同 Model | 外部系统集成 |
| **Shared Kernel** | 多个 Context 共享部分 Model | 团队紧密协作 |
| **Open Host Service** | 通过 Protocol 开放服务 | 平台化能力暴露 |
| **Published Language** | 通过标准化 Schema 交互 | Event Schema、API Contract |

## Aggregate 设计

### 设计原则

| 原则 | 说明 | Checkpoint |
|------|------|-----------|
| **Consistency Boundary** | Aggregate 是事务一致性边界 | ✅ 单个 Aggregate 内强一致 |
| **Small Aggregate** | 优先设计小 Aggregate | ✅ 避免 Large Aggregate 导致锁竞争 |
| **Aggregate Root** | 通过 Root 访问 Aggregate 内对象 | ✅ 外部不直接引用内部 Entity |
| **Reference by ID** | Aggregate 间通过 ID 引用 | ✅ 不直接持有其他 Aggregate 引用 |
| **Invariant Enforcement** | Root 负责维护 Invariant | ✅ 所有业务规则在 Root 中校验 |

### Aggregate 设计 Checklist

- [ ] 已明确定义 Aggregate Root
- [ ] Root 维护所有 Invariant
- [ ] Aggregate 内对象生命周期由 Root 管理
- [ ] Aggregate 间通过 ID 引用，非对象引用
- [ ] 单个 Aggregate 可在一个事务中完成
- [ ] 已识别并避免 Large Aggregate 反模式

## Entity 与 Value Object

### Entity 特征

| 特征 | 说明 |
|------|------|
| **Identity** | 具有唯一标识，生命周期内不变 |
| **Mutability** | 状态可变，通过方法修改 |
| **Equality** | 基于 Identity 比较，非属性值 |
| **Lifecycle** | 有创建、变更、销毁的生命周期 |

### Value Object 特征

| 特征 | 说明 |
|------|------|
| **No Identity** | 无唯一标识，通过属性值定义 |
| **Immutability** | 一旦创建不可修改 |
| **Equality** | 基于属性值比较（Structural Equality） |
| **Replaceable** | 整体替换，非修改属性 |

### 设计决策树

```
对象是否需要独立 Identity？
├─ 是 → Entity
│   └─ 是否需要跨 Aggregate 引用？
│       ├─ 是 → 确保有稳定 ID
│       └─ 否 → 仅在 Aggregate 内可见
└─ 否 → Value Object
    └─ 是否需要验证规则？
        ├─ 是 → 在构造函数中校验 Invariant
        └─ 否 → 直接封装属性
```

## Domain Event 设计

### Event 识别

| 触发点 | 示例 Event |
|--------|-----------|
| **状态变更** | `OrderPlaced`, `PaymentCompleted` |
| **业务动作** | `UserRegistered`, `ProductPublished` |
| **阈值触发** | `InventoryLow`, `RetryLimitExceeded` |
| **时间触发** | `SubscriptionExpired`, `ReminderDue` |

### Event 设计规范

| 规范 | 说明 | 示例 |
|------|------|------|
| **Past Tense** | Event 名称使用过去式 | `OrderCreated` ✅ / `CreateOrder` ❌ |
| **Self-Describing** | Event 包含完整上下文 | 包含 OrderId、UserId、Timestamp |
| **Immutable** | Event 一旦发布不可修改 | 使用 Value Object 封装 |
| **Idempotent** | 消费者可安全重复处理 | 通过 Event ID 去重 |

### Event Schema

```typescript
interface DomainEvent {
  eventId: string;        // 唯一标识
  aggregateId: string;    // 来源 Aggregate
  eventType: string;      // Event 类型
  occurredAt: Date;       // 发生时间
  payload: Record<string, any>;  // 业务数据
  metadata?: {            // 可选元数据
    correlationId: string;
    causationId: string;
  };
}
```

## 使用方式

1. **Domain Analysis 阶段**:
   - 使用 Bounded Context 划分原则识别 Context
   - 绘制 Context Map 明确 Context 间关系
   - 建立 Ubiquitous Language Glossary

2. **Aggregate 设计阶段**:
   - 使用 Aggregate 设计 Checklist 逐一验证
   - 确保 Small Aggregate 原则
   - 通过设计决策树区分 Entity / Value Object

3. **Event Storming 阶段**:
   - 识别所有 Domain Event
   - 按 Event 规范命名和定义 Schema
   - 建立 Event Flow 图

## 输出格式

```yaml
domain_model:
  bounded_contexts:
    - name: "Order Management"
      responsibility: "处理订单生命周期"
      upstream: ["Product Catalog"]
      downstream: ["Payment", "Fulfillment"]
      ubiquitous_language:
        - term: "Order"
          definition: "客户提交的购买请求"
          related_terms: ["OrderItem", "OrderStatus"]
  
  aggregates:
    - name: "Order"
      root: "Order"
      entities: ["OrderItem"]
      value_objects: ["Money", "Address"]
      invariants:
        - "Order 必须有至少一个 OrderItem"
        - "已支付的 Order 不可修改"
  
  domain_events:
    - name: "OrderPlaced"
      trigger: "客户提交订单"
      publisher: "Order Aggregate"
      consumers: ["Payment", "Inventory"]
```

## 红线

- ❌ 跳过 Bounded Context 划分直接设计 Database Schema
- ❌ Large Aggregate 导致并发性能问题
- ❌ Aggregate 间通过对象引用，非 ID 引用
- ❌ Event 使用现在时命名（如 `CreateOrder`）
- ❌ 未建立 Ubiquitous Language 导致术语混乱
