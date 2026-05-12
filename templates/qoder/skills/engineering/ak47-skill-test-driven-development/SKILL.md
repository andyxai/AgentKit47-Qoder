---
name: ak47-skill-test-driven-development
version: 1.0.0
description: "测试驱动开发 - 在实施任何功能或错误修复时,在编写实施代码之前使用。融合 mattpocock 垂直切片理念与行为测试原则。"
---

# 测试驱动开发 (Test-Driven Development)

**核心原则**: 测试应通过公共接口验证行为,而非实现细节。代码可以完全重写,测试不应改变。

**融合来源**: Superpowers TDD + mattpocock-skills/tdd

---

## 哲学

### 好测试的特征

**集成风格**: 通过真实接口测试,而非 mock 内部组件。

```typescript
// ✅ 好测试: 测试可观察行为
test("用户可以使用有效购物车结账", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

特征:
- 测试用户/调用者关心的行为
- 仅使用公共 API
- 能经受内部重构
- 描述 WHAT,而非 HOW
- 每个测试一个逻辑断言

### 坏测试的特征

**实现细节测试**: 耦合到内部结构。

```typescript
// ❌ 坏测试: 测试实现细节
test("checkout 调用 paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

警告信号:
- Mock 内部协作者
- 测试私有方法
- 断言调用次数/顺序
- 重构时测试失败但行为未变
- 测试名描述 HOW 而非 WHAT
- 通过外部手段验证而非接口

---

## 反模式: 水平切片

**❌ 禁止先写所有测试,再写所有实现。** 这是"水平切片"——把 RED 当作"写所有测试",GREEN 当作"写所有代码"。

这会产生**垃圾测试**:

- 批量写的测试测试的是*想象*的行为,不是*实际*的行为
- 最终测试的是事物的*形状*(数据结构、函数签名),而非用户Facing行为
- 测试对真实变化不敏感——行为坏了测试还过,行为正常测试却失败
- 在理解实现之前就锁定了测试结构

**✅ 正确做法**: 通过示踪子弹 (Tracer Bullet) 垂直切片。一个测试 → 一个实现 → 循环。每个测试响应上一个周期的学习成果。因为刚写完代码,你确切知道什么行为重要以及如何验证。

```
❌ 错误 (水平):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

✅ 正确 (垂直):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

---

## 工作流

### 1. 规划 (Planning)

探索代码库时,使用项目的领域术语表,使测试名称和接口词汇匹配项目语言,并遵守相关 ADR。

**编写任何代码前**:

- [ ] 与用户确认需要什么接口变更
- [ ] 与用户确认要测试哪些行为 (优先级排序)
- [ ] 识别深度模块机会 (小接口,深实现)
- [ ] 为可测试性设计接口
- [ ] 列出要测试的行为 (不是实现步骤)
- [ ] 获得用户对计划的批准

**问**: "公共接口应该长什么样?哪些行为最重要需要测试?"

**你无法测试所有内容。** 与用户确认哪些行为最关键。聚焦测试精力在关键路径和复杂逻辑上,而非每个可能的边界情况。

### 2. 示踪子弹 (Tracer Bullet)

写**一个**测试来确认系统的**一件事**:

```
RED:   写第一个行为的测试 → 测试失败
GREEN: 写最小代码使其通过 → 测试通过
```

这是你的示踪子弹——证明端到端路径可行。

### 3. 增量循环 (Incremental Loop)

对每个剩余行为:

```
RED:   写下一个测试 → 失败
GREEN: 最小代码使其通过 → 通过
```

**规则**:
- 一次一个测试
- 只写足够通过当前测试的代码
- 不要预期未来测试
- 保持测试聚焦可观察行为

### 4. 重构 (Refactor)

所有测试通过后,寻找重构候选:

- [ ] 提取重复代码
- [ ] 深化模块 (将复杂性移到简单接口后面)
- [ ] 在自然处应用 SOLID 原则
- [ ] 考虑新代码揭示了现有代码的什么问题
- [ ] 每步重构后运行测试

**❌ RED 时绝不重构。** 先到 GREEN。

---

## Mock 使用原则

### 仅在系统边界 Mock

**应该 Mock**:
- 外部 API (支付、邮件等)
- 数据库 (有时 - 优先使用测试数据库)
- 时间/随机数
- 文件系统 (有时)

**❌ 不要 Mock**:
- 自己的类/模块
- 内部协作者
- 你控制的任何东西

### 可 Mock 性设计

**1. 使用依赖注入**

传入外部依赖而非内部创建:

```typescript
// ✅ 易于 Mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// ❌ 难以 Mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. 优先 SDK 风格接口而非通用 Fetcher**

为每个外部操作创建特定函数,而非一个带条件逻辑的通用函数:

```typescript
// ✅ 好: 每个函数可独立 Mock
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// ❌ 坏: Mock 需要条件逻辑
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

---

## 接口可测试性设计

**1. 接受依赖,不创建依赖**

```typescript
// ✅ 可测试
function processOrder(order, paymentGateway) {}

// ❌ 难测试
function processOrder(order) {
  const gateway = new StripeGateway();
}
```

**2. 返回结果,不产生副作用**

```typescript
// ✅ 可测试
function calculateDiscount(cart): Discount {}

// ❌ 难测试
function applyDiscount(cart): void {
  cart.total -= discount;
}
```

**3. 小表面积**
- 方法越少 = 需要的测试越少
- 参数越少 = 测试设置越简单

---

## 深度模块设计

**深度模块** = 小接口 + 大量实现

```
┌─────────────────────┐
│   小接口            │  ← 方法少,参数简单
├─────────────────────┤
│                     │
│   深实现            │  ← 复杂逻辑隐藏
│                     │
└─────────────────────┘
```

**浅模块** = 大接口 + 少量实现 (避免)

```
┌─────────────────────────────────┐
│       大接口                    │  ← 方法多,参数复杂
├─────────────────────────────────┤
│  薄实现                         │  ← 只是传递
└─────────────────────────────────┘
```

设计接口时问:
- 能减少方法数量吗?
- 能简化参数吗?
- 能隐藏更多复杂性吗?

---

## 重构候选

TDD 循环后,寻找:

- **重复** → 提取函数/类
- **长方法** → 拆分为私有辅助 (测试保持在公共接口)
- **浅模块** → 合并或深化
- **特性嫉妒** → 将逻辑移到数据所在处
- **基本类型执念** → 引入值对象
- **新代码揭示的现有代码问题**

---

## 每个循环的检查清单

```
[ ] 测试描述行为,而非实现
[ ] 测试仅使用公共接口
[ ] 测试能经受内部重构
[ ] 代码对当前测试是最小的
[ ] 没有添加投机功能
```

---

## 配套文档

- **好测试与坏测试示例**: [tests.md](tests.md)
- **深度模块设计**: [deep-modules.md](deep-modules.md)
- **接口可测试性**: [interface-design.md](interface-design.md)
- **Mock 使用原则**: [mocking.md](mocking.md)
- **重构候选清单**: [refactoring.md](refactoring.md)

---

**版本**: 1.0.0  
**融合**: Superpowers TDD + mattpocock-skills/tdd  
**核心改进**: 垂直切片 + 行为测试 + 用户确认循环 + 深度模块
