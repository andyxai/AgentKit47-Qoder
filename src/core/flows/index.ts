/**
 * 流程定义
 *
 * 提供 L1/L2/L3 三种范式的步骤模板，用于 change 命令的流程引导。
 */

export interface FlowStep {
  /** 步骤编号 */
  id: number;
  /** 步骤名称 */
  name: string;
  /** 所属阶段 */
  phase: string;
  /** 步骤说明 */
  description: string;
  /** 负责 Agent */
  agent?: string;
  /** 验证方式 */
  validation?: string;
  /** 是否为里程碑（完成后建议 git commit） */
  milestone?: boolean;
}

const L1_STEPS: FlowStep[] = [
  {
    id: 1,
    name: '需求收集',
    phase: '需求定义',
    description: '明确用户需求、业务目标',
    agent: 'ak47-agent-po',
  },
  {
    id: 2,
    name: '需求文档化',
    phase: '需求定义',
    description: '生成需求文档（用户故事、验收标准）',
    agent: 'ak47-agent-po',
  },
  {
    id: 3,
    name: '需求评审',
    phase: '需求定义',
    description: 'reviewer Agent 加载 requirement-review checklist 评审需求',
    agent: 'ak47-agent-reviewer',
    milestone: true,
  },
  {
    id: 4,
    name: '架构设计',
    phase: '技术设计',
    description: '系统架构、模块设计',
    agent: 'ak47-agent-architect',
  },
  {
    id: 5,
    name: '技术选型',
    phase: '技术设计',
    description: '技术方案、依赖评估',
    agent: 'ak47-agent-architect',
  },
  {
    id: 6,
    name: '技术评审',
    phase: '技术设计',
    description: 'reviewer Agent 加载 architecture-review checklist 评审技术方案',
    agent: 'ak47-agent-reviewer',
    milestone: true,
  },
  {
    id: 7,
    name: '变更提案(Spec)',
    phase: '规范定义',
    description: '基于技术设计创建变更提案 (OpenSpec /opsx:propose)',
    agent: 'ak47-agent-architect',
  },
  {
    id: 8,
    name: 'Spec 评审',
    phase: '规范定义',
    description: 'reviewer Agent 加载 spec-review checklist 评审 Spec',
    agent: 'ak47-agent-reviewer',
    milestone: true,
  },
  {
    id: 9,
    name: '启动变更',
    phase: '规范定义',
    description: '应用提案开始实施 (OpenSpec /opsx:apply)',
    agent: 'ak47-agent-developer',
  },
  {
    id: 10,
    name: '编码实现',
    phase: '实现',
    description: 'ak47 启动 Developer Agent → TDD 循环 + 编码',
    agent: 'ak47-agent-developer',
  },
  {
    id: 11,
    name: '测试',
    phase: '实现',
    description: '单元测试、集成测试',
    agent: 'ak47-agent-developer',
  },
  {
    id: 12,
    name: '代码审查',
    phase: '实现',
    description: 'reviewer Agent 加载 code-review checklist 代码审查',
    agent: 'ak47-agent-reviewer',
    milestone: true,
  },
  {
    id: 13,
    name: '验收',
    phase: '交付归档',
    description: '确认满足验收标准',
    agent: 'ak47-agent-po',
  },
  {
    id: 14,
    name: '归档',
    phase: '交付归档',
    description: '归档 Spec 和变更',
    agent: 'ak47-agent-knowledge-engineer',
  },
];

const L2_STEPS: FlowStep[] = [
  {
    id: 1,
    name: '技术方案设计',
    phase: '技术设计',
    description: '系统架构、模块设计',
    agent: 'architect',
  },
  {
    id: 2,
    name: '方案评审',
    phase: '技术设计',
    description: 'reviewer 评审技术方案',
    agent: 'reviewer',
  },
  {
    id: 3,
    name: '需求影响判断',
    phase: '技术设计',
    description: '判断是否影响现有需求/用户故事/验收标准',
    agent: 'architect',
  },
  {
    id: 4,
    name: 'Spec 更新',
    phase: 'Spec更新',
    description: '更新现有 Spec（技术实现变更）',
    agent: 'architect',
  },
  {
    id: 5,
    name: 'Spec 验证',
    phase: 'Spec更新',
    description: '验证规范格式和完整性 (OpenSpec openspec validate)',
    agent: 'reviewer',
  },
  { id: 6, name: '启动变更', phase: 'Spec更新', description: '进入实现阶段', agent: 'developer' },
  {
    id: 7,
    name: '编码实现',
    phase: '实现',
    description: 'ak47 启动 Developer Agent → TDD 循环 + 编码',
    agent: 'developer',
  },
  { id: 8, name: '测试', phase: '实现', description: '单元测试、集成测试', agent: 'developer' },
  {
    id: 9,
    name: '代码审查',
    phase: '实现',
    description: 'reviewer Agent 加载 code-review checklist 代码审查',
    agent: 'reviewer',
  },
  { id: 10, name: '验收', phase: '交付归档', description: '确认满足技术要求', agent: 'reviewer' },
  {
    id: 11,
    name: '归档',
    phase: '交付归档',
    description: '归档 Spec 和变更',
    agent: 'knowledge-engineer',
  },
];

const L3_STEPS: FlowStep[] = [
  {
    id: 1,
    name: '问题复现',
    phase: '问题定位',
    description: 'Bug 报告（现象、复现步骤）',
    agent: 'developer',
  },
  { id: 2, name: '根因分析', phase: '问题定位', description: '根因分析报告', agent: 'developer' },
  {
    id: 3,
    name: '修复方案评审',
    phase: '问题定位',
    description: 'reviewer 评审修复方案',
    agent: 'reviewer',
  },
  {
    id: 4,
    name: '修复方案设计',
    phase: '修复方案',
    description: '修复方案文档',
    agent: 'developer',
  },
  {
    id: 5,
    name: 'Spec 更新',
    phase: '修复方案',
    description: '更新相关 Spec（如边界条件变更）',
    agent: 'developer',
  },
  {
    id: 6,
    name: '启动修复',
    phase: '修复方案',
    description: '进入修复实现阶段',
    agent: 'developer',
  },
  {
    id: 7,
    name: '修复实现',
    phase: '实现',
    description: 'ak47 启动 Developer Agent → 编码修复',
    agent: 'developer',
  },
  { id: 8, name: '回归测试', phase: '实现', description: '回归测试验证', agent: 'developer' },
  {
    id: 9,
    name: '代码审查',
    phase: '实现',
    description: 'reviewer Agent 加载 code-review checklist 代码审查',
    agent: 'reviewer',
  },
  { id: 10, name: '验证确认', phase: '交付归档', description: '确认问题已解决', agent: 'reviewer' },
  {
    id: 11,
    name: '归档',
    phase: '交付归档',
    description: '记录问题和修复方案',
    agent: 'knowledge-engineer',
  },
];

/**
 * 获取指定范式的流程定义
 *
 * @param paradigm - 范式层级：L1（需求变更）、L2（技术实现）、L3（缺陷修复）
 * @returns 该范式下的步骤列表副本
 * @throws 不支持的范式时抛出错误
 */
export function getFlowDefinition(paradigm: 'L1' | 'L2' | 'L3'): FlowStep[] {
  switch (paradigm) {
    case 'L1':
      return [...L1_STEPS];
    case 'L2':
      return [...L2_STEPS];
    case 'L3':
      return [...L3_STEPS];
    default:
      throw new Error(`不支持的范式: ${paradigm}`);
  }
}
