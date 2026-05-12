# Agent Briefs 存储目录

此目录用于存储生成的 Agent Brief 文档。

## 命名规范

- 使用小写英文
- 用 `-` 分隔单词
- 示例：`user-authentication.md`、`order-cancellation.md`

## 生成时机

在需求文档通过 critical-review 审核后，如果需求复杂度满足以下条件之一，必须生成 Brief：

- 预计实施时间 > 2 小时
- 涉及 2 个以上模块修改
- 需要修改 > 3 个文件
- 涉及 API/函数签名修改

## Brief 内容

每个 Brief 必须包含：

1. **Summary** - 1-2 句话说明做什么 + 为什么
2. **Current behaviour** - 当前状态
3. **Desired behaviour** - 期望状态
4. **Key interfaces** - 核心接口
5. **Acceptance criteria** - Given/When/Then 格式
6. **Out of scope** - 明确不做什么
7. **Reference files** - 文件路径
8. **Constraints** - 约束条件

## 与 OpenSpec 的关系

- Brief 是需求文档和实施之间的**桥梁**
- Brief 关注**做什么**（What）和**验收标准**（Acceptance）
- OpenSpec Spec 关注**如何设计**（How）和**技术细节**
- Brief 在 Spec 之前生成，为 Spec 提供需求上下文
