import type { ParadigmLevel } from '../../types/units.js';

/**
 * 范式层级预设单元映射。
 *
 * 体现包含关系：L3 ⊂ L2 ⊂ L1
 * - L1（需求变更）：最完整流程，包含全部 Agent 与 Skill
 * - L2（技术实现）：中等粒度，聚焦开发核心能力
 * - L3（缺陷修复）：最精简流程，保留最小必要集 + 调试技能
 */
const PRESETS: Record<ParadigmLevel, readonly string[]> = {
  L1: [
    // Agent 角色（8 个）
    'ak47-agent-developer',
    'ak47-agent-reviewer',
    'ak47-agent-architect',
    'ak47-agent-po',
    'ak47-agent-scaffold-maintainer',
    'ak47-agent-process-guardian',
    'ak47-agent-knowledge-engineer',
    'ak47-agent-config-maintainer',
    // Skill（8 个）
    'ak47-skill-entry-guard',
    'ak47-skill-change-classification',
    'ak47-skill-anti-patterns',
    'ak47-skill-harness-design',
    'ak47-skill-knowledge-research',
    'ak47-skill-experience-summarization',
    'ak47-skill-improvement-proposal',
    'ak47-skill-improvement-audit',
    // 平台配置
    'platform-config',
  ],
  L2: [
    'ak47-agent-developer',
    'ak47-agent-reviewer',
    'ak47-agent-scaffold-maintainer',
    'ak47-agent-process-guardian',
    'ak47-skill-entry-guard',
    'ak47-skill-change-classification',
    'ak47-skill-anti-patterns',
    'ak47-skill-harness-design',
    'platform-config',
  ],
  L3: [
    'ak47-agent-developer',
    'ak47-agent-reviewer',
    'ak47-agent-process-guardian',
    'ak47-skill-entry-guard',
    'platform-config',
    // L3 独有 Skill（注册表外引用）
    'ak47-skill-systematic-debugging',
  ],
};

/**
 * 获取指定范式层级的预设单元 ID 列表。
 * @returns 单元 ID 数组的副本，避免外部修改
 */
export function getPresetUnits(paradigm: ParadigmLevel): string[] {
  return [...PRESETS[paradigm]];
}

/**
 * 获取所有注册的单元 ID（全量模式，用于 init）。
 * 合并 L1/L2/L3 所有预设，去重后返回。
 */
export function getAllRegisteredUnits(): string[] {
  const allUnits = new Set<string>();
  for (const units of Object.values(PRESETS)) {
    for (const unitId of units) {
      allUnits.add(unitId);
    }
  }
  return [...allUnits];
}
