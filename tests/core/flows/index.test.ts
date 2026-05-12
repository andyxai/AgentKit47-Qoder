import { describe, it, expect } from 'vitest';
import { getFlowDefinition, type FlowStep } from '../../../src/core/flows/index.js';

describe('getFlowDefinition', () => {
  const l1Agents = new Set([
    'ak47-agent-po',
    'ak47-agent-reviewer',
    'ak47-agent-architect',
    'ak47-agent-developer',
    'ak47-agent-knowledge-engineer',
  ]);

  const l2l3Agents = new Set(['architect', 'reviewer', 'developer', 'knowledge-engineer']);

  const knownPhases = new Set([
    '需求定义',
    '技术设计',
    '规范定义',
    '实现',
    '交付归档',
    'Spec更新',
    '问题定位',
    '修复方案',
  ]);

  it('L1 returns 14 steps', () => {
    const steps = getFlowDefinition('L1');
    expect(steps).toHaveLength(14);
  });

  it('L2 returns 11 steps', () => {
    const steps = getFlowDefinition('L2');
    expect(steps).toHaveLength(11);
  });

  it('L3 returns 11 steps', () => {
    const steps = getFlowDefinition('L3');
    expect(steps).toHaveLength(11);
  });

  it('each step has id, name, phase, description', () => {
    for (const paradigm of ['L1', 'L2', 'L3'] as const) {
      const steps = getFlowDefinition(paradigm);
      for (const step of steps) {
        expect(step.id).toBeDefined();
        expect(typeof step.id).toBe('number');
        expect(step.name).toBeDefined();
        expect(typeof step.name).toBe('string');
        expect(step.phase).toBeDefined();
        expect(typeof step.phase).toBe('string');
        expect(step.description).toBeDefined();
        expect(typeof step.description).toBe('string');
      }
    }
  });

  it('L1 has 4 milestones at steps 3, 6, 8, 12', () => {
    const steps = getFlowDefinition('L1');
    const milestones = steps.filter((s) => s.milestone === true);
    expect(milestones).toHaveLength(4);
    expect(milestones.map((s) => s.id)).toEqual([3, 6, 8, 12]);
  });

  it('all steps have phase belonging to known phase set', () => {
    for (const paradigm of ['L1', 'L2', 'L3'] as const) {
      const steps = getFlowDefinition(paradigm);
      for (const step of steps) {
        expect(knownPhases.has(step.phase)).toBe(true);
      }
    }
  });

  it('agent field references valid agent id', () => {
    const l1Steps = getFlowDefinition('L1');
    for (const step of l1Steps) {
      if (step.agent) {
        expect(l1Agents.has(step.agent)).toBe(true);
      }
    }

    for (const paradigm of ['L2', 'L3'] as const) {
      const steps = getFlowDefinition(paradigm);
      for (const step of steps) {
        if (step.agent) {
          expect(l2l3Agents.has(step.agent)).toBe(true);
        }
      }
    }
  });

  it('returns a new array instance on each call', () => {
    const steps1 = getFlowDefinition('L1');
    const steps2 = getFlowDefinition('L1');
    expect(steps1).not.toBe(steps2);
    expect(steps1).toEqual(steps2);
  });

  it('throws on unsupported paradigm', () => {
    expect(() => getFlowDefinition('L4' as 'L1')).toThrow('不支持的范式');
  });
});
