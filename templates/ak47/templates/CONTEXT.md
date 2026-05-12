# {Project Name} Domain Context

> **维护者**: 主Agent（实时更新）  
> **策略**: 懒加载创建，术语解决后立即更新

---

## Language

### 业务术语（中英文对照）

**{术语英文名}（{术语中文名}）**:
{用英文定义，保持精确性}
_Avoid_: {英文别名1}, {英文别名2}, {中文别名1}

**使用示例**：

```markdown
**Order（订单）**:
A customer's purchase request containing one or more OrderItems.
_Avoid_: Cart, transaction, purchase, 购物车, 交易

**Customer（客户）**:
A person or organization that places Orders.
_Avoid_: Client, buyer, account, user, 买家, 账户
```

---

## Relationships

- 一个 **{术语1}** {动词} 零个或多个 **{术语2}**
- 一个 **{术语2}** {动词} 恰好一个 **{术语3}**

**使用示例**：

```markdown
- 一个 **Customer（客户）** 可以下零个或多个 **Order（订单）**
- 一个 **Order（订单）** 包含一个或多个 **OrderItem（订单项）**
```

---

## Flagged Ambiguities

- "{模糊术语}" 曾经同时表示 **{术语1}** 和 **{术语2}** — 已解决：这是两个不同的概念

**使用示例**：

```markdown
- "account" 曾经同时表示 **Customer（客户）** 和 **User（用户）** — 已解决：这是两个不同的概念
```
