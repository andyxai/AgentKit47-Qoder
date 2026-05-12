/**
 * 进度读写工具
 *
 * 提供 `.ak47/progress.yaml` 的读取、写入及步骤状态更新能力。
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import { type ProgressState, ProgressStateSchema, type StepStatus } from '../types/index.js';
import { getProgressPath, getAk47Dir, ensureDir } from './paths.js';

/**
 * 读取 `.ak47/progress.yaml`，不存在返回 null
 *
 * @param projectRoot - 项目根目录，默认自动查找
 * @returns 验证通过的进度对象；文件不存在或验证失败时返回 null
 */
export async function loadProgress(projectRoot?: string): Promise<ProgressState | null> {
  const progressPath = getProgressPath(projectRoot);

  if (!existsSync(progressPath)) {
    return null;
  }

  try {
    const raw = await readFile(progressPath, 'utf-8');
    const parsed = parse(raw);
    const result = ProgressStateSchema.safeParse(parsed);

    if (!result.success) {
      console.warn(`[ak47] progress.yaml 验证失败：${result.error.message}`);
      return null;
    }

    return result.data;
  } catch (err) {
    console.warn(
      `[ak47] 读取 progress.yaml 失败：${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

/**
 * 写入 progress.yaml
 *
 * @param progress - 要写入的进度对象
 * @param projectRoot - 项目根目录，默认自动查找
 */
export async function saveProgress(progress: ProgressState, projectRoot?: string): Promise<void> {
  const progressPath = getProgressPath(projectRoot);
  await ensureDir(getAk47Dir(projectRoot));

  const raw = stringify(progress, {
    sortMapEntries: true,
  });

  await writeFile(progressPath, raw, 'utf-8');
}

/**
 * 更新某个步骤的状态
 *
 * 若进度文件不存在，或指定步骤未找到，则返回 null。
 *
 * @param stepId - 步骤唯一标识
 * @param status - 新的步骤状态
 * @param projectRoot - 项目根目录，默认自动查找
 * @returns 更新后的进度对象；无进度文件或步骤不存在时返回 null
 */
export async function updateStepStatus(
  stepId: string,
  status: StepStatus,
  projectRoot?: string
): Promise<ProgressState | null> {
  const progress = await loadProgress(projectRoot);

  if (!progress) {
    return null;
  }

  const stepIndex = progress.steps.findIndex((s) => s.id === stepId);
  if (stepIndex === -1) {
    console.warn(`[ak47] 步骤 ${stepId} 未在 progress 中找到`);
    return null;
  }

  const updated: ProgressState = {
    ...progress,
    steps: progress.steps.map((s, idx) => (idx === stepIndex ? { ...s, status } : s)),
    updatedAt: new Date().toISOString(),
  };

  await saveProgress(updated, projectRoot);
  return updated;
}
