/**
 * 自定义配置类型定义
 *
 * 定义用户通过 config-manager 管理的自定义配置结构
 */

/** 自定义配置元数据 */
export interface CustomConfigMetadata {
  /** 配置版本 */
  version: string;
  /** 创建时间（ISO 8601） */
  created_at: string;
  /** 最后更新时间（ISO 8601） */
  updated_at: string;
  /** 创建者（邮箱或用户名） */
  created_by?: string;
  /** 配置描述 */
  description?: string;
}

/** 自定义标记（所有用户自定义配置都包含） */
export interface CustomMarkings {
  /** 是否为用户自定义 */
  _custom: true;
  /** 创建时间 */
  _created_at: string;
  /** 最后更新时间 */
  _updated_at?: string;
  /** 修改原因 */
  _reason?: string;
  /** 作者 */
  _author?: string;
}

/** 自定义验证类型配置 */
export interface CustomValidationType extends CustomMarkings {
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
  trigger: 'auto' | 'manual';
  /** 是否必须通过 */
  required: boolean;
  /** 超时时间（秒） */
  timeout?: number;
  /** 传递给执行器的配置 */
  config?: Record<string, unknown>;
  /** 失败处理策略 */
  on_failure?: {
    action: 'warn-and-continue' | 'block-archive' | 'mark-risk';
    message?: string;
    risk_level?: 'low' | 'medium' | 'high';
  };
}

/** 自定义 Agent 定义 */
export interface CustomAgentDef extends CustomMarkings {
  /** Agent 唯一标识 */
  id: string;
  /** Agent 显示名称 */
  name: string;
  /** Agent 定义文件路径 */
  file: string;
  /** 使用的模板（可选） */
  template?: string;
}

/** 自定义 Skill 定义 */
export interface CustomSkillDef extends CustomMarkings {
  /** Skill 唯一标识 */
  id: string;
  /** Skill 显示名称 */
  name: string;
  /** Skill 目录路径 */
  directory: string;
  /** 使用的模板（可选） */
  template?: string;
}

/** 操作历史记录 */
export interface ConfigChangeRecord {
  /** 操作时间 */
  timestamp: string;
  /** 操作类型 */
  action: 'add' | 'update' | 'delete' | 'migrate';
  /** 配置类型 */
  type: 'validation' | 'agent' | 'skill';
  /** 配置 ID */
  id: string;
  /** 操作者 */
  author?: string;
  /** 修改原因 */
  reason?: string;
  /** 变更详情 */
  changes: Array<{
    field: string;
    operation: 'create' | 'update' | 'delete' | 'append';
    old_value?: unknown;
    new_value?: unknown;
    value?: unknown;
  }>;
}

/** 自定义配置主文件结构 */
export interface CustomConfigs {
  /** 元数据 */
  metadata: CustomConfigMetadata;
  /** 自定义验证配置 */
  validation?: {
    /** 是否启用 */
    enabled: boolean;
    /** 验证类型列表 */
    types: CustomValidationType[];
  };
  /** 自定义 Agent 列表 */
  custom_agents?: CustomAgentDef[];
  /** 自定义 Skill 列表 */
  custom_skills?: CustomSkillDef[];
}

/** 配置包导出结构 */
export interface ConfigExportPackage {
  /** 配置主文件 */
  customConfigs: CustomConfigs;
  /** 自定义 Agent 文件映射 */
  agentFiles: Record<string, string>;
  /** 自定义 Skill 文件映射 */
  skillFiles: Record<string, string>;
  /** 其他相关文件 */
  otherFiles: Record<string, string>;
  /** 迁移说明 */
  migrationDoc: string;
}

/** 配置导入结果 */
export interface ConfigImportResult {
  /** 导入成功 */
  success: boolean;
  /** 导入的配置数量 */
  imported: number;
  /** 跳过的配置数量 */
  skipped: number;
  /** 冲突的配置 */
  conflicts: Array<{
    type: string;
    id: string;
    reason: string;
    suggestion: string;
  }>;
  /** 错误信息 */
  errors: string[];
}

/** 配置升级报告 */
export interface ConfigUpgradeReport {
  /** 保留的配置 */
  preserved: Array<{
    type: string;
    id: string;
    action: 'preserved';
  }>;
  /** 冲突的配置 */
  conflicts: Array<{
    type: string;
    id: string;
    action: 'needs-migration' | 'manual-review';
    reason: string;
  }>;
  /** 已迁移的配置 */
  migrated: Array<{
    type: string;
    id: string;
    action: 'migrated';
    changes: string[];
  }>;
}
