# Out-of-Scope Knowledge Base Template

**用途**: 持久化记录被拒绝的功能请求，避免重复讨论，帮助 AI 保持决策一致性。

**位置**: `.ak47/out-of-scope/*.md`

---

## 模板

```markdown
# [Feature Name] - Out of Scope

**Status**: Rejected  
**Date**: YYYY-MM-DD  
**Category**: bug | enhancement | breaking-change  
**Decision by**: Human maintainer | AI during triage

## Summary
<1-2 句话说明被拒绝的功能>

## Requested behaviour
<用户想要的行为>

## Why rejected
<拒绝的理由，详细说明>

### Technical reasons
- 理由 1
- 理由 2

### Product reasons
- 理由 1
- 理由 2

### Scope reasons
- 超出项目定位
- 与维护方向不符
- 增加复杂度

## Alternatives suggested
<推荐的替代方案>

1. **方案 1**: 描述 + 如何使用
2. **方案 2**: 描述 + 如何使用

## Related issues
- #123 — 相关功能请求
- #456 — 相关讨论

## Reconsideration criteria
<什么情况下会重新考虑>

- 条件 1
- 条件 2

**Note**: 如果以上条件满足，可以重新评估此决策。

---

*This feature was evaluated and rejected during triage on YYYY-MM-DD.*
*Decision recorded to avoid repeated discussion.*
```

---

## 使用指南

### 1. 何时创建 Out-of-Scope 记录

**必须创建**：
- ✅ 明确拒绝的功能请求
- ✅ 与项目定位不符的需求
- ✅ 会破坏架构的决定
- ✅ 超出维护能力的需求

**可选创建**：
- ⚪ 暂缓实现（未来可能考虑）
- ⚪ 需要更多讨论

### 2. 文件命名规范

```
.ak47/out-of-scope/
  ├── no-gui-support.md          # 不支持 GUI
  ├── no-legacy-format.md        # 不支持旧格式
  ├── no-custom-templates.md     # 不支持自定义模板
  └── ...
```

**命名规则**：
- 小写字母
- 使用 `-` 分隔
- 简洁描述被拒绝的内容

### 3. 查询 Out-of-Scope

在评估新需求时：

```bash
# 搜索相关的被拒功能
grep -r "关键词" .ak47/out-of-scope/

# 查看所有被拒功能
ls .ak47/out-of-scope/

# 查看特定被拒功能的详情
cat .ak47/out-of-scope/no-gui-support.md
```

---

## 示例

### 示例 1: 拒绝 GUI 支持

```markdown
# GUI Support - Out of Scope

**Status**: Rejected  
**Date**: 2026-05-08  
**Category**: enhancement  
**Decision by**: Human maintainer

## Summary
ak47 不会提供图形用户界面（GUI），保持纯 CLI 工具定位。

## Requested behaviour
用户希望通过 Web UI 或桌面应用使用 ak47，而不是命令行。

## Why rejected

### Technical reasons
- 增加大量依赖和复杂度
- 需要维护多平台 GUI 框架
- 与现有 CLI 工作流冲突

### Product reasons
- ak47 定位是 AI 代理的工具，不是最终用户的工具
- 目标用户（开发者）更习惯 CLI
- GUI 会偏离核心价值主张

### Scope reasons
- 超出项目定位（CLI-first）
- 维护成本远超收益
- 会分散核心功能开发精力

## Alternatives suggested

1. **IDE 集成**: 通过 IDE 插件提供类似 GUI 的体验
   - VS Code 扩展
   - Qoder 集成
   
2. **Wrapper 脚本**: 用户可以自行构建 GUI wrapper
   - 使用 ak47 的 CLI 作为后端
   - 自行实现前端

## Related issues
- #789 — "Add Web UI for easier usage"

## Reconsideration criteria
**None** — 这是核心设计决策，不会重新考虑。

---

*This feature was evaluated and rejected during triage on 2026-05-08.*
*Decision recorded to avoid repeated discussion.*
```

### 示例 2: 拒绝旧格式支持

```markdown
# Legacy Format Support - Out of Scope

**Status**: Rejected  
**Date**: 2026-05-08  
**Category**: breaking-change  
**Decision by**: Human maintainer

## Summary
ak47 v2.0 不会继续支持 v1.x 的旧配置格式。

## Requested behaviour
用户希望 v2.0 能自动兼容 v1.x 的配置文件格式。

## Why rejected

### Technical reasons
- 需要维护两套解析逻辑
- 旧格式有已知设计缺陷
- 迁移工具已提供

### Product reasons
- v2.0 是重大版本更新，打破兼容是预期行为
- 旧格式限制了新功能的实现
- 鼓励用户升级到新格式

### Scope reasons
- 增加维护负担
- 拖延 v2.0 发布
- 迁移路径已明确

## Alternatives suggested

1. **迁移工具**: 使用 `ak47 migrate` 自动转换
   ```bash
   ak47 migrate --from v1 --to v2
   ```
   
2. **文档**: 提供详细的迁移指南
   - 见 `docs/migration/v1-to-v2.md`

## Related issues
- #234 — "Please support v1 config format in v2"

## Reconsideration criteria
- v2.0 发布后 6 个月内，如果迁移率 < 50%，可能考虑

---

*This feature was evaluated and rejected during triage on 2026-05-08.*
*Decision recorded to avoid repeated discussion.*
```

---

## 最佳实践

### ✅ DO

1. **详细说明理由**: 帮助未来理解决策背景
2. **提供替代方案**: 不是简单说"不"，而是引导到正确方向
3. **明确重估条件**: 什么情况下会重新考虑
4. **关联相关 Issue**: 便于追溯
5. **定期回顾**: 检查是否有过时的 Out-of-Scope 记录

### ❌ DON'T

1. **简单拒绝**: "不，不做"（❌） → 详细说明理由（✅）
2. **模糊理由**: "太复杂"（❌） → 具体说明复杂在哪（✅）
3. **忽略替代方案**: 不给用户任何其他选择
4. **永久封闭**: 不留重新考虑的可能性（除非是核心设计决策）
5. **孤立记录**: 不关联相关讨论和 Issue

---

## 与 Agent Brief 的关系

```
需求评估
  ↓
在范围内？
  ├─ 是 → 生成 Agent Brief → 实施
  └─ 否 → 创建 Out-of-Scope 记录 → 拒绝
       ↓
       记录到 .ak47/out-of-scope/
       ↓
       未来类似需求可快速参考
```

**关键区别**：
- **Agent Brief**: 要做什么（In-Scope）
- **Out-of-Scope**: 不做什么（及为什么）

两者同样重要，都是需求管理的核心资产。

---

## 版本历史

- **v1.0** (2026-05-08): 初始版本，借鉴 mattpocock-skills 的 OUT-OF-SCOPE.md
