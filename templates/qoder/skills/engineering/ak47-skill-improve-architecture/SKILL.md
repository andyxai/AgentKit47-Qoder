---
name: ak47-skill-improve-architecture
version: 0.1.0
description: "定期架构健康检查，主动控制架构熵增，发现深层模块优化机会"
---

# Improve Codebase Architecture

**定期运行**（建议每 7 天一次），或在调试发现架构问题时触发。

主动发现代码库中的架构熵增，防止代码变成"泥球"（Big Ball of Mud）。

---

## 核心原则

> **Architecture rots slowly, then all at once.**
> 
> 架构腐化是缓慢的，然后突然全面崩溃。

---

## 何时使用

### 定期触发
- ⏰ 每 7 天主动运行一次
- 📅 在大型功能合并后
- 🔄 在重构计划开始前

### 事件触发
- 🐛 调试发现"无正确测试缝"（systematic-debugging Phase 5）
- 📊 代码复杂度指标超标（圈复杂度 > 10）
- 🧪 测试覆盖率下降 > 10%
- ⚠️ `ak47 doctor` 提示架构审查过期

---

## 核心概念

### Module（模块）

有接口和实现的任何单元：
- 类（Class）
- 函数（Function）
- 服务（Service）
- 组件（Component）

### Depth（深度）

接口背后的行为量。

**深层模块**（高杠杆）：
- 接口简单（≤ 5 个方法）
- 内部逻辑复杂（深度比 ≥ 10:1）
- 调用者友好（只需了解少量接口）
- 知识集中（相关逻辑集中在模块内部）

**浅层模块**（低杠杆）：
- 接口复杂（> 10 个方法）
- 内部逻辑简单（深度比 < 5:1）
- 只是透传（getter/setter、delegate）
- 知识分散（调用者需要了解实现细节）

### Seam（接缝）

接口所在位置，可替换实现的点。

**好接缝**：
- 清晰的边界
- 可 mock
- 可替换实现

**坏接缝**：
- 紧耦合
- 全局状态
- 隐式依赖

---

## 工作流程

### Phase 1: 读取上下文

**必须读取**：
1. `.qoder/CONTEXT.md`（领域术语）
2. `.ak47/experiences/decisions/*.md`（架构决策 ADRs）
3. 当前代码库结构

**目标**：理解当前的架构意图和约束。

---

### Phase 2: 探索代码库，记录摩擦点

**检查清单**：

#### 2.1 接口复杂度

| 指标 | 健康 | 警告 | 危险 |
|------|------|------|------|
| **接口方法数** | ≤ 5 个 | 6-10 个 | > 10 个 |
| **参数数量** | ≤ 3 个 | 4-6 个 | > 6 个 |
| **返回值类型** | 单一类型 | Union 类型 | `any` / `unknown` |

**检查方法**：
```bash
# 查找接口方法数 > 10 的类
grep -r "class.*{" src/ | while read line; do
    # 统计方法数
    # 如果 > 10，记录为警告
done
```

#### 2.2 深度比

**计算公式**：
```
深度比 = 内部逻辑行数 / 接口方法数
```

| 深度比 | 判断 | 行动 |
|--------|------|------|
| ≥ 10:1 | 深层模块（健康） | 保持 |
| 5:1 - 10:1 | 中等 | 监控 |
| < 5:1 | 浅层模块（警告） | 考虑合并或删除 |

#### 2.3 测试难度

| 难度等级 | 表现 | 原因 |
|---------|------|------|
| **容易** | 可以轻松 mock 依赖 | 清晰的接缝 |
| **中等** | 需要复杂 setup | 部分耦合 |
| **困难** | 无法隔离测试 | 紧耦合、全局状态 |

#### 2.4 删除测试（Deletion Test）

**核心问题**：
> "想象删除这个模块，复杂度会怎样？"

| 结果 | 判断 | 行动 |
|------|------|------|
| **复杂度消失** | 浅层模块（只是透传） | 删除或合并 |
| **复杂度重现到 N 个调用者** | 深层模块（有价值） | 保留 |
| **复杂度部分消失** | 混合模块 | 拆分 |

**示例**：
```typescript
// ❌ 浅层模块（删除后复杂度消失）
class OrderService {
  constructor(private repo: OrderRepository) {}
  
  async createOrder(data: OrderData) {
    return this.repo.create(data);  // 只是透传
  }
  
  async getOrder(id: string) {
    return this.repo.findById(id);  // 只是透传
  }
}

// ✅ 深层模块（删除后复杂度重现到 N 个调用者）
class OrderValidator {
  async validate(order: OrderData): Promise<ValidationResult> {
    // 50 行验证逻辑
    // - 库存检查
    // - 价格计算
    // - 权限验证
    // - 风控规则
    // ...
  }
}
```

---

### Phase 3: 展示深化机会列表

**输出格式**：

```markdown
## 架构深化机会

### 机会 1: 拆分 OrderService

**涉及文件**:
- `src/services/OrderService.ts` (250 行，15 个接口方法)

**问题**:
- 接口方法数 15 个（健康阈值 ≤ 5）
- 深度比 3:1（健康阈值 ≥ 10:1）
- 测试难度：困难（需要 mock 8 个依赖）
- 删除测试：复杂度部分消失（混合模块）

**建议方案**:
拆分为 3 个深层模块：
1. `OrderCreationService`（创建订单，包含验证逻辑）
2. `OrderCancellationService`（取消订单，包含退款逻辑）
3. `OrderQueryService`（查询订单，包含过滤逻辑）

**预期收益**:
- 接口方法数: 15 → 5 + 4 + 6
- 深度比: 3:1 → 12:1 + 15:1 + 10:1
- 测试难度: 困难 → 容易

**风险**:
- 需要更新 12 个调用点
- 可能需要 2-3 天完成

---

### 机会 2: 删除 UserDelegate

**涉及文件**:
- `src/delegates/UserDelegate.ts` (30 行，5 个接口方法)

**问题**:
- 只是透传 UserRepository
- 深度比 2:1（极浅）
- 删除测试：复杂度完全消失

**建议方案**:
删除 UserDelegate，调用者直接使用 UserRepository

**预期收益**:
- 减少 1 层抽象
- 减少 30 行维护成本
- 简化调用链

**风险**:
- 需要更新 8 个调用点
- 可能需要 1 天完成
```

---

### Phase 4: 用户确认 → Grilling 循环

**展示机会列表后**，对每个候选进入 Grilling 循环：

```
机会 1: 拆分 OrderService

让我挑战一下这个方案：

1. 这个重构真的值得吗？（2-3 天投入）
2. 有没有更简单的方法？（比如只拆分最复杂的方法）
3. 风险是什么？（12 个调用点需要更新）
4. 如果不做会怎样？（继续积累技术债务）

你的看法是什么？
```

**等待用户反馈**：
- ✅ 用户批准 → 进入 Phase 5
- ❌ 用户拒绝 → 记录拒绝理由为 ADR
- 🔄 用户要求修改 → 调整方案

---

### Phase 5: 决策固化

#### 如果接受

1. **创建实施计划**：
   ```
   使用 writing-plans Skill 创建详细计划
   ```

2. **记录新术语**（如果适用）：
   ```markdown
   # .qoder/CONTEXT.md
   
   ## Language
   
   ### OrderCreationService
   负责订单创建和验证的深层模块。
   接口: create(), validate()
   深度比: 12:1
   ```

3. **记录时间戳**：
   ```bash
   date > .ak47/architecture-review-last.txt
   ```

4. **生成报告**：
   ```markdown
   # .ak47/architecture-reports/YYYY-MM-DD.md
   
   ## 接受的深化机会
   - 拆分 OrderService（计划中）
   
   ## 拒绝的机会
   - 无
   
   ## 下次审查日期
   YYYY-MM-DD + 7 天
   ```

#### 如果拒绝

**记录拒绝理由为 ADR**：

```markdown
# .ak47/experiences/decisions/ADR-XXX-reject-order-service-refactor.md

## 决策

拒绝拆分 OrderService 的提案。

## 背景

架构审查发现 OrderService 有 15 个接口方法，深度比 3:1。

## 拒绝理由

1. 当前迭代周期紧张，无法投入 2-3 天
2. OrderService 近期可能有重大变更（等待新需求）
3. 测试覆盖率已经 85%，风险可控

## 重新评估条件

- 当 OrderService 接口方法数 > 20 时
- 当新需求明确时
- 当下个迭代周期开始时

## 日期

YYYY-MM-DD
```

---

## 与 systematic-debugging 的集成

### 触发条件

**当 systematic-debugging Phase 5 发现"无正确测试缝"时**：

```markdown
## 架构问题记录

**问题**: 无法为 Token 刷新编写回归测试

**原因**: 
- 刷新逻辑与 HTTP 客户端紧耦合
- 无法 mock 并发场景

**建议**: 
- 运行 improve-architecture Skill
- 分析 TokenRefreshService 的接缝质量
- 考虑将刷新逻辑抽取为独立模块
```

### 工作流

```
调试 Bug
  ↓
Phase 5: 发现无正确测试缝
  ↓
记录架构问题
  ↓
自动触发 improve-architecture
  ↓
分析：TokenRefreshService 深度比 2:1
  ↓
建议：抽取为独立深层模块
  ↓
进入 Grilling 循环
  ↓
实施重构
```

---

## 定期执行保障

### 方案 1: Qoder Hook 提醒

**文件**: `.qoder/hooks/pre-tool-use-architecture-check.sh`

```bash
#!/bin/bash
# 在 AI 使用工具时检查是否需要架构审查

LAST_REVIEW=".ak47/architecture-review-last.txt"
THRESHOLD_DAYS=7

if [ -f "$LAST_REVIEW" ]; then
    LAST_DATE=$(cat "$LAST_REVIEW")
    DAYS_SINCE=$(( ($(date +%s) - $(date -d "$LAST_DATE" +%s)) / 86400 ))
    
    if [ $DAYS_SINCE -ge $THRESHOLD_DAYS ]; then
        echo "💡 提示：已经超过 $DAYS_SINCE 天未进行架构审查"
        echo "   建议运行: ak47 improve-architecture"
    fi
fi
```

### 方案 2: ak47 doctor 检查

**集成到 doctor 命令**：

```typescript
// src/cli/commands/doctor.ts
async function checkArchitectureReview(projectPath: string): Promise<void> {
  const lastReviewPath = path.join(projectPath, '.ak47', 'architecture-review-last.txt');
  
  if (fs.existsSync(lastReviewPath)) {
    const lastDate = fs.readFileSync(lastReviewPath, 'utf-8');
    const daysSince = calculateDaysSince(lastDate);
    
    if (daysSince >= 7) {
      console.log(chalk.yellow(`⚠️  架构审查过期 (${daysSince} 天前)`));
      console.log(chalk.gray(`   运行: ak47 improve-architecture`));
    }
  } else {
    console.log(chalk.blue(`💡 提示：运行 ak47 improve-architecture 进行首次架构审查`));
  }
}
```

---

## 快速参考

| 概念 | 定义 | 健康指标 |
|------|------|---------|
| **深层模块** | 接口简单，内部复杂 | 深度比 ≥ 10:1 |
| **浅层模块** | 接口复杂，内部简单 | 深度比 < 5:1 |
| **删除测试** | 想象删除模块 | 复杂度应重现 |
| **接缝** | 可替换实现的点 | 清晰、可 mock |

---

## 真实世界影响

从架构审查会话：
- 主动发现熵增：避免 2-3 个月后的重构危机
- 提升可测试性：测试难度从困难 → 容易
- 提升 AI 可导航性：AI 更容易理解代码结构
- 减少技术债务：每次审查解决 1-2 个问题

---

## 相关知识资产

- **深层模块理论**: [BP-vertical-slice-and-deep-module.md](../../.ak47/experiences/best-practices/BP-vertical-slice-and-deep-module.md)
- **系统化调试**: [superpowers-systematic-debugging](../superpowers-systematic-debugging/SKILL.md)
- **架构决策**: `.ak47/experiences/decisions/*.md`
- **领域术语**: `.qoder/CONTEXT.md`
