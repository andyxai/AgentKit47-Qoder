/**
 * 验证系统类型定义
 *
 * 定义外部平台功能测试的开放能力架构类型：
 * - 验证配置结构
 * - 验证执行结果
 * - 验证执行器接口
 */

/** 验证状态 */
export type ValidationStatus = 'passed' | 'failed' | 'skipped' | 'error';

/** 执行器类型 */
export type RunnerType = 'agent' | 'skill' | 'manual' | 'script';

/** 触发方式 */
export type TriggerType = 'auto' | 'manual';

/** 失败处理策略 */
export type OnFailureAction = 'warn-and-continue' | 'block-archive' | 'mark-risk';

/** 风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high';

/** 验证类型配置 */
export interface ValidationTypeConfig {
  /** 验证类型唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 执行的 Agent 名称 */
  agent?: string | null;
  /** 执行的 Skill 名称 */
  skill?: string | null;
  /** 执行的脚本路径 */
  script?: string | null;
  /** 触发方式 */
  trigger: TriggerType;
  /** 是否必须通过 */
  required: boolean;
  /** 超时时间（秒） */
  timeout?: number;
  /** 传递给执行器的配置 */
  config?: Record<string, unknown>;
  /** 失败处理策略 */
  on_failure?: {
    action: OnFailureAction;
    message?: string;
    risk_level?: RiskLevel;
  };
}

/** 验证配置 */
export interface ValidationConfig {
  /** 全局开关 */
  enabled: boolean;
  /** 验证类型列表 */
  types: ValidationTypeConfig[];
  /** 失败处理策略 */
  on_failure: {
    action: OnFailureAction;
    message: string;
  };
}

/** 功能验证详情 */
export interface FunctionalityDetail {
  /** 测试用例名称 */
  case: string;
  /** 状态 */
  status: 'passed' | 'failed' | 'skipped';
  /** 平台（如浏览器类型） */
  platform?: string;
  /** 错误信息 */
  error?: string;
  /** 截图路径 */
  screenshot?: string;
}

/** 功能验证结果 */
export interface FunctionalityResult {
  /** 总用例数 */
  totalCases: number;
  /** 通过数 */
  passed: number;
  /** 失败数 */
  failed: number;
  /** 跳过的数 */
  skipped: number;
  /** 详情 */
  details: FunctionalityDetail[];
}

/** 验证执行结果 */
export interface ValidationResult {
  /** 验证类型 ID */
  validationType: string;
  /** 状态 */
  status: ValidationStatus;
  /** 时间戳（ISO 8601 格式） */
  timestamp: string;
  /** 执行信息 */
  execution: {
    /** 执行平台（local/external-platform/manual） */
    platform: string;
    /** 环境标识（test/staging/production） */
    environment: string;
    /** 执行器类型 */
    runner: RunnerType;
    /** Agent 名称 */
    agent?: string;
    /** Skill 名称 */
    skill?: string;
    /** 脚本路径 */
    script?: string;
    /** 执行耗时（秒） */
    duration: number;
  };

  /** 通用指标（可选，根据验证类型不同而不同） */
  metrics?: Record<string, unknown>;

  /** 功能验证清单（适用于功能测试） */
  functionality?: FunctionalityResult;

  /** 结论 */
  conclusion: string;

  /** 原始数据引用 */
  rawData?: string[];
  /** 截图引用 */
  screenshots?: string[];
  /** 日志引用 */
  logs?: string[];

  /** 错误信息（如果执行出错） */
  error?: string;
}

/** 验证摘要 */
export interface ValidationSummary {
  /** 总验证数 */
  total: number;
  /** 通过数 */
  passed: number;
  /** 失败数 */
  failed: number;
  /** 跳过数 */
  skipped: number;
  /** 必须验证的失败数 */
  requiredFailed: number;
  /** 整体状态 */
  status: 'passed' | 'failed' | 'skipped';
  /** 原因（跳过时） */
  reason?: string;
  /** 详细结果 */
  results: ValidationResult[];
}

/** 验证执行器接口 */
export interface ValidationExecutor {
  /** 执行验证 */
  execute(config: ValidationTypeConfig, changeId: string): Promise<ValidationResult>;

  /** 检查执行器是否可用 */
  isAvailable(): Promise<boolean>;

  /** 获取执行器信息 */
  getInfo(): {
    name: string;
    version: string;
    supportedTypes: string[];
  };
}
