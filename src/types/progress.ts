import { z } from 'zod';

/**
 * 步骤执行状态
 */
export const StepStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'skipped',
  'failed',
]);

export type StepStatus = z.infer<typeof StepStatusSchema>;

/**
 * 引导步骤定义
 *
 * 描述 ak47 流程中的一个步骤，包含标题、说明、状态及需要执行的命令。
 */
export const GuidedStepSchema = z.object({
  /** 步骤唯一标识 */
  id: z.string(),
  /** 步骤标题 */
  title: z.string(),
  /** 步骤详细说明 */
  description: z.string().optional(),
  /** 当前执行状态 */
  status: StepStatusSchema,
  /** 该步骤需要执行的命令列表 */
  commands: z.array(z.string()).optional(),
});

export type GuidedStep = z.infer<typeof GuidedStepSchema>;

/**
 * 流程进度状态
 *
 * 记录当前流程的执行进度，用于 `.ak47/progress.yaml` 的读写。
 */
export const ProgressStateSchema = z.object({
  /** 当前步骤 id */
  currentStep: z.string(),
  /** 所有步骤的状态 */
  steps: z.array(GuidedStepSchema),
  /** 流程开始时间（ISO 8601） */
  startedAt: z.string(),
  /** 最后更新时间（ISO 8601） */
  updatedAt: z.string(),
});

export type ProgressState = z.infer<typeof ProgressStateSchema>;

/**
 * L1/L2/L3 流程定义
 *
 * 描述某一范式下包含的步骤模板，用于流程初始化时加载。
 */
export const FlowDefinitionSchema = z.object({
  /** 所属范式 */
  paradigm: z.enum(['L1', 'L2', 'L3']),
  /** 该流程包含的步骤模板 */
  steps: z.array(GuidedStepSchema),
});

export type FlowDefinition = z.infer<typeof FlowDefinitionSchema>;
