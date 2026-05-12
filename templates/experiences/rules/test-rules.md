
# 测试模块规则

> **适用范围**：`tests/` 目录下的所有文件
> **优先级**：🔴 硬规则 - 必须遵守

---

## 🔴 测试覆盖要求

### 覆盖率目标
- 单元测试覆盖率 ≥ 80%
- 核心模块（scanner、generator、validator）≥ 90%
- 新功能必须包含测试

### 测试类型

| 测试类型 | 位置 | 覆盖率要求 |
|---------|------|-----------|
| 单元测试 | `tests/unit/` | ≥ 80% |
| 集成测试 | `tests/integration/` | 关键路径 |
| 端到端测试 | `tests/e2e/` | 核心工作流 |

---

## 🔴 测试编写规范

### 命名约定
- 测试文件：`<被测试文件>.test.ts`
- 测试用例：`describe('<功能模块>', () => { it('应该...', () => {}) })`
- 使用中文描述测试意图

### 示例
```typescript
describe('ProjectScanner', () => {
  it('应该正确识别 TypeScript 项目', () => {
    // 测试实现
  });

  it('应该在缺少 package.json 时抛出错误', () => {
    // 边界情况测试
  });
});
```

---

## 🔴 测试结构（AAA 模式）

每个测试用例必须遵循 **Arrange-Act-Assert** 模式：

```typescript
it('应该正确计算推荐分数', () => {
  // Arrange（准备）
  const profile = makeProfile({
    hasTests: true,
    collaboration: { recommendedMode: 'collaboration' },
  });

  // Act（执行）
  const result = executeRules(profile, []);

  // Assert（断言）
  expect(result.suggestedUnits).toContain('skill-test-driven-development');
  expect(result.reasoning).toContain('R3');
});
```

**禁止混用三个阶段**：
- ❌ 在 Act 阶段准备数据
- ❌ 在 Assert 阶段修改状态
- ✅ 每个阶段职责清晰

---

## 🟡 Mock 策略

### 何时使用 Mock
- 外部 API 调用（文件系统、网络请求）
- 耗时操作（> 100ms）
- 不确定的第三方服务

### 何时不使用 Mock
- 纯函数计算
- 简单的数据结构转换
- 业务逻辑验证

### Mock 规范
```typescript
// ✅ 好的 Mock：明确边界
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue('{"name": "test"}'),
  existsSync: vi.fn().mockReturnValue(true),
}));

// ❌ 坏的 Mock：过度 mock
vi.mock('fs');  // mock 了整个模块，不明确
```

**Mock 原则**：
- 只 mock 外部依赖，不 mock 被测试的业务逻辑
- mock 返回值必须明确，不能使用 `vi.fn()` 无参数
- 每个测试用例独立 mock，避免相互影响

---

## 🟡 边界情况测试

必须覆盖以下边界情况：

### 输入边界
- 空输入：`[]`、`{}`、`""`
- 极大输入：1000+ 元素数组
- 特殊字符：`<script>`、`null`、`undefined`

### 异常边界
- 文件不存在
- 权限不足
- 网络超时
- 无效配置

### 示例
```typescript
describe('边界情况测试', () => {
  it('应该处理空目录', () => {
    const result = scanProject('/empty/dir');
    expect(result).toEqual(makeDefaultProfile());
  });

  it('应该处理无效的 JSON 文件', () => {
    expect(() => parseConfig('{invalid json}')).toThrow(ConfigError);
  });

  it('应该处理 1000+ 文件的项目', () => {
    const files = Array.from({ length: 1000 }, (_, i) => `file${i}.ts`);
    const result = scanFiles(files);
    expect(result.duration).toBeLessThan(2000); // < 2 秒
  });
});
```

---

## 🟡 测试数据管理

### Fixture 文件
- 测试数据放在 `tests/fixtures/` 目录
- 使用描述性文件名：`valid-config.yaml`、`invalid-project/`

### 工厂函数
- 使用工厂函数创建测试数据
- 提供合理的默认值

```typescript
// tests/utils/factories.ts
export function makeProfile(overrides: Partial<ProjectProfile> = {}): ProjectProfile {
  return {
    structure: { hasTests: false, hasGit: true, ...overrides.structure },
    techStack: { language: 'typescript', framework: 'none', ...overrides.techStack },
    ...overrides,
  };
}
```

---

## 🟢 测试性能要求

### 执行时间
- 单个测试用例 < 100ms
- 测试文件 < 5 秒
- 完整测试套件 < 30 秒

### 优化策略
- 并行执行独立测试
- 使用内存文件系统（memfs）替代真实文件系统
- 避免不必要的 I/O 操作

---

## 🟢 测试维护

### 重构测试
- 生产代码重构时，同步更新测试
- 保持测试与实现的一致性
- 不要删除覆盖现有功能的测试

### 删除测试
- 只在功能删除时才删除对应测试
- 保留历史测试作为文档参考

---

> **重要**：测试是代码质量的保障，不是负担。编写测试的时间应该在开发时间的 30-50%。
