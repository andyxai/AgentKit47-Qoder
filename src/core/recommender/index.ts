import type { ProjectProfile } from '../../types/project.js';
import type { EnabledUnit, ParadigmLevel, RecommendationResult } from '../../types/units.js';
import { getPresetUnits, getAllRegisteredUnits } from './presets.js';
import { executeRules } from './rules.js';

/**
 * Recommender 核心编排函数。
 *
 * 推荐流程：
 * 1. 加载预设（init 全量模式 or change 范式模式）→ 生成初始 enabledUnits 列表
 * 2. 执行规则引擎 → 获取 add / remove / suggest / already_configured 结果
 * 3. 合并规则结果 → add 追加，remove 删除，suggest 不自动执行
 * 4. 应用用户自定义 additions / removals
 * 5. 去重（通过 Set 保证）
 * 6. 组装并返回 RecommendationResult
 */
export async function recommend(
  profile: ProjectProfile,
  paradigm?: ParadigmLevel | 'all',
  userAdditions?: string[],
  userRemovals?: string[]
): Promise<RecommendationResult> {
  // 1. 加载预设
  let presetUnitIds: string[];
  let resolvedParadigm: ParadigmLevel;

  if (paradigm === 'all' || paradigm === undefined) {
    // init 全量模式：加载所有注册的单元
    presetUnitIds = getAllRegisteredUnits();
    resolvedParadigm = 'L1'; // 默认标记为 L1，实际 init 不关注 paradigm
  } else {
    // change 范式模式：根据 L1/L2/L3 加载预设
    presetUnitIds = getPresetUnits(paradigm);
    resolvedParadigm = paradigm;
  }

  const enabledUnits: EnabledUnit[] = presetUnitIds.map((unitId) => ({
    unitId,
    paradigm: resolvedParadigm,
  }));

  // 2. 执行规则引擎
  const ruleResult = executeRules(profile, enabledUnits);

  // 3. 合并规则结果
  // add：追加到列表（避免重复）
  for (const unitId of ruleResult.addedUnits) {
    if (!enabledUnits.some((u) => u.unitId === unitId)) {
      enabledUnits.push({ unitId, paradigm: resolvedParadigm });
    }
  }
  // remove：从列表中删除
  for (const unitId of ruleResult.removedUnits) {
    const idx = enabledUnits.findIndex((u) => u.unitId === unitId);
    if (idx !== -1) {
      enabledUnits.splice(idx, 1);
    }
  }

  // 4. 应用用户自定义 additions
  if (userAdditions && userAdditions.length > 0) {
    for (const unitId of userAdditions) {
      if (!enabledUnits.some((u) => u.unitId === unitId)) {
        enabledUnits.push({ unitId, paradigm: resolvedParadigm });
      }
    }
  }
  // 应用用户自定义 removals
  if (userRemovals && userRemovals.length > 0) {
    for (const unitId of userRemovals) {
      const idx = enabledUnits.findIndex((u) => u.unitId === unitId);
      if (idx !== -1) {
        enabledUnits.splice(idx, 1);
      }
    }
  }

  // 5. 去重保障（虽然前面的逻辑已避免重复，仍做最终兜底）
  const seen = new Set<string>();
  const dedupedUnits: EnabledUnit[] = [];
  for (const unit of enabledUnits) {
    if (!seen.has(unit.unitId)) {
      seen.add(unit.unitId);
      dedupedUnits.push(unit);
    }
  }

  // 6. 组装结果
  return {
    units: dedupedUnits,
    collaborationMode: profile.collaboration.recommendedMode,
    reasoning: ruleResult.reasoning,
    warnings: ruleResult.warnings,
  };
}
