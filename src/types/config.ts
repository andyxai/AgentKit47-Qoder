import { z } from 'zod';

/**
 * 平台标识
 *
 * @internal
 * 后续将与 project.ts 中的 PlatformId 统一，消除重复定义。
 */
const PlatformIdSchema = z.enum(['qoder', 'claude-code']);

/**
 * 平台配置
 *
 * 描述一个 AI 平台的配置信息，包括是否启用及配置文件目录。
 */
export const PlatformConfigSchema = z.object({
  /** 平台标识 */
  id: PlatformIdSchema,
  /** 是否启用该平台 */
  enabled: z.boolean(),
  /** 平台配置文件目录 */
  configDir: z.string(),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

/**
 * 自定义 Reviewer 配置
 *
 * 描述链式审查机制中一个 Reviewer Agent 的定义。
 */
export const ReviewerConfigSchema = z.object({
  /** Reviewer 唯一标识 */
  id: z.string(),
  /** Reviewer 显示名称 */
  name: z.string(),
  /** Agent 定义文件路径 */
  path: z.string(),
  /** 审查顺序（数值越小越靠前） */
  order: z.number().int(),
});

export type ReviewerConfig = z.infer<typeof ReviewerConfigSchema>;

/**
 * ak47 项目配置
 *
 * 对应 `.ak47/config.yaml` 的完整类型定义，存储 ak47 运行所需的不可推断信息。
 */
export const Ak47ConfigSchema = z.object({
  /** 配置版本号 */
  version: z.string(),
  /** 项目名称 */
  projectName: z.string(),
  /** 已配置的平台列表 */
  platforms: z.array(PlatformConfigSchema),
  /** 启用的能力单元 id 列表 */
  enabledUnits: z.array(z.string()),
  /** 当前默认范式（可选，init 时不设置，change 时由用户选择） */
  paradigm: z.enum(['L1', 'L2', 'L3']).optional(),
  /** 记录初始化/升级时的 CLI 版本 */
  ak47Version: z.string().optional(),
  /** 自定义 Agent 映射（可选） */
  agentOverrides: z.record(z.string(), z.string()).optional(),
  /** 流程参数（可选） */
  flowParams: z.record(z.string(), z.unknown()).optional(),
  /** 自定义 Reviewer 配置（可选） */
  customReviewers: z.array(ReviewerConfigSchema).optional(),
  /** 用户自定义验证配置（可选，AK47 升级时保留） */
  validation: z.unknown().optional(),
  /** 配置创建时间（ISO 8601） */
  createdAt: z.string(),
  /** 配置最后更新时间（ISO 8601） */
  updatedAt: z.string(),
});

export type Ak47Config = z.infer<typeof Ak47ConfigSchema>;
