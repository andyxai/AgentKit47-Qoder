import type { ProjectProfile } from '../../types/project.js';
import type { EnabledUnit } from '../../types/units.js';

export interface RecommendationRule {
  id: string;
  condition: (profile: ProjectProfile, enabledUnits: EnabledUnit[]) => boolean;
  action: 'add' | 'remove' | 'suggest' | 'already_configured';
  units: string[];
  reason: string;
  priority: number;
}

export interface RuleExecutionResult {
  addedUnits: Set<string>;
  removedUnits: Set<string>;
  suggestedUnits: string[];
  alreadyConfigured: Set<string>;
  reasoning: string[];
  warnings: string[];
}

/**
 * 核心推荐规则集。
 *
 * 规则按 priority 降序执行：
 * - priority ≥ 8：强业务规则（语言检测、协作模式）
 * - priority = 5：中等建议规则（测试、审查、遗留项目）
 * - priority = 1：已有配置检测（避免重复配置）
 */
const RULES: RecommendationRule[] = [
  // ─────────────────────────────────────────────────────
  // R1 / R2：语言检测（最高优先级）
  // ─────────────────────────────────────────────────────
  {
    id: 'R1',
    condition: (profile) => profile.techStack.hasPython,
    action: 'add',
    units: ['rules-python'],
    reason: '项目包含 Python 代码，启用 Python 编码标准规则',
    priority: 10,
  },
  {
    id: 'R2',
    condition: (profile) => profile.techStack.hasTypeScript,
    action: 'add',
    units: ['rules-ts'],
    reason: '项目包含 TypeScript 代码，启用 TypeScript 编码标准规则',
    priority: 10,
  },

  // ─────────────────────────────────────────────────────
  // R8：协作模式 — add（高于 suggest 类规则）
  // ─────────────────────────────────────────────────────
  {
    id: 'R8',
    condition: (profile) => profile.collaboration.recommendedMode === 'collaboration',
    action: 'add',
    units: ['collab-sync'],
    reason: '协作模式下启用协作同步能力',
    priority: 8,
  },

  // ─────────────────────────────────────────────────────
  // R3 / R4 / R5：中等建议规则
  // ─────────────────────────────────────────────────────
  {
    id: 'R3',
    condition: (profile, enabledUnits) => {
      const hasTdd = enabledUnits.some((u) => u.unitId === 'skill-test-driven-development');
      return !profile.structure.hasTests && !hasTdd;
    },
    action: 'add',
    units: ['skill-test-driven-development'],
    reason: '新项目默认启用测试驱动开发技能，从开始就建立良好的测试习惯',
    priority: 5,
  },
  {
    id: 'R4',
    condition: (profile) => profile.collaboration.recommendedMode === 'collaboration',
    action: 'suggest',
    units: ['skill-requesting-code-review', 'ak47-agent-reviewer'],
    reason: '协作模式下建议启用代码审查相关能力',
    priority: 5,
  },
  {
    id: 'R5',
    condition: (profile) => profile.maturity === 'legacy',
    action: 'suggest',
    units: ['skill-systematic-debugging'],
    reason: '遗留项目建议启用系统化调试技能',
    priority: 5,
  },

  // ─────────────────────────────────────────────────────
  // R6 / R7：已有配置检测（最低优先级，兜底）
  // ─────────────────────────────────────────────────────
  {
    id: 'R6',
    condition: (profile) => profile.existingConfig.hasOpenspecDir,
    action: 'already_configured',
    units: ['spec-management'],
    reason: '检测到已存在 OpenSpec 目录，规格管理已配置',
    priority: 1,
  },
  {
    id: 'R7',
    condition: (profile) =>
      profile.existingConfig.hasQoderDir ||
      profile.existingConfig.hasAgentsMd ||
      profile.existingConfig.hasClaudeMd ||
      profile.existingConfig.hasCursorRules,
    action: 'already_configured',
    units: ['platform-config'],
    reason: '检测到已存在平台配置文件',
    priority: 1,
  },
];

/**
 * 执行推荐规则引擎。
 *
 * 执行流程：
 * 1. 按 priority 降序排序规则
 * 2. 依次检查 condition
 * 3. 匹配时执行对应 action，记录结果
 */
export function executeRules(
  profile: ProjectProfile,
  enabledUnits: EnabledUnit[]
): RuleExecutionResult {
  const result: RuleExecutionResult = {
    addedUnits: new Set<string>(),
    removedUnits: new Set<string>(),
    suggestedUnits: [],
    alreadyConfigured: new Set<string>(),
    reasoning: [],
    warnings: [],
  };

  const sortedRules = [...RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.condition(profile, enabledUnits)) {
      switch (rule.action) {
        case 'add': {
          for (const unit of rule.units) {
            result.addedUnits.add(unit);
          }
          break;
        }
        case 'remove': {
          for (const unit of rule.units) {
            result.removedUnits.add(unit);
          }
          break;
        }
        case 'suggest': {
          for (const unit of rule.units) {
            result.suggestedUnits.push(unit);
            result.warnings.push(`[建议] ${rule.reason}: ${unit}`);
          }
          break;
        }
        case 'already_configured': {
          for (const unit of rule.units) {
            result.alreadyConfigured.add(unit);
          }
          break;
        }
      }
      result.reasoning.push(`[${rule.id}] ${rule.reason}`);
    }
  }

  return result;
}
