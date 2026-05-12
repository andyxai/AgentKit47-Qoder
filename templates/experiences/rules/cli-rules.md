
# CLI 模块规则

> **适用范围**：`src/cli/` 目录下的所有文件
> **优先级**：🔴 硬规则 - 必须遵守

---

## 🔴 命令结构

### 文件组织
- 每个命令必须是独立的 TypeScript 文件
- 命令名使用 kebab-case（如 `init-project`、`validate-spec`）
- 命令文件必须导出默认的 handler 函数

### 命令格式
```typescript
export default async function handler(args: CommandArgs): Promise<void> {
  // 命令实现
}
```

---

## 🔴 参数约定

### 参数格式
- 必需参数使用 `<angle-brackets>`：`<project-name>`
- 可选参数使用 `[square-brackets]`：`[output-dir]`
- 布尔标志使用 `--flag` 格式：`--verbose`、`--dry-run`

### 帮助信息
- 每个命令**必须**包含 `--help` 输出
- 帮助信息必须包含：
  - 命令描述
  - 参数说明
  - 使用示例

### 示例
```bash
ak47 init <project-name> [options]
ak47 validate --spec <spec-file> --verbose
```

---

## 🔴 错误处理

### 错误分类

| 错误类型 | 处理方式 | 退出码 |
|---------|---------|--------|
| 用户错误 | 友好提示 + 使用建议 | `process.exit(1)` |
| 系统错误 | 抛出异常 + 堆栈跟踪 | 自动 |
| 验证失败 | 列出所有错误（非首个即停） | `process.exit(1)` |

### 错误信息格式
```
❌ 错误：缺少必需参数 <project-name>

💡 用法：ak47 init <project-name> [options]

📖 详细信息：
   - <project-name>：项目名称（必填）
   - [output-dir]：输出目录（可选，默认为当前目录）

🔗 文档：https://docs.ak47.dev/cli/init
```

---

## 🟡 输出规范

### 成功输出
- 使用 emoji 标记状态：✅ 成功、⚠️ 警告、ℹ️ 信息
- 提供下一步操作建议

### 进度输出
- 长时间操作显示进度条或步骤提示
- 使用 `--verbose` 标志控制详细程度

### 示例
```bash
✅ 项目初始化完成

📁 创建的文件：
  - AGENTS.md
  - .ak47/config.yaml
  - templates/

💡 下一步：
  1. 编辑 .ak47/config.yaml 配置项目
  2. 运行 ak47 validate 验证配置
  3. 开始创建你的第一个 Spec
```

---

## 🟡 配置读取

### 配置文件优先级
1. 命令行参数（最高优先级）
2. 项目配置 `.ak47/config.yaml`
3. 全局配置 `~/.ak47/config.yaml`
4. 默认值（最低优先级）

### 配置验证
- 读取配置后必须验证格式
- 验证失败时列出所有错误项
- 提供修复建议

---

## 🟢 测试要求

### 单元测试
- 每个命令必须有对应的测试文件
- 测试文件路径：`tests/cli/commands/<command-name>.test.ts`
- 测试覆盖率 ≥ 80%

### 集成测试
- 关键命令必须有集成测试
- 模拟真实用户交互
- 验证端到端流程

---

> **重要**：CLI 是用户与 ak47 的主要交互界面，必须保持一致性和友好性。
