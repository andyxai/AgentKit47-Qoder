
# 核心架构规则

> **适用范围**：`src/core/` 目录下的所有文件
> **优先级**：🔴 硬规则 - 必须遵守

---

## 🔴 模块分层

### 七层架构（自上而下）

```
orchestrator/    ← 编排层（流程控制）
    ↓
recommender/     ← 推荐层（智能推荐）
    ↓
scanner/         ← 扫描层（项目分析）
    ↓
generator/       ← 生成层（模板渲染）
    ↓
validator/       ← 验证层（质量检查）
    ↓
config-manager/  ← 配置层（配置管理）
    ↓
flows/           ← 流程层（工作流定义）
```

### 依赖方向
- **只能向下依赖**：orchestrator → recommender → scanner
- **禁止向上依赖**：scanner → ❌ orchestrator
- **禁止横向依赖**：scanner → ❌ generator（通过 orchestrator 协调）

---

## 🔴 模块职责

### orchestrator（编排层）
- **职责**：协调整个 ak47 流程，调用其他模块
- **输入**：用户命令、项目配置
- **输出**：执行结果、进度报告
- **禁止**：直接操作文件系统、渲染模板

### recommender（推荐层）
- **职责**：基于项目特征推荐 Agent/Skill
- **输入**：项目 profile
- **输出**：推荐的单元列表 + 推理过程
- **禁止**：生成文件、修改配置

### scanner（扫描层）
- **职责**：分析项目结构、技术栈、成熟度
- **输入**：项目根目录
- **输出**：项目 profile
- **禁止**：推荐 Agent、生成文件

### generator（生成层）
- **职责**：渲染模板、生成文件
- **输入**：模板、上下文数据
- **输出**：生成的文件
- **禁止**：扫描项目、推荐 Agent

### validator（验证层）
- **职责**：验证配置、规则遵守情况
- **输入**：配置、规则
- **输出**：验证报告
- **禁止**：修改文件、生成代码

---

## 🔴 接口设计

### 函数签名规范
```typescript
// ✅ 好的接口：明确输入输出
export function scanProject(rootDir: string): ProjectProfile {
  // 实现
}

// ❌ 坏的接口：使用 any 或隐式类型
export function scanProject(rootDir: any): any {
  // 实现
}
```

### 错误处理
- 使用自定义错误类型：`ScannerError`、`GeneratorError`
- 错误信息必须包含上下文：`Failed to scan directory: ${path}`
- 不要吞没异常，要么处理要么抛出

---

## 🟡 代码组织

### 文件命名
- 使用 kebab-case：`project-scanner.ts`、`template-renderer.ts`
- 测试文件：`project-scanner.test.ts`

### 导出规范
- 每个文件一个主要导出（函数或类）
- 辅助函数使用命名导出
- 避免默认导出多个函数

### 导入顺序
```typescript
// 1. 标准库
import * as path from 'path';
import * as fs from 'fs';

// 2. 第三方库
import * as yaml from 'js-yaml';

// 3. 内部模块（按层级从上到下）
import { ProjectProfile } from '../types/project';
import { ScannerError } from './errors';
```

---

## 🟡 类型安全

### TypeScript 严格模式
- 禁止使用 `any` 类型（使用 `unknown` 代替）
- 启用 `strictNullChecks`
- 启用 `strictFunctionTypes`

### 类型定义位置
- 共享类型放在 `src/types/` 目录
- 模块私有类型放在模块内部
- 不要重复定义类型

---

## 🟢 性能要求

### 扫描性能
- 扫描 1000 个文件 < 2 秒
- 使用流式处理大文件
- 避免重复读取同一文件

### 生成性能
- 渲染 100 个模板 < 5 秒
- 使用缓存避免重复计算
- 并行生成独立文件

---

> **重要**：核心模块是 ak47 的引擎，必须保持清晰的分层和高性能。
