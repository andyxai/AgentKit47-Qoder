# 好测试与坏测试

## 好测试

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

## 坏测试

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

```typescript
// ❌ 坏测试: 绕过接口验证
test("createUser 保存到数据库", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// ✅ 好测试: 通过接口验证
test("createUser 使用户可检索", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
