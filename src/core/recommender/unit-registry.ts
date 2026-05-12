import type { CapabilityUnitDef, UnitRegistry } from '../../types/units.js';

/**
 * 硬编码的能力单元注册表（Phase 1）。
 * Phase 2 将从模板清单文件动态加载。
 */
const UNITS: CapabilityUnitDef[] = [
  // ═══════════════════════════════════════════════════════
  // Agent 角色（8 个）— category: 'B'（Agent 角色类，需定制）
  // ═══════════════════════════════════════════════════════
  {
    id: 'ak47-agent-developer',
    name: '开发者指令',
    category: 'B',
    description: '提供开发任务执行的核心 Agent 角色定义与指令模板，覆盖代码实现、重构与调试场景',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2', 'L3'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-agent-reviewer',
    name: '代码审查者',
    category: 'B',
    description: '负责代码审查、质量把关与评审流程执行，确保代码符合规范与设计意图',
    platforms: ['qoder', 'claude-code'],
    dependencies: ['ak47-agent-developer'],
    paradigmLevels: ['L1', 'L2', 'L3'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-agent-architect',
    name: '架构师',
    category: 'B',
    description: '负责系统架构设计、技术选型与Spec拆分，输出结构化设计文档',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-agent-po',
    name: '产品负责人',
    category: 'B',
    description: '负责需求分析、用户故事梳理与产品决策，衔接业务与技术',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-agent-scaffold-maintainer',
    name: '脚手架维护者',
    category: 'B',
    description: '负责项目脚手架、目录结构与基础配置的维护与升级',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-agent-process-guardian',
    name: '流程守护者',
    category: 'B',
    description: '负责监督 AI 工程化流程的合规执行，防止流程跳跃与关键步骤遗漏',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2', 'L3'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-agent-knowledge-engineer',
    name: '知识工程师',
    category: 'B',
    description: '负责领域知识调研、经验沉淀与知识资产治理，输出可复用的经验条目',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-agent-config-maintainer',
    name: '配置维护员',
    category: 'B',
    description: '负责项目 AI 工具配置的日常维护、版本管理与冲突解决',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1'],
    source: 'agentkit47',
    files: [],
  },

  // ═══════════════════════════════════════════════════════
  // Skill 技能（6 个）— category: 'C'（Skill 技能类，项目独占）
  // ═══════════════════════════════════════════════════════
  {
    id: 'ak47-skill-entry-guard',
    name: '入口判定',
    category: 'C',
    description: '根据变更范围与影响面自动判定流程入口（L1/L2/L3 范式选择）',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2', 'L3'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-skill-change-classification',
    name: '变更分类',
    category: 'C',
    description: '对代码变更进行影响面分级（接口/行为/实现）与分类标记',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-skill-anti-patterns',
    name: '反模式检查',
    category: 'C',
    description: '识别并拦截常见 AI 编程反模式（过早抽象、过度设计等）',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-skill-harness-design',
    name: '七层架构方法论',
    category: 'C',
    description: '提供 Harness 七层架构设计方法论与模板，指导系统级设计',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-skill-knowledge-research',
    name: '知识调研',
    category: 'C',
    description: '对技术方案进行深度调研，收集行业最佳实践与论文级参考资料',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'ak47-skill-experience-summarization',
    name: '经验总结',
    category: 'C',
    description: '将项目过程中的实践经验提炼为可复用的知识资产',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1'],
    source: 'agentkit47',
    files: [],
  },

  // ═══════════════════════════════════════════════════════
  // B 类：平台配置
  // ═══════════════════════════════════════════════════════
  {
    id: 'platform-config',
    name: '平台配置',
    category: 'B',
    description: 'AI 编程工具的通用平台配置模板，支持多平台适配',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2', 'L3'],
    source: 'agentkit47',
    files: [],
  },

  // ═══════════════════════════════════════════════════════
  // C 类：规则扩展（编码标准）
  // ═══════════════════════════════════════════════════════
  {
    id: 'rules-ts',
    name: 'TypeScript 编码标准',
    category: 'C',
    description: 'TypeScript 项目的编码规范、类型约束与最佳实践规则集',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2'],
    source: 'agentkit47',
    files: [],
  },
  {
    id: 'rules-python',
    name: 'Python 编码标准',
    category: 'C',
    description: 'Python 项目的编码规范、类型注解与最佳实践规则集',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2'],
    source: 'agentkit47',
    files: [],
  },
];

/**
 * 延迟初始化的全局注册表单例。
 */
let _registry: UnitRegistry | undefined;

function buildRegistry(): UnitRegistry {
  const map = new Map<string, CapabilityUnitDef>();
  for (const unit of UNITS) {
    map.set(unit.id, unit);
  }
  return map;
}

/**
 * 获取完整的能力单元注册表。
 */
export function getUnitRegistry(): Map<string, CapabilityUnitDef> {
  if (!_registry) {
    _registry = buildRegistry();
  }
  return _registry;
}

/**
 * 根据单元 ID 查询能力单元定义。
 * @returns 找到返回定义，否则返回 null
 */
export function getUnitById(id: string): CapabilityUnitDef | null {
  return getUnitRegistry().get(id) ?? null;
}
