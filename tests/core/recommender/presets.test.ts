import { describe, it, expect } from 'vitest';
import { getPresetUnits } from '../../../src/core/recommender/presets.js';

describe('getPresetUnits', () => {
  it('L1 预设返回 15 个单元 ID', () => {
    const l1 = getPresetUnits('L1');
    expect(l1).toHaveLength(15);
  });

  it('L2 预设返回 9 个单元 ID', () => {
    const l2 = getPresetUnits('L2');
    expect(l2).toHaveLength(9);
  });

  it('L3 预设返回 6 个单元 ID', () => {
    const l3 = getPresetUnits('L3');
    expect(l3).toHaveLength(6);
  });

  it('层级包含关系：L3 的每个单元都在 L2 中（除了 L3 独有的 systematic-debugging）, L2 的每个单元都在 L1 中', () => {
    const l1 = getPresetUnits('L1');
    const l2 = getPresetUnits('L2');
    const l3 = getPresetUnits('L3');

    // L2 ⊂ L1
    for (const unit of l2) {
      expect(l1).toContain(unit);
    }

    // L3 中除独有单元外都在 L2 中
    const l3Set = new Set(l3);
    const l3Exclusive = 'ak47-skill-systematic-debugging';
    for (const unit of l3) {
      if (unit !== l3Exclusive) {
        expect(l2).toContain(unit);
      }
    }
    expect(l3Set.has(l3Exclusive)).toBe(true);
  });

  it('所有预设单元 ID 格式正确（非空字符串）', () => {
    const l1 = getPresetUnits('L1');
    const l2 = getPresetUnits('L2');
    const l3 = getPresetUnits('L3');

    for (const unit of [...l1, ...l2, ...l3]) {
      expect(typeof unit).toBe('string');
      expect(unit.length).toBeGreaterThan(0);
      expect(unit.trim()).toBe(unit);
    }
  });
});
