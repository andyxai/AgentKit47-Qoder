# 项目领域上下文

> **维护者**: 主 Agent（渐进式填充）
> **策略**: 初始为空白模板，术语/关系解决后立即更新，避免一次性填满占位符
> **创建规则**: 仅在确实有业务术语需要固化时才填入，否则保持空白

---

## 📘 Language（业务术语中英文对照）

> **格式**:
>
> ```
> **<EnglishName>（<中文名>）**:
> <英文精确定义>
> _Avoid_: <别名1>, <别名2>, <中文别名1>
> ```
>
> **示例**:
>
> ```
> **Order（订单）**:
> A customer's purchase request containing one or more OrderItems.
> _Avoid_: Cart, transaction, purchase, 购物车, 交易
>
> **Customer（客户）**:
> A person or organization that places Orders.
> _Avoid_: Client, buyer, account, user, 买家, 账户
> ```

<!-- 在此处按需追加术语 -->

---

## 🔗 Relationships（领域关系）

> **格式**: `- 一个 <术语A> <动词> 零个/一个/多个 <术语B>`
>
> **示例**:
>
> ```
> - 一个 Customer（客户）可以下零个或多个 Order（订单）
> - 一个 Order（订单）包含一个或多个 OrderItem（订单项）
> ```

<!-- 在此处按需追加关系 -->

---

## ⚠️ Flagged Ambiguities（歧义标记）

> **格式**: `- "<模糊术语>" 曾经同时表示 <A> 和 <B> — 已解决：<决议>`
>
> **示例**:
>
> ```
> - "account" 曾经同时表示 Customer（客户）和 User（用户）— 已解决：这是两个不同的概念
> ```

<!-- 在此处按需追加歧义项 -->

---

## 🧭 维护指引

- 只记录"项目级业务术语"，不记录"编程通用术语"
- 中英对照是为了 AI 生成代码时不乱造变量名
- 每当出现新的核心概念或歧义时立即更新此文档
- 修改完成后，若在 `.ak47/experiences/` 中有对应 ADR，同步更新
