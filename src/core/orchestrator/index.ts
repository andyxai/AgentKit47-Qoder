/**
 * Orchestrator 入口
 *
 * 编排 OpenSpec 的安装设置流程，
 * 根据启用的能力单元按需触发对应设置模块。
 */

import { setupOpenSpec } from './openspec-setup.js';
import { markStepGuided } from './progress-tracker.js';
import type { EnabledUnit } from '../../types/units.js';
import { getProgressPath } from '../../utils/paths.js';

/**
 * 判断单元是否需要 OpenSpec（Agent 或 Skill 类单元）
 */
function needsOpenSpec(unit: EnabledUnit): boolean {
  return unit.unitId.startsWith('ak47-agent-') || unit.unitId.startsWith('ak47-skill-');
}

/**
 * 编排安装设置流程
 *
 * 1. 按需设置 OpenSpec
 * 2. 记录总进度
 *
 * @param enabledUnits - 已启用的能力单元列表
 * @param selectedPlatforms - 用户选中的目标平台列表
 * @param projectDir - 项目根目录
 */
export async function orchestrate(
  enabledUnits: EnabledUnit[],
  selectedPlatforms: string[],
  projectDir: string
): Promise<void> {
  try {
    const needsSpec = enabledUnits.some(needsOpenSpec);

    if (needsSpec) {
      await setupOpenSpec(enabledUnits, selectedPlatforms, projectDir);
    }

    const progressPath = getProgressPath(projectDir);
    await markStepGuided(progressPath, 'orchestration-complete');

    console.log('[ak47] 编排流程完成。');
  } catch (err) {
    console.warn(`[ak47] orchestrate 出错：${err instanceof Error ? err.message : String(err)}`);
  }
}
