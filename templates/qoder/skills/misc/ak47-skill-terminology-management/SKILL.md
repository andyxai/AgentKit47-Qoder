---
name: ak47-skill-terminology-management
description: "ak47 Terminology Management Skill,基于 CONTEXT.md 统一领域语言,实时校正术语冲突"
---

# Terminology Management Skill

## 用途

维护 CONTEXT.md、统一 Ubiquitous Language、实时校正术语冲突。

**核心机制**：
- 基于 CONTEXT.md（单一文档）
- 懒加载创建（第一次识别术语时）
- 实时更新（术语解决后立即写入）
- AI 主动校正（发现冲突即时指出）

---

## 使用方式

### 1. 懒加载创建

**触发条件**: AI 第一次识别到业务术语

**流程**:
1. 用户提到业务术语（如 "Order"）
2. AI 检查 CONTEXT.md 是否存在
3. 不存在 → 创建并添加定义
4. 已存在 → 检查术语是否已定义

### 2. 实时术语校正

**当 AI 发现术语使用时**:
1. 检查 CONTEXT.md 定义
2. 不一致 → 立即指出："你说 'account' — 是指 Customer（客户）还是 User（用户）？"
3. 用户澄清 → 立即更新 CONTEXT.md

### 3. 持续维护

- 新术语识别后立即添加到 CONTEXT.md
- 发现术语冲突立即记录到 Flagged Ambiguities
- 保持定义简洁（一句话最大）
- 只包含项目特定术语（不包含通用编程概念）

---

## 术语处理规则

### 1. 业务术语（中英文对照）

**适用**：Order、Customer、Product、Invoice 等项目特定业务概念。

**格式**：
```markdown
**Order（订单）**: Definition in English
_Avoid_: Cart, transaction, purchase
```

**规则**：
- ✅ 术语名：英文 + 中文括号（Order（订单））
- ✅ 定义：用英文（保持精确性）
- ✅ Avoid：列出所有中文别名（购物车、交易、购买）
- ✅ 代码中使用英文（order、customer）
- ✅ 文档/对话中使用英文 + 中文（Order/订单）

**示例**：
```
✅ "创建 Order（订单）"
✅ "Order（订单）包含多个 OrderItem（订单项）"
❌ "创建订单"（纯中文，代码不一致）
❌ "创建 Order"（缺少中文，对团队不友好）
```

---

### 2. DDD 术语（保持英文）

**适用**：Aggregate、Entity、Value Object、Domain Event、Bounded Context、Repository 等 DDD 标准术语。

**格式**：
```markdown
**Aggregate**: Definition in English
_Avoid_: 聚合（不要翻译）
```

**规则**：
- ✅ 术语名：纯英文（Aggregate）
- ✅ 定义：用英文
- ✅ Avoid：明确标注"不要翻译"
- ✅ 代码中使用英文（OrderAggregate）
- ✅ 文档/对话中使用英文（Order Aggregate）
- ❌ 不要翻译成中文（聚合、实体、值对象）

**为什么保持英文**：
- DDD 术语是行业标准，翻译后失去精确性
- "聚合" 无法传达 Aggregate 的完整含义
- 团队学习 DDD 时需要使用英文原版资料
- 代码中必须使用英文（OrderAggregate vs 订单聚合）

**示例**：
```
✅ "Order Aggregate 维护一致性边界"
✅ "User 是一个 Entity"
✅ "Money 是 Value Object"
❌ "订单聚合维护一致性边界"（翻译后不精确）
❌ "用户是一个实体"（"实体" 含义模糊）
```

---

### 3. 技术术语（保持英文）

**适用**：API、HTTP、REST、GraphQL、JWT、OAuth、Database Schema 等通用技术概念。

**规则**：
- ✅ 保持英文（API、HTTP、JWT）
- ✅ 不需要添加到 CONTEXT.md（AI 已知）
- ❌ 不要翻译（应用程序接口、超文本传输协议）

**示例**：
```
✅ "调用 Order API"
✅ "使用 JWT 认证"
❌ "调用订单应用程序接口"
❌ "使用 JSON Web 令牌"
```

---

### 4. 通用编程概念（不添加）

**适用**：timeout、error handler、callback、loop、function 等通用概念。

**规则**：
- ❌ 不添加到 CONTEXT.md
- ❌ 不是项目特定术语
- ✅ 代码和文档中保持英文

---

### 快速判断矩阵

| 术语类型 | 示例 | 格式 | 添加到 CONTEXT.md | 翻译 |
|---------|------|------|------------------|------|
| **业务术语** | Order、Customer | Order（订单） | ✅ 必须 | ✅ 中英文对照 |
| **DDD 术语** | Aggregate、Entity | Aggregate | ✅ 建议 | ❌ 保持英文 |
| **技术术语** | API、JWT | API | ❌ 不需要 | ❌ 保持英文 |
| **通用概念** | timeout、callback | timeout | ❌ 不添加 | ❌ 保持英文 |

---

## 输出格式

参考 `templates/qoder/CONTEXT.md` 模板。

## 红线

- ❌ 未定义术语直接在代码或文档中使用
- ❌ 同一 Term 在同一个 Context 中有多个含义
- ❌ 发现术语冲突不记录、不解决
- ❌ CONTEXT.md 与实际代码/文档不一致
- ❌ 使用 Hook 自动触发术语更新（必须 AI 智能判断）
- ❌ 预生成空 CONTEXT.md（必须懒加载）
- ❌ 包含通用编程概念（只保留项目特定术语）
- ❌ 翻译 DDD 术语（必须保持英文）
