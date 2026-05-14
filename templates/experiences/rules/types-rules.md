
# 类型定义规则

> **适用范围**：`src/types/` 目录下的所有文件
> **优先级**：强建议 - 强烈建议遵循

---

## TypeScript 严格模式

### 编译器选项
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 禁止使用 `any`
```typescript
// 禁止
function process(data: any) {
  return data.value;
}

// 推荐
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

---

## 类型定义位置

### 共享类型 → `src/types/`
- 跨模块使用的类型
- 公共数据结构
- API 接口定义

### 模块私有类型 → 模块内部
- 仅在单个模块内使用的类型
- 内部实现细节

### 规则
- 禁止：在多个文件中重复定义相同类型
- 禁止：在业务代码中定义共享类型
- 必须：共享类型统一放在 `src/types/`

---

## 类型命名规范

### 接口命名
```typescript
// 好的命名
interface ProjectProfile {
  structure: StructureInfo;
  techStack: TechStackInfo;
}

interface ScannerOptions {
  rootDir: string;
  includeHidden: boolean;
}

// 坏的命名
interface Data { }  // 太笼统
interface Obj { }   // 无意义
```

### 命名规则
- 使用 PascalCase：`ProjectProfile`、`ScannerOptions`
- 接口名应该是名词或名词短语
- 避免 `I` 前缀（不使用 `IProjectProfile`）

---

## 联合类型和类型守卫

### 联合类型
```typescript
type ChangeStatus = 'proposing' | 'specing' | 'implementing' | 'completed';

type UnitType = 'agent' | 'skill' | 'rule';
```

### 类型守卫
```typescript
// 使用类型守卫
function isAgent(unit: Unit): unit is AgentUnit {
  return unit.type === 'agent';
}

function processUnit(unit: Unit) {
  if (isAgent(unit)) {
    // TypeScript 知道这里是 AgentUnit
    console.log(unit.role);
  }
}
```

---

## 泛型使用

### 何时使用泛型
- 数据结构（数组、映射）
- 工具函数（过滤、转换）
- API 响应封装

### 示例
```typescript
// 好的泛型使用
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function validate<T>(data: unknown, schema: Schema<T>): T {
  // 验证逻辑
  return data as T;
}

// 过度使用泛型
function process<T, U, V, W>(a: T, b: U, c: V): W {
  // 太复杂，应该拆分
}
```

---

## 类型导出

###  barrel 导出
```typescript
// src/types/index.ts
export * from './project';
export * from './config';
export * from './units';
export * from './plan';
```

### 使用方式
```typescript
// 好的导入
import { ProjectProfile, Config } from '../types';

// 坏的导入（路径太深）
import { ProjectProfile } from '../types/project';
```

---

## 文档注释

### JSDoc 注释
```typescript
/**
 * 项目配置接口
 * 
 * @example
 * ```typescript
 * const config: ProjectConfig = {
 *   platform: 'qoder',
 *   agents: ['architect', 'developer'],
 *   skills: ['tdd', 'debugging']
 * };
 * ```
 */
export interface ProjectConfig {
  /** AI 平台（qoder、claude-code、cursor） */
  platform: PlatformType;
  
  /** 启用的 Agent 列表 */
  agents: AgentId[];
  
  /** 启用的 Skill 列表 */
  skills: SkillId[];
}
```

### 注释要求
- 所有导出的类型必须有注释
- 复杂字段提供 `@example`
- 说明取值范围和约束

---

## 类型演进

### 向后兼容
```typescript
// 正确：添加可选字段（向后兼容）
interface ProjectConfig {
  platform: PlatformType;
  agents: AgentId[];
  /** @since 0.6.0 可选的实验性功能 */
  experimental?: ExperimentalOptions;
}

// 错误：删除必需字段（破坏性变更）
interface ProjectConfig {
  // platform: PlatformType;  // 删除了！
  agents: AgentId[];
}
```

### 版本标记
```typescript
/**
 * @since 0.5.0
 * @deprecated 使用 NewConfig 代替
 */
export interface OldConfig {
  // ...
}
```

---

> **重要**：类型系统是 TypeScript 的核心优势，严格的类型定义可以捕获 80% 的运行时错误。
