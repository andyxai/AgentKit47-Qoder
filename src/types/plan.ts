import { z } from 'zod';

/**
 * 文件操作：生成计划中的单个文件条目
 */
export const FileActionSchema = z.object({
  path: z.string().describe('目标文件路径'),
  action: z.enum(['create', 'update', 'skip']).describe('文件操作类型'),
  templatePath: z.string().optional().describe('模板文件路径（模板渲染时使用）'),
  variables: z.record(z.string(), z.unknown()).optional().describe('Mustache 模板变量'),
  content: z.string().optional().describe('直接内容（非模板时使用）'),
});
export type FileAction = z.infer<typeof FileActionSchema>;

/**
 * 安装步骤：需要安装的外部工具或依赖包
 */
export const InstallStepSchema = z.object({
  tool: z.enum(['openspec', 'superpowers']).describe('工具名称'),
  action: z.enum(['install', 'init', 'guide']).describe('操作类型'),
  command: z.string().optional().describe('安装/初始化命令'),
  message: z.string().describe('向用户展示的提示信息'),
});
export type InstallStep = z.infer<typeof InstallStepSchema>;

/**
 * 缺失组件：增强计划中识别到的项目缺失项
 */
export const MissingComponentSchema = z.object({
  type: z.enum(['spec', 'architecture', 'tests', 'ci', 'docs']).describe('缺失类型'),
  description: z.string().describe('缺失描述'),
  suggestion: z.string().describe('补全建议'),
});
export type MissingComponent = z.infer<typeof MissingComponentSchema>;

/**
 * 生成计划：init / add 命令的核心输出
 */
export const GenerationPlanSchema = z.object({
  files: z.array(FileActionSchema).describe('计划生成的文件列表'),
  dependencies: z.array(z.string()).describe('需要安装的 npm 包等依赖'),
  postActions: z.array(z.string()).describe('生成后需要执行的命令'),
  // 设计文档补充字段
  installations: z.array(InstallStepSchema).optional().describe('外部工具安装步骤'),
});
export type GenerationPlan = z.infer<typeof GenerationPlanSchema>;

/**
 * 增强计划：change 命令输出（对现有项目的增量修改）
 */
export const AugmentationPlanSchema = z.object({
  additions: z.array(FileActionSchema).describe('新增文件列表'),
  modifications: z.array(FileActionSchema).describe('修改文件列表'),
  removals: z.array(z.string()).describe('删除文件路径列表'),
  // 设计文档补充字段
  missingComponents: z.array(MissingComponentSchema).optional().describe('识别到的缺失组件'),
});
export type AugmentationPlan = z.infer<typeof AugmentationPlanSchema>;
