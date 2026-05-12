import { z } from 'zod';

// ───────────────────────────────────────────────
// Scanner 输出类型 — 项目扫描相关类型定义
// ───────────────────────────────────────────────

/**
 * 支持的 AI 平台标识
 */
export const PlatformIdSchema = z.enum([
  'qoder',
  'claude-code',
]);
export type PlatformId = z.infer<typeof PlatformIdSchema>;

/**
 * 项目成熟度等级
 */
export const ProjectMaturitySchema = z.enum(['greenfield', 'growing', 'mature', 'legacy']);
export type ProjectMaturity = z.infer<typeof ProjectMaturitySchema>;

/**
 * 技术栈信息
 */
export const TechStackInfoSchema = z.object({
  primaryLanguage: z.string().nullable(),
  framework: z.string().nullable(),
  buildTool: z.string().nullable(),
  testFramework: z.string().nullable(),
  packageManager: z.enum(['npm', 'yarn', 'pnpm', 'pip', 'go']).nullable(),
  hasTypeScript: z.boolean(),
  hasPython: z.boolean(),
});
export type TechStackInfo = z.infer<typeof TechStackInfoSchema>;

/**
 * 项目结构信息
 */
export const ProjectStructureSchema = z.object({
  isMonorepo: z.boolean(),
  srcDir: z.string().nullable(),
  hasTests: z.boolean(),
  hasDocs: z.boolean(),
  hasCI: z.boolean(),
  fileCount: z.number().int().nonnegative(),
});
export type ProjectStructure = z.infer<typeof ProjectStructureSchema>;

/**
 * 检测到的 AI 平台
 */
export const DetectedPlatformSchema = z.object({
  id: PlatformIdSchema,
  configFiles: z.array(z.string()),
});
export type DetectedPlatform = z.infer<typeof DetectedPlatformSchema>;

/**
 * AI 平台检测结果（含已安装与候选平台）
 */
export const PlatformDetectionResultSchema = z.object({
  detected: z.array(DetectedPlatformSchema),
  candidates: z.array(DetectedPlatformSchema),
});
export type PlatformDetectionResult = z.infer<typeof PlatformDetectionResultSchema>;

/**
 * 协作信息
 */
export const CollaborationInfoSchema = z.object({
  contributorCount: z.number().int().nonnegative(),
  branchCount: z.number().int().nonnegative(),
  hasGit: z.boolean(),
  isActive: z.boolean(),
  recommendedMode: z.enum(['solo', 'collaboration']),
});
export type CollaborationInfo = z.infer<typeof CollaborationInfoSchema>;

/**
 * 已有 AI 工具配置映射
 */
export const ExistingConfigMapSchema = z.object({
  hasAgentsMd: z.boolean(),
  hasClaudeMd: z.boolean(),
  hasCursorRules: z.boolean(),
  hasQoderDir: z.boolean(),
  hasOpenspecDir: z.boolean(),
});
export type ExistingConfigMap = z.infer<typeof ExistingConfigMapSchema>;

/**
 * 项目缺口
 */
export const ProjectGapSchema = z.object({
  id: z.string(),
  severity: z.enum(['info', 'warn', 'critical']),
  description: z.string(),
  suggestion: z.string(),
});
export type ProjectGap = z.infer<typeof ProjectGapSchema>;

/**
 * 完整项目画像（Scanner 核心输出）
 */
export const ProjectProfileSchema = z.object({
  techStack: TechStackInfoSchema,
  structure: ProjectStructureSchema,
  platforms: PlatformDetectionResultSchema,
  collaboration: CollaborationInfoSchema,
  maturity: ProjectMaturitySchema,
  projectState: z.enum(['greenfield', 'existing']),
  existingConfig: ExistingConfigMapSchema,
  gaps: z.array(ProjectGapSchema),
});
export type ProjectProfile = z.infer<typeof ProjectProfileSchema>;
