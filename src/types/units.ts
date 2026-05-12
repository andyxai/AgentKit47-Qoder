import { z } from 'zod';
import { PlatformIdSchema } from './project.js';

/**
 * 能力单元 A/B/C 三级分类
 * - A：平台配置类，通用复用
 * - B：Agent 角色类，需定制
 * - C：Skill 技能类，项目独占
 */
export const CapabilityUnitCategorySchema = z.enum(['A', 'B', 'C']);
export type CapabilityUnitCategory = z.infer<typeof CapabilityUnitCategorySchema>;

/**
 * 范式层级
 * - L1：需求变更（最完整流程）
 * - L2：技术实现
 * - L3：缺陷修复（最精简流程）
 */
export const ParadigmLevelSchema = z.enum(['L1', 'L2', 'L3']);
export type ParadigmLevel = z.infer<typeof ParadigmLevelSchema>;

/**
 * 单元文件规格：描述模板到输出的映射关系
 */
export const UnitFileSpecSchema = z.object({
  templatePath: z.string().describe('模板文件路径'),
  outputPath: z.string().describe('输出文件路径'),
  type: z.enum(['copy', 'render']).describe('copy=直接复制, render=模板渲染'),
});
export type UnitFileSpec = z.infer<typeof UnitFileSpecSchema>;

/**
 * 能力单元定义：最小可组合模块
 */
export const CapabilityUnitDefSchema = z.object({
  id: z.string().describe('单元唯一标识，如 ak47-agent-developer'),
  name: z.string().describe('显示名称'),
  category: CapabilityUnitCategorySchema.describe('A/B/C 资产分类'),
  description: z.string().describe('单元职责描述'),
  platforms: z.array(PlatformIdSchema).describe('支持的目标平台列表'),
  dependencies: z.array(z.string()).describe('依赖的其他单元 id'),
  paradigmLevels: z.array(ParadigmLevelSchema).describe('适用的范式层级'),
  // 设计文档补充字段
  source: z.enum(['openspec', 'superpowers', 'agentkit47']).optional().describe('单元来源'),
  suggests: z.array(z.string()).optional().describe('建议搭配的其他单元 ID（软关联，非强制）'),
  files: z.array(UnitFileSpecSchema).optional().describe('单元映射的文件列表'),
});
export type CapabilityUnitDef = z.infer<typeof CapabilityUnitDefSchema>;

/**
 * 启用的能力单元实例（配置或计划层面）
 */
export const EnabledUnitSchema = z.object({
  unitId: z.string().describe('引用的单元 id'),
  paradigm: ParadigmLevelSchema.describe('当前启用的范式层级'),
  customConfig: z.record(z.string(), z.unknown()).optional().describe('用户自定义配置项'),
});
export type EnabledUnit = z.infer<typeof EnabledUnitSchema>;

/**
 * 推荐结果：Recommender 模块的输出结构
 */
export const RecommendationResultSchema = z.object({
  units: z.array(EnabledUnitSchema).describe('推荐启用的单元列表'),
  collaborationMode: z.enum(['solo', 'collaboration']).describe('推荐的协作模式'),
  reasoning: z.array(z.string()).describe('推荐理由'),
  warnings: z.array(z.string()).describe('警告信息'),
});
export type RecommendationResult = z.infer<typeof RecommendationResultSchema>;

/**
 * 单元注册表：全局能力单元索引
 */
export type UnitRegistry = Map<string, CapabilityUnitDef>;
