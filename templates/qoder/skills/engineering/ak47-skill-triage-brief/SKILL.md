---
name: ak47-skill-triage-brief
version: 0.1.0
description: "任务简报 - 为 Agent 生成结构化任务说明，明确目标/范围/交付物"
---

# ak47-skill-triage-brief

**分类**: 需求管理
**类型**: 流程
**优先级**: 🟡 推荐
**触发时机**: 需求评估时

---

## 定义

结构化需求评估技能，生成 Agent Brief 并管理 Out-of-Scope 知识库。

---

## 何时使用

### 必须使用

- ✅ 需求定义完成后（requirements-definition）
- ✅ critical-review 审核通过后
- ✅ 评估功能是否在项目范围内
- ✅ 需要明确任务边界

### 触发场景

**用户说**：
- "这个功能做不做？"
- "帮我评估一下这个需求"
- "这个需求在范围内吗？"
- "生成一个 Agent Brief"
- "为什么不做 XXX？"

---

## 🚫 Pre-check：禁止 AI 跳过 Brief（硬规则）

> **新增于 2026-05-14**，解决 Brief 遗漏问题——AI 自行判断"不需要 Brief"直接跳过且不提示用户。
> **配套**: `.qoder/rules/workflow-state.md`「Brief 门禁」+ `.ak47/workflow-rules.yaml` `brief-generation-gate`

**触发条件**: tasks.md 全部完成，变更规模满足 Brief 生成条件（工作量 > 2h / 跨模块 ≥ 2 / 文件数 > 3 / 接口变更）。

### 强制行为

1. 若变更规模超过阈值 → 必须调用 `ak47-skill-triage-brief` 生成 Brief
2. ❌ 禁止 AI 自行判断"不需要 Brief"直接跳过
3. ❌ 禁止 AI 跳过 Brief 不提示用户
4. ❌ 禁止 AI 跳过 Brief 不记录偏离
5. 跳过 Brief 必须：a) 说明原因；b) 用户明确批准；c) 记录到 `.ak47/deviations.log`

### 正确做法

```
> "当前变更符合 Agent Brief 生成条件（task 数 > 10 / 跨模块 ≥ 2 / 文件数 > 3）。
>  正在调用 ak47-skill-triage-brief 生成 Agent Brief…"
```

### 错误做法（红线）

```
> "这个变更不太复杂，不需要 Brief，直接进入审查吧。"
```
↑ 这是在绕过 Brief 门禁——AI 自行判断复杂度并跳过流程。

### 跳过条件

**仅以下情况可跳过**（需记录偏离 + 用户批准）：
- 纯缺陷修复（L3 范式）
- 变更规模明确不满足阈值（单文件、< 1h）
- 用户主动声明"本次不需要 Brief"

**不可跳过**：
- AI 自行判断"改动简单"
- AI 认为"已经说得够清楚了"
- AI 省略提示直接跳过

---

## 核心概念

### Agent Brief

结构化的任务说明，确保 AI 子 Agent 有清晰的上下文。

**包含**：
- Category（bug/enhancement）
- Summary（1-2 句话）
- Current behaviour（当前行为）
- Desired behaviour（期望行为）
- Key interfaces（核心接口）
- Acceptance criteria（验收标准）
- Out of scope（明确排除）
- Reference files（参考文件）

**价值**：
- ✅ 需求清晰，减少误解
- ✅ 边界明确，避免范围蔓延
- ✅ 可验证，有验收标准

### Out-of-Scope 知识库

持久化记录被拒绝的功能请求。

**位置**: `.ak47/out-of-scope/*.md`

**价值**：
- ✅ 避免重复讨论
- ✅ 保持决策一致性
- ✅ 记录决策理由

---

## 工作流程

### Phase 1: 评估需求

1. 读取需求描述
2. 检查 `.ak47/out-of-scope/` 是否有相关记录
3. 评估是否在项目范围内

### Phase 2: 决策

**在范围内**：
→ 生成 Agent Brief

**不在范围内**：
→ 创建 Out-of-Scope 记录
→ 告知用户并说明理由

### Phase 3: 生成 Brief（在范围内）

1. 填写 Brief 模板
2. 确保 Acceptance criteria 可验证
3. 明确 Out of scope
4. **执行信息损失校验**（关键！）
5. 展示 Brief 给用户确认

### Phase 3.5: 信息损失校验（关键步骤）

**目标**：确保 Brief 生成过程中没有丢失需求文档的关键信息

**校验流程**：

#### 步骤 1：提取需求文档的关键信息点

从需求文档中提取以下信息点清单：

```markdown
需求文档关键信息清单：
1. 功能需求列表（P0/P1/P2）
2. 成功标准（具体指标值）
3. 约束条件（技术、安全、合规）
4. 边界情况（已识别的所有边界）
5. Out of scope（明确不做的功能）
6. 关键业务规则（如审批金额分级）
7. 集成要求（必须对接的系统）
8. 性能要求（响应时间、并发数）
9. 数据要求（数据量、存储格式）
10. 术语定义（CONTEXT.md 中的相关术语）
```

#### 步骤 2：逐项检查 Brief 是否覆盖

对每个信息点进行检查：

```markdown
信息点覆盖检查表：

| # | 信息点类型 | 需求文档内容 | Brief 中是否有 | 是否关键 | 缺失风险 |
|---|-----------|------------|-------------|---------|---------|
| 1 | P0 功能需求 | 用户注册 | ✅ 有 | 是 | 无 |
| 2 | P1 功能需求 | OAuth2 登录 | ✅ 有 | 是 | 无 |
| 3 | 成功标准 | 响应时间 < 200ms | ✅ 有（Constraints） | 是 | 无 |
| 4 | 约束条件 | GDPR 合规 | ✅ 有（含原因） | 是 | 无 |
| 5 | 边界情况 | 忘记密码流程 | ❌ 缺失 | 是 | 🔴 高 |
| 6 | Out of scope | 短信登录 | ✅ 有 | 是 | 无 |
| 7 | 业务规则 | 审批金额分级 | ❌ 缺失 | 是 | 🔴 高 |
| 8 | 集成要求 | 物流系统接口 | ❌ 缺失 | 否 | 🟡 中 |
```

#### 步骤 3：评估缺失风险

**风险等级定义**：

- 🔴 **高风险**：AI 实施可能错误
  - 关键业务规则缺失
  - 边界情况处理策略缺失
  - Out of scope 不完整
  
- 🟡 **中风险**：AI 可能遗漏部分功能
  - P1/P2 功能需求缺失
  - 集成要求缺失
  - 性能指标缺失
  
- 🟢 **低风险**：不影响实施，只是上下文缺失
  - 背景讨论细节
  - 用户画像描述
  - 替代方案分析

#### 步骤 4：处理高风险和中风险缺失

**规则**：

- 🔴 **高风险缺失** → **必须补充到 Brief**
- 🟡 **中风险缺失** → 询问用户是否需要补充
- 🟢 **低风险缺失** → 可接受（有意精简）

**操作**：

```markdown
如果检测到高风险缺失：
1. 自动补充到 Brief 的对应部分
2. 标记"此内容从需求文档自动补充"
3. 继续校验直到无高风险缺失

如果检测到中风险缺失：
1. 向用户展示缺失清单
2. 询问："以下中风险信息点未在 Brief 中，是否需要补充？"
3. 根据用户决定补充或跳过
```

#### 步骤 5：生成校验报告

**格式**：

```markdown
## Brief 信息损失校验报告

**需求文档**: docs/requirements/2026-05-11-user-auth-requirements.md
**Brief**: .ak47/briefs/user-authentication.md
**校验时间**: 2026-05-11 14:30

### 统计
- 信息点总数: 10
- 已覆盖: 7 (70%)
- 高风险缺失: 0 ✅
- 中风险缺失: 1 ⚠️
- 低风险缺失: 2 ℹ️

### 高风险缺失（已自动补充）
无

### 中风险缺失（待用户确认）
1. 集成要求：物流系统接口
   - 需求文档："必须对接物流系统的订单拦截接口"
   - Brief 状态：未包含
   - 建议：补充到 Key interfaces
   - 用户决定：[待确认]

### 低风险缺失（可接受）
1. 背景讨论：用户调研数据（80% 用户希望邮箱注册）
2. 替代方案分析：为什么选择 JWT 而非 Session

### 校验结论
✅ 通过（无高风险缺失，中风险待用户确认）
```

---

### Phase 4: 创建 Out-of-Scope 记录（不在范围内）

1. 填写 Out-of-Scope 模板
2. 详细说明拒绝理由
3. 提供替代方案
4. 保存到 `.ak47/out-of-scope/<feature-name>.md`
5. 告知用户

---

## 与 OpenSpec 的关系

### 定位差异

| 维度 | Agent Brief | OpenSpec Spec |
|------|------------|---------------|
| **关注点** | What（做什么） | How（如何设计） |
| **内容** | 需求摘要、验收标准、边界 | 技术方案、接口设计、数据模型 |
| **受众** | AI Agent（实施者） | 开发人员 + AI Agent |
| **生成时机** | 需求批准后 | Brief 确认后 |
| **存储位置** | `.ak47/briefs/` | `openspec/specs/` |

### 协作流程（完整版）

```
需求宪法文档
  ↓
triage-brief 生成 Brief
  ↓ 关注 What + Acceptance
  ↓
Brief 用户确认
  ↓
openspec-propose 生成 Spec
  ↓ 关注 How + Design
  ↓
Spec 用户确认
  ↓
⭐ 原型验证（可选，用于复杂变更）
  ├─ 验证 design.md 的设计决策
  ├─ 验证 specs/ 的需求可行性
  └─ 记录到 NOTES.md
  ↓
基于原型结论更新 Spec（如果需要）
  ↓
实施阶段（基于验证过的 Brief + Spec）
```

**原型是可选的**：
- 简单变更：Spec 确认后直接实施
- 复杂变更：Spec 确认后，原型验证，再实施

### 关键原则

1. **Brief 是 Spec 的前置**：Spec 必须引用对应的 Brief
2. **Brief 不变，Spec 可变**：Brief 是需求基线，Spec 是技术实现（可调整）
3. **Brief 简短，Spec 详细**：Brief 1-2 页，Spec 可多页
4. **Brief 用户语言，Spec 技术语言**：Brief 用业务术语，Spec 用技术术语

### 示例关系

**Brief**（`.ak47/briefs/user-authentication.md`）：
```markdown
Summary: 实现用户登录功能，支持邮箱/密码和 OAuth2
Acceptance: Given 用户输入正确凭证，When 点击登录，Then 成功跳转首页
Out of scope: 不支持短信登录、不支持多因素认证
```

**Spec**（`openspec/specs/user-authentication/`）：
```markdown
- spec.md: JWT token 设计、OAuth2 流程、数据库表结构
- tasks.md: 实施任务分解（10 个 task）
- design.md: 时序图、类图、错误处理策略
```

---

## 决策矩阵

### 范围评估

| 条件 | 决策 | 说明 |
|------|------|------|
| **符合项目定位** | In-Scope | 生成 Agent Brief |
| **超出项目定位** | Out-of-Scope | 记录理由 |
| **破坏架构** | Out-of-Scope | 说明原因 |
| **维护成本过高** | Out-of-Scope | 量化成本 |
| **有替代方案** | Out-of-Scope | 引导到替代方案 |

### Brief 质量检查

| 检查项 | 标准 |
|--------|------|
| **Summary** | 1-2 句话能说清楚 |
| **Current/Desired** | 行为对比清晰 |
| **Acceptance criteria** | 可验证（非主观） |
| **Out of scope** | 明确排除边界 |
| **Reference files** | 路径准确 |

---

## AI 标记

所有 AI 生成的评论和 Brief **必须**标注来源：

```
> *This brief was generated by AI during triage.*
```

或中文：

```
> *此 Brief 由 AI 在需求评估时生成。*
```

---

## 与 requirements-grilling 的关系

```
需求提出
  ↓
requirements-grilling（盘问澄清）
  ↓
需求清晰？
  ├─ 是 → triage-brief（生成 Brief）
  └─ 否 → 继续盘问
  ↓
Brief 确认
  ↓
实施
```

**区别**：
- **requirements-grilling**: 盘问澄清，确保理解需求
- **triage-brief**: 结构化记录，确保需求可执行

---

## 使用示例

### 示例 1: 评估新功能

**用户**: "我想添加 Web UI 支持"

**AI**:
1. 检查 `.ak47/out-of-scope/` → 发现 `no-gui-support.md`
2. 告知用户："此功能已被拒绝，原因是..."
3. 提供替代方案："建议通过 IDE 集成实现"

### 示例 2: 生成 Brief

**用户**: "修复模板路径解析的 Windows 兼容问题"

**AI**:
1. 评估 → 在范围内（Bug 修复）
2. 生成 Agent Brief
3. 展示 Brief 确认：
   ```markdown
   # Agent Brief: 修复模板路径解析的 Windows 兼容问题
   
   ## Category
   bug
   
   ## Summary
   模板渲染在 Windows 下路径解析失败...
   
   ## Acceptance criteria
   - [ ] Windows 下路径解析正确
   - [ ] Linux 下路径解析正确
   - [ ] 所有测试通过
   ```
4. 等待用户确认

### 示例 3: 记录 Out-of-Scope

**用户**: "支持 GUI"

**AI**:
1. 评估 → 不在范围内（超出项目定位）
2. 创建 `.ak47/out-of-scope/no-gui-support.md`
3. 告知用户：
   ```
   此功能不在 ak47 范围内。
   
   原因：
   - ak47 是 CLI 工具，不是最终用户工具
   - 会增加大量复杂度
   
   替代方案：
   - 通过 IDE 集成提供类似体验
   ```

---

## 参考

- **Brief 模板**: [agent-brief-template.md](../../../../ak47/templates/agent-brief-template.md)
- **Out-of-Scope 模板**: [out-of-scope-template.md](../../../../ak47/templates/out-of-scope-template.md)
- **需求盘问**: [ak47-skill-requirements-grilling](../ak47-skill-requirements-grilling/SKILL.md)

---

## 版本历史

- **v1.0** (2026-05-08): 初始版本，精简版借鉴 mattpocock-skills 的 triage Skill
