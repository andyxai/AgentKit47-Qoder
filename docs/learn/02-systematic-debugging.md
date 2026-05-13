# 02 · 系统化调试方法论：用结构化方法替代"凭经验猜"

> **解决什么问题**：Bug 排查靠猜、试来试去浪费时间、修完又复发、新人不会排查  
> **预计阅读**：10 分钟  
> **原始经验**：[BP-six-phase-debugging-cycle.md](../../.ak47/experiences/best-practices/BP-six-phase-debugging-cycle.md)

---

## 背景

一套标准化的 Bug 排查流程，把老工程师的经验变成可复制的方法。核心原则：先复现、再二分、再假设、再验证——每一步都有明确的准入条件和禁止行为。

---

## 来源

方法论源自 mattpocock 的 [diagnose skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnose/SKILL.md)（[mattpocock/skills](https://github.com/mattpocock/skills)），融合了 AK47 自身的架构诊断能力（架构质疑、多组件诊断、数据流追溯）。形成它的关键驱动力是观察到 AI 编程中的一个高频问题：AI 遇到 Bug 时倾向于表面修复——改一行代码让报错消失，但不追溯根因，导致 Bug 反复出现。

---

## 原理

### 传统调试的问题

```
用户报告 Bug → AI 猜测原因 → 直接改代码 → 可能修复 / 可能引入新问题 → 声明完成
```

| 问题 | 后果 |
|------|------|
| 没有反馈循环 | 不知道修复是否真的有效 |
| 一次改多个变量 | 无法确定哪个修改起作用 |
| 表面修复 | Bug 反复出现 |
| 不沉淀知识 | 同类问题下次还要从头排查 |

### 七阶段调试的改进

| 阶段 | 解决的问题 |
|------|-----------|
| Phase 1: 构建反馈循环 | 必须先有验证手段，杜绝"盲改" |
| Phase 2: 稳定复现 | 尽可能复现才能定位，杜绝"偶发就不管" |
| Phase 3: 最小化范围 | 二分法缩小范围，去掉无关变量，杜绝"在全系统里乱找" |
| Phase 4: 生成可证伪假设 | 假设必须能验证，杜绝"可能是代码有问题"这种笼统猜测 |
| Phase 5: 仪器化验证 | 一次只改变一个变量，杜绝"同时改三处" |
| Phase 6: 修复 + 回归测试 | 先写测试再修代码，杜绝"修了又坏" |
| Phase 7: 清理 + 沉淀 | 删除调试代码，记录根因，杜绝"下次还猜" |

---

## 核心方法：七阶段详解

### Phase 1: 构建反馈循环 ⭐（最重要！）

**投入不成比例的努力在这里。**

在改任何代码之前，先建立**能快速验证修复是否有效**的手段：

| 方法 | Python 示例 | Java 示例 |
|------|------------|----------|
| 运行失败的测试 | `pytest -k "failing_test"` | `./gradlew test --tests "*FailingTest*"` |
| 写 HTTP 脚本 | `python -c "import requests; print(requests.post('http://localhost:3000/api', json={'key':'val'}).text)"` | curl: `curl -X POST localhost:3000/api -d '{"key":"val"}'` |
| 日志监控 | `tail -f logs/app.log \| grep ERROR`（跨语言通用） | 同左 |

**准入条件**：必须有一个可信的反馈循环，才能进入 Phase 2。

### Phase 2: 稳定复现

必须捕获：
- 错误信息和完整堆栈
- 触发条件（什么操作、什么数据、什么环境）
- 是否偶发（偶发问题需要特殊处理策略）

**准入条件**：尽可能 100% 复现（偶发问题需记录复现率）。

### Phase 3: 最小化范围

把问题缩小到**最小可复现范围**。核心手段：

| 手段 | 做法 |
|------|------|
| **二分定位** | 把系统从中间切开（前端/后端、A模块/B模块），判断问题在前半段还是后半段 |
| **去无关变量** | 逐步移除不相关的配置、数据、中间步骤，直到只剩触发 Bug 的最小集合 |
| **代码二分（git bisect）** | 如果 Bug 是在某个版本引入的，用 `git bisect` 自动二分定位 |

**准入条件**：问题范围已缩小到最小可复现单元（一个函数、一个 API 或一个组件）。

### Phase 4: 生成可证伪假设

| ❌ 坏假设 | ✅ 好假设 |
|----------|---------|
| "可能是代码有问题" | "当用户 ID 为空时，订单创建会空指针异常" |
| "大概是权限问题" | "如果是权限不足，那么提升权限后 Bug 应该消失" |
| "好像是并发问题" | "如果是竞态，那么加锁后 Bug 应该消失" |

生成 3-5 个假设，展示给用户确认后再进入验证。

### Phase 5: 仪器化验证

**一次只改变一个变量。** 优先使用调试器（Python: `pdb` / Java: `jdb` / Node: `--inspect`），其次用带唯一前缀的日志：

<table>
<tr><th>Python</th><th>Java</th></tr>
<tr><td>

```python
print(f'[DEBUG-a4f2] token value: {token}')
# 唯一前缀方便 Phase 7 清理：grep "\[DEBUG-[a-f0-9]{4}\]"
```

</td><td>

```java
System.out.println("[DEBUG-a4f2] token value: " + token);
// 唯一前缀方便 Phase 7 清理：grep "\[DEBUG-[a-f0-9]{4}\]"
```

</td></tr>
</table>

### Phase 6: 修复 + 回归测试

**必须先写回归测试，确认测试失败，再写修复代码。**

<table>
<tr><th>Python（pytest）</th><th>Java（JUnit 5）</th></tr>
<tr><td>

```python
# Step 1: 写回归测试（确认能复现 Bug）
def test_should_not_crash_when_user_id_is_empty():
    with pytest.raises(ValueError):  # 期望抛异常才算正确
        create_order(user_id="")
# ❌ 测试失败 → 证明测试有效

# Step 2: 写修复代码
# Step 3: 测试通过 ✅
```

</td><td>

```java
// Step 1: 写回归测试（确认能复现 Bug）
@Test
void shouldNotCrashWhenUserIdIsEmpty() {
    assertThrows(IllegalArgumentException.class, () -> {
        createOrder("");
    });
}
// ❌ 测试失败 → 证明测试有效

// Step 2: 写修复代码
// Step 3: 测试通过 ✅
```

</td></tr>
</table>

### Phase 7: 清理 + 闭环

1. 清除所有 `[DEBUG-*]` 日志
2. 将根因写入 commit message
3. 回答"什么能预防这个 Bug？"——加测试 / 加类型校验 / 加防御代码 / 架构改进

---

## 对比其他方案

| 方案 | 修复质量 | 可复制性 | 知识沉淀 | 适用场景 |
|------|---------|---------|---------|---------|
| **七阶段调试** | 高（根因修复 + 回归测试） | 高（新人按步骤即可） | 高（commit 记录根因） | 所有 Bug |
| **凭经验猜** | 不稳定（可能表面修复） | 低（依赖个人经验） | 无 | 不推荐 |
| **print 大法** | 中（能定位但可能不彻底） | 中 | 无 | 简单问题快速定位 |
| **专业调试器** | 高 | 中（有学习成本） | 中 | 复杂逻辑深度调试 |

---

## 落地检查清单

- [ ] 是否构建了反馈循环再动手改代码？
- [ ] 是否有稳定复现步骤（尽可能 100%）？
- [ ] 是否通过二分法缩小了问题范围？
- [ ] 假设是否可验证、可证伪？
- [ ] 是否一次只改变一个变量？
- [ ] 是否先写回归测试再修代码？
- [ ] 是否清除了所有调试日志？
- [ ] 是否复盘了根因并记录到 commit message？

---

## 延伸阅读

- [AI 时代的代码重构](03-ai-era-refactoring.md) — 修复后的重构技巧
- 原始经验：[BP-six-phase-debugging-cycle.md](../../.ak47/experiences/best-practices/BP-six-phase-debugging-cycle.md)
- 原始经验：[BP-four-core-engineering-disciplines.md](../../.ak47/experiences/best-practices/BP-four-core-engineering-disciplines.md) — 四大纪律中的"调试 SOP"章节
- 方法论来源：[mattpocock/skills](https://github.com/mattpocock/skills) — `/diagnose` skill 原始定义
