/**
 * 进度追踪器
 *
 * 提供引导步骤完成状态检测及标记能力，用于 Orchestrator 流程推进。
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { loadProgress } from '../../utils/progress.js';
import type { ProgressState } from '../../types/index.js';

interface GuidedStepRecord {
  stepId: string;
  status: string;
  guidedAt: string;
  userConfirmed: boolean;
}

/**
 * 检查指定步骤是否已完成引导
 *
 * @param progress - 当前进度状态（可能为 null）
 * @param stepId - 步骤唯一标识
 * @returns 该步骤已标记为 completed 返回 true
 */
export function isStepGuided(progress: ProgressState | null, stepId: string): boolean {
  if (!progress) {
    return false;
  }

  const guidedSteps = (progress as ProgressState & { guidedSteps?: GuidedStepRecord[] })
    .guidedSteps;
  if (!Array.isArray(guidedSteps)) {
    return false;
  }

  return guidedSteps.some((step) => step.stepId === stepId && step.status === 'completed');
}

/**
 * 将指定步骤标记为已引导完成
 *
 * 直接操作 progress.yaml，保留 guidedSteps 等扩展字段。
 *
 * @param progressPath - progress.yaml 的绝对路径
 * @param stepId - 步骤唯一标识
 */
export async function markStepGuided(progressPath: string, stepId: string): Promise<void> {
  const projectRoot = dirname(dirname(progressPath));

  let progress: Record<string, unknown> = {};

  try {
    if (existsSync(progressPath)) {
      const raw = await readFile(progressPath, 'utf-8');
      progress = (parse(raw) as Record<string, unknown>) || {};
    }
  } catch (err) {
    console.warn(`[ak47] 读取 progress 失败：${err instanceof Error ? err.message : String(err)}`);
  }

  if (!progress.currentStep) {
    const base = await loadProgress(projectRoot);
    if (base) {
      progress = { ...base };
    } else {
      progress = {
        currentStep: stepId,
        steps: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (!Array.isArray(progress.guidedSteps)) {
    progress.guidedSteps = [];
  }

  const guidedSteps = progress.guidedSteps as GuidedStepRecord[];
  const existingIndex = guidedSteps.findIndex((s) => s.stepId === stepId);

  const record: GuidedStepRecord = {
    stepId,
    status: 'completed',
    guidedAt: new Date().toISOString(),
    userConfirmed: true,
  };

  if (existingIndex >= 0) {
    guidedSteps[existingIndex] = record;
  } else {
    guidedSteps.push(record);
  }

  progress.updatedAt = new Date().toISOString();

  try {
    const raw = stringify(progress, { sortMapEntries: true });
    await writeFile(progressPath, raw, 'utf-8');
  } catch (err) {
    console.warn(`[ak47] 保存 progress 失败：${err instanceof Error ? err.message : String(err)}`);
  }
}
