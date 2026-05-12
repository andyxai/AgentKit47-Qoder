# Agent Brief Template

**用途**: 为 AI 子 Agent 提供结构化的任务说明，确保需求清晰、边界明确、可验证。

**何时使用**: 需求盘问完成后、实施开始前。

---

## Brief 模板

```markdown
# Agent Brief: <简短的任务描述>

## Category
bug | enhancement

## Summary
<1-2 句话说明要做什么，包含动机>

## Current behaviour
<现在发生了什么>

## Desired behaviour
<应该发生什么>

## Key interfaces
- `functionOrMethod()` — 需要修改/添加的核心函数
- `ClassName` — 涉及的类
- `configKey` — 相关配置项

## Acceptance criteria
- [ ] **Given** <前置条件>, **When** <操作>, **Then** <预期结果>
- [ ] **Given** <前置条件>, **When** <操作>, **Then** <预期结果>
- [ ] 测试覆盖率达到 XX%
- [ ] 所有现有测试通过

## Out of scope
- ❌ 不会修改的部分
- ❌ 不会添加的功能
- ❌ 明确排除的场景

## Implementation hints
<可选：技术建议、参考文件、注意事项>

## Reference files
- `path/to/file1.ts` — 需要修改的文件
- `path/to/file2.ts` — 参考文件
- `path/to/test.ts` — 测试文件

## Constraints
- 保持向后兼容
- 不破坏现有 API
- 遵循项目编码规范

## Success metrics
- 功能验证：所有 Acceptance criteria 满足
- 质量验证：测试通过率 100%
- 性能验证：无明显性能退化
```

---

## 使用指南

### 1. 何时生成 Brief

**必须生成 Brief 的场景**：
- ✅ 需求盘问完成后（requirements-grilling）
- ✅ 复杂功能开发前（> 2 小时工作量）
- ✅ 跨模块修改
- ✅ 涉及多个文件

**可选生成 Brief 的场景**：
- ⚪ 简单 bug 修复（< 30 分钟）
- ⚪ 单文件修改
- ⚪ 文档更新

### 2. Brief 质量检查清单

生成 Brief 后自查：

- [ ] **Summary** 1-2 句话能说清楚
- [ ] **Current/Desired** 行为对比清晰
- [ ] **Acceptance criteria** 可验证（非主观判断）
- [ ] **Out of scope** 明确排除边界外内容
- [ ] **Key interfaces** 列出核心修改点
- [ ] **Reference files** 路径准确

### 3. Brief 示例

#### 示例 1: Bug 修复

```markdown
# Agent Brief: 修复模板渲染时的路径解析错误

## Category
bug

## Summary
模板渲染在 Windows 下路径解析失败，因为硬编码了 Unix 路径分隔符。需要改为使用 `path.join()`。

## Current behaviour
```
Error: Cannot find template 'components\button.mustache'
```

## Desired behaviour
模板路径在 Windows/Linux/macOS 下均能正确解析。

## Key interfaces
- `resolveTemplatePath(templateName)` — 需要修改的核心函数
- `TemplateRenderer` — 模板渲染器类

## Acceptance criteria
- [ ] **Given** Windows 环境, **When** 渲染 `components\button.mustache`, **Then** 正确找到模板文件
- [ ] **Given** Linux 环境, **When** 渲染 `components/button.mustache`, **Then** 正确找到模板文件
- [ ] 所有现有测试通过
- [ ] 新增跨平台路径测试用例

## Out of scope
- ❌ 不会修改模板渲染逻辑
- ❌ 不会添加新的模板语法
- ❌ 不会修改 Mustache 引擎

## Implementation hints
- 使用 `path.join()` 替代字符串拼接
- 参考 Node.js `path` 模块文档
- Windows 测试需要在 CI 中配置

## Reference files
- `src/core/generator/template-path.ts` — 需要修改
- `tests/core/generator/template-path.test.ts` — 需要新增测试

## Constraints
- 保持向后兼容（现有路径格式仍可用）
- 不破坏现有 API

## Success metrics
- 功能验证：跨平台路径解析正确
- 质量验证：测试通过率 100%
```

#### 示例 2: 新功能

```markdown
# Agent Brief: 添加架构审查定期提醒

## Category
enhancement

## Summary
添加架构审查定期提醒功能，超过 7 天未审查时在使用工具时提示，帮助主动控制架构熵增。

## Current behaviour
没有架构审查提醒机制，架构问题积累到严重才被发现。

## Desired behaviour
- 超过 7 天未审查时，使用工具前提示
- 提示不阻塞工具使用
- 支持手动触发审查

## Key interfaces
- `checkArchitectureReviewNeeded()` — 检查是否需要审查
- `preToolUseHook` — Hook 脚本模板
- `.ak47/architecture-review-last.txt` — 记录最后审查时间

## Acceptance criteria
- [ ] **Given** 超过 7 天未审查, **When** 使用工具, **Then** 显示提醒但不阻塞
- [ ] **Given** 7 天内已审查, **When** 使用工具, **Then** 不显示提醒
- [ ] **Given** 首次使用, **When** 使用工具, **Then** 显示引导提示
- [ ] Hook 脚本在 macOS/Linux 下均能运行

## Out of scope
- ❌ 不会强制要求审查
- ❌ 不会修改审查逻辑本身
- ❌ 不会添加 Web UI

## Implementation hints
- 使用文件时间戳记录最后审查时间
- Hook 脚本需要兼容 macOS 和 Linux 的 `date` 命令
- 提醒消息要友好，不阻塞

## Reference files
- `templates/git-hooks/pre-tool-use-architecture-check.sh.mustache` — 需要创建
- `utils/paths.ts` — 参考路径工具

## Constraints
- 提醒不阻塞工具使用
- 兼容 macOS/Linux
- 不增加明显的性能开销

## Success metrics
- 功能验证：提醒机制正常工作
- 质量验证：Hook 脚本测试通过
- 用户反馈：提醒频率合适
```

---

## 最佳实践

### ✅ DO

1. **明确边界**: Out of scope 比 Acceptance criteria 更重要
2. **可验证标准**: 每个 Acceptance criteria 都能被测试验证
3. **引用准确**: Reference files 路径要验证存在
4. **动机清晰**: Summary 包含为什么要做这个改动
5. **保持简洁**: Brief 控制在 1 页内（~500 字）

### ❌ DON'T

1. **模糊描述**: "提升性能"（❌） → "响应时间 < 200ms"（✅）
2. **遗漏边界**: 不明确 Out of scope（❌）
3. **过度详细**: 包含实现细节（应该由 AI 自行决策）
4. **引用不存在**: Reference files 路径错误
5. **主观标准**: "用户体验好"（❌） → "操作步骤 ≤ 3 步"（✅）

---

## 与现有流程集成

### requirements-grilling 集成

```
需求提出
  ↓
requirements-grilling（盘问）
  ↓
需求清晰？
  ├─ 是 → 生成 Agent Brief
  └─ 否 → 继续盘问
  ↓
Brief 确认
  ↓
实施（TDD + systematic-debugging）
```

### Out-of-Scope 集成

```
需求提出
  ↓
评估是否在范围内
  ├─ 在范围内 → 生成 Agent Brief
  └─ 不在范围内 → 记录到 Out-of-Scope
       ↓
       创建 .ak47/out-of-scope/<feature-name>.md
       ↓
       告知用户并说明理由
```

---

## 版本历史

- **v1.0** (2026-05-08): 初始版本，借鉴 mattpocock-skills 的 AGENT-BRIEF.md
