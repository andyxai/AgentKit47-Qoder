# 接口可测试性设计

好的接口使测试自然:

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
