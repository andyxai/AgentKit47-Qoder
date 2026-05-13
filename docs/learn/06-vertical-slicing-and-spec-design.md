# 06 · 垂直切分与 Spec 设计：DDD、OpenSpec 三者协同

> **解决什么问题**：需求到 Spec 怎么写才能独立交付？DDD 画了领域边界，OpenSpec 管了 Spec 格式，但 Spec 粒度怎么定——是做一个"大而全的订单模块 Spec"，还是拆成"创建订单 / 查看订单 / 取消订单"三个小 Spec？
> **预计阅读**：15 分钟  
> **原始经验**：[BP-vertical-slice-and-deep-module.md](../../.ak47/experiences/best-practices/BP-vertical-slice-and-deep-module.md)
>
> 📎 知识来源：[mattpocock/skills](https://github.com/mattpocock/skills) — TDD 中的垂直切片理念 · `/improve-codebase-architecture` 深层模块概念 · [OpenSpec](https://github.com/Fission-AI/OpenSpec) — "小变更"理念

---

## 背景

垂直切分是把一个功能从数据库一直切到 UI，形成一个可独立演示、独立合并、独立交付的薄片（Slice）。

核心原则只有一条：每个 Spec 对应一个垂直切片，每个切片穿过所有技术层——schema → API → UI → tests。

```
❌ 水平切分（按技术层拆）：
  Spec 1: 先做所有数据库表
  Spec 2: 再做所有 API
  Spec 3: 最后做所有 UI
  问题：Spec 1 写完没法演示，集成时才发现 API 和数据库对不上

✅ 垂直切分（按用户价值拆）：
  Spec 1: 用户可创建订单（含 Order 表 + API + UI + 测试）→ 3 天即可演示
  Spec 2: 用户可查看订单列表（含查询索引 + API + UI + 测试）→ 3 天
  Spec 3: 用户可取消订单（含状态机 + API + UI + 测试）→ 3 天
```

---

## 来源

垂直切片的概念来自三个源头的交叉验证：

| 源头 | 贡献 |
|------|------|
| **mattpocock/skills** | TDD 技能中的"tracer bullet（示踪子弹）"——先打穿一条完整路径，再横向扩展。`/improve-codebase-architecture` 中提出"深层模块"（Deep Module）概念——小接口 + 大实现 = 高杠杆。 |
| **OpenSpec** | "small, incremental changes"理念——每个 Change 应该是小变更，可独立审查、独立归档。这天然要求 Spec 粒度不能太大。 |
| **Superpowers** | 微任务拆分实践——每个子 Agent 执行 2-5 分钟的任务，避免上下文污染，倒逼任务粒度精细化。 |

我整合后发现：三者说的是同一件事，只是在不同层面——mattpocock 讲的是怎么写代码，OpenSpec 讲的是怎么管规范，Superpowers 讲的是怎么分任务。把它们串起来，就形成了 Spec 级垂直切分——

> 垂直切片不是在 Task 级别才用的技巧，而是在 Spec 级别就应该开始的设计决策。

---

## 原理

### 一个 Spec = 一个垂直切片 的好处

| 维度 | 大 Spec（水平） | 小 Spec（垂直切片） |
|------|----------------|-------------------|
| **Spec 数量** | 1 个"订单模块" | 3 个（创建/查看/取消） |
| **每个 Spec 的 Requirements** | 5 个 | 1 个 |
| **工期** | 9 天 | 每个 3 天 |
| **可独立合并** | ❌ | ✅ |
| **可并行开发** | ❌（一个人做 9 天） | ✅（三个人各 3 天，或子 Agent 并行） |
| **Review 难度** | 高（一次性审查 9 天工作量） | 低（每次审查 3 天） |
| **用户反馈** | 9 天后 | 3 天后 |
| **集成风险** | 高 | 低 |

### 为什么水平切分是陷阱？

水平切分（先做所有 DB → 所有 API → 所有 UI）看起来很"工程化"，但致命问题在于：
- 做完数据库没法演示 → 用户/PM 无法给你反馈
- API 设计基于"想象中的 UI" → 真做 UI 时发现 API 缺字段或缺粒度
- 集成阶段才发现设计问题 → 返工成本已经是 9 天之后

**垂直切分把集成风险从"9 天后一次性暴露"变成了"每 3 天暴露一个小问题"。**

---

## 核心方法

### DDD、OpenSpec、垂直切分三者的关系

这是最容易混淆的地方。三者不是替代关系，而是**三个维度的协同**：

```
DDD（领域驱动设计）
  │  回答：系统有哪些业务领域？每个领域的边界在哪？
  │  产出：限界上下文、聚合根、通用语言
  │
  ▼
OpenSpec（规范驱动开发）
  │  回答：每个需求的规范怎么写？怎么管理变更？
  │  产出：spec.md + design.md + tasks.md + Delta 归档
  │
  ▼
垂直切分（任务分解策略）
  │  回答：一个需求对应几个 Spec？每个 Spec 多厚？
  │  产出：多个小 Spec，每个 Spec 是一个垂直切片
  │
  ▼
交付：小步快跑，独立交付，快速反馈
```

**具体来说**：

| 概念 | 角色 | 输入 | 输出 | 与垂直切分的关系 |
|------|------|------|------|----------------|
| **DDD** | 业务建模层 | 业务需求 | 限界上下文、聚合根 | DDD 告诉你**"这是两个独立的领域"**（如订单域 vs 支付域）→ 天然就是两个垂直切片组 |
| **OpenSpec** | 规范管理层 | DDD 的领域划分 | spec.md / design.md / tasks.md | OpenSpec 提供**"每个切片怎么写"**的模板和归档机制 |
| **垂直切分** | 实施策略层 | DDD 的领域 + OpenSpec 的模板 | 多个可独立交付的小 Spec | 决定**"一个领域拆成几个 Spec"**，每个 Spec 穿过所有技术层 |

### 实际例子：订单管理系统

#### Step 1: DDD 建模

```
限界上下文识别：
  ├── 订单上下文（核心域）
  │     聚合根：Order（管理 OrderItem、Address、Payment）
  │     领域服务：OrderService.submitOrder() / cancelOrder()
  │
  ├── 商品上下文（支撑域）
  │     聚合根：Product
  │
  └── 支付上下文（支撑域）
        聚合根：Payment
```

DDD 告诉你：**订单、商品、支付是三个独立的限界上下文**，各自有独立的聚合根。这意味它们天然可以独立开发。

#### Step 2: Spec 级垂直切分

在 DDD 划分的**订单上下文**内部，进一步按用户价值做垂直切分：

```
openspec/changes/
├── slice-1-create-order/
│   ├── spec.md          ← 1 个 Requirement（Create Order）
│   ├── design.md        ← 技术方案（含深层模块要求）
│   └── tasks.md         ← 贯穿所有层，3 天
│
├── slice-2-list-orders/
│   ├── spec.md          ← 1 个 Requirement（List Orders）
│   ├── design.md
│   └── tasks.md
│
└── slice-3-cancel-order/
    ├── spec.md          ← 1 个 Requirement（Cancel Order）
    ├── design.md
    └── tasks.md
```

每个 Spec 只包含 1 个 Requirement，每个 tasks.md 按垂直切片组织（而非按技术层）。

#### Step 3: tasks.md 按垂直切片组织

```markdown
# tasks.md（Slice 1: 创建订单）

## 1.1 数据库层
- [ ] 1.1 创建 Order 和 OrderItem 表
  - 预估工时: 2h

## 1.2 后端 API 层  
- [ ] 1.2 实现 OrderService.submitOrder()
  - 前置依赖: 1.1
  - 深层模块检查：接口方法数 ≤ 5 个

## 1.3 前端层
- [ ] 1.3 创建 OrderForm 组件
  - 前置依赖: 1.2

## 1.4 测试
- [ ] 1.4 完整测试覆盖（单元 + 集成 + E2E）
  - 前置依赖: 1.3

### Slice 1 验收标准
- [ ] 用户可提交包含多个商品的订单
- [ ] 订单状态初始化为 "pending"
- [ ] 所有测试通过
```

### 深层模块（Deep Module）：垂直切片的架构质量配速

垂直切片解决"交付效率"，但每个切片内部的代码质量还需要另一个概念来保障——**深层模块**。

```
深层模块 = 小接口 + 大实现 = 高杠杆

✅ 好的深层模块：
interface OrderService {
    submitOrder(dto: SubmitOrderRequest): OrderResult;   // 2 个方法
    cancelOrder(id: String, reason: String): void;
}
// 内部封装了验证、计算、库存检查、通知等全部复杂逻辑
// 调用者只需知道 2 个方法

❌ 坏的浅层模块：
interface OrderValidator {
    validateId(id: String): boolean;          // 10 个方法
    validateItems(items: List<OrderItem>): boolean;
    // ...每个方法只有一行代码
}
// 调用者需要了解所有 10 个方法才能正确使用
```

**判断标准——删除测试（Deletion Test）**：想象删除这个模块——
- 如果复杂度消失了（只是透传层）→ 浅层，应删除或合并
- 如果复杂度重现到 N 个调用者 → 深层，有价值，保留

---

## 其他开源项目怎么说？

| 项目 | 对垂直切分/模块粒度的态度 | 与 AK47 的差异 |
|------|------------------------|--------------|
| **[mattpocock/skills](https://github.com/mattpocock/skills)** | TDD 中提出"tracer bullet"（先打穿完整路径）；架构改进中提出"Deep Module"概念和"Deletion Test" | 聚焦个人编码，未延伸到 Spec 级别的垂直切分 |
| **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** | 倡导"small, incremental changes"，每个 Change 应该是 3-5 天的小变更 | 提供了框架但未定义"多小算小"的量化标准，也未与 DDD 的限界上下文挂钩 |
| **[spec-kit](https://github.com/github/spec-kit)** | 宪法层 + Spec 层的层级体系，支持 Spec 间依赖 | Spec 层级偏重，未强调"每个 Spec 可独立交付"的约束 |
| **[Superpowers](https://github.com/obraia/superpowers)** | 微任务拆分（2-5 分钟），子 Agent 独立执行，避免上下文污染 | 聚焦 Task 级别切片，未上升到 Spec 级别 |

**AK47 的做法**：把垂直切分从"Task 级的技巧"升级为"Spec 级的设计原则"，并建立了 DDD（领域边界）→ OpenSpec（规范框架）→ 垂直切分（粒度策略）的三层协同模型。

---

## 对比其他方案

| 方案 | 交付速度 | 集成风险 | 可并行性 | 适用场景 |
|------|---------|---------|---------|---------|
| **Spec 级垂直切分（推荐）** | 快（3 天一个 Slice） | 低（每次只集成一个薄片） | 高（多 Slice 可并行） | 中大型功能、多人/多 Agent 协作 |
| **Task 级垂直切分（不切 Spec）** | 中（一个大 Spec 内含垂直 Task） | 中（Spec 整体才合并） | 低（一个人从头做到尾） | 单人开发的中等复杂度功能 |
| **水平切分（按技术层）** | 慢（最后才集成） | 高（集成时才暴露问题） | 中（DB/API/UI 各自可并行但有依赖） | 不推荐 |
| **不切分（一个大 Spec）** | 慢（9 天一次性交付） | 高 | 无 | 极简单的脚本/原型 |

---

## 落地检查清单

### Spec 设计时检查
- [ ] 当前 Spec 是否只包含 1 个 Requirement？
- [ ] 这个 Spec 完成后能否**独立演示**给用户？
- [ ] 这个 Spec 能否**独立合并**到主分支而不破坏已有功能？
- [ ] 工期是否在 3 天以内？超过 3 天应继续拆分。

### 与 DDD 对齐检查
- [ ] 这个 Spec 是否完全落在**一个限界上下文**内部？
- [ ] 如果跨了多个限界上下文，是否已拆分？（跨上下文的 Spec 耦合度高）
- [ ] 聚合根是否正确定义（一个 Spec 只有一个聚合根入口）？

### 与 OpenSpec 对齐检查
- [ ] 每个 Slice 是否有独立的 spec.md + design.md + tasks.md？
- [ ] tasks.md 是否按垂直切片组织（跨所有层），而非按技术层组织？
- [ ] tasks.requires 是否正确指向了前置 Slice 的 spec.md？

### 深层模块检查
- [ ] 核心模块接口方法数 ≤ 5 个？
- [ ] 运行过删除测试（Deletion Test）确认模块有价值？

---

## 延伸阅读

- [01 四大工程纪律](01-four-core-disciplines.md) — DDD（领域建模）是垂直切分的上游输入
- [04 Agent 分工决策方法论](04-agent-task-delegation.md) — 垂直切片是子 Agent 并行开发的前置条件
- 原始经验：[BP-vertical-slice-and-deep-module.md](../../.ak47/experiences/best-practices/BP-vertical-slice-and-deep-module.md) — 完整 603 行，含全部切片策略与深层模块检查清单
- Skill 定义：[ak47-skill-vertical-slicing](../../templates/qoder/skills/engineering/ak47-skill-vertical-slicing/SKILL.md)
- 灵感来源：[mattpocock/skills](https://github.com/mattpocock/skills) — TDD 中的垂直切片 + 架构改进中的深层模块
