import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RulesEnforcer, Rule } from '../../../src/core/orchestrator/rules-enforcer.js';

describe('RulesEnforcer', () => {
  let testDir: string;
  let enforcer: RulesEnforcer;

  beforeEach(() => {
    // 创建临时测试目录
    testDir = path.join(__dirname, 'test-rules-enforcer-' + Date.now());
    fs.mkdirSync(testDir, { recursive: true });
    enforcer = new RulesEnforcer(testDir);
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('registerRule()', () => {
    it('应该成功注册规则', () => {
      const rule: Rule = {
        id: 'test-rule',
        description: '测试规则',
        level: 'hard',
        check: () => true,
      };

      enforcer.registerRule(rule);

      // 注册后检查应该包含这个规则
      // 由于没有公开的 rules 属性，我们通过 checkAllRules 间接测试
    });
  });

  describe('registerDefaultRules()', () => {
    it('应该注册默认规则', () => {
      enforcer.registerDefaultRules();

      // 至少注册了 3 个默认规则
      // 通过 checkAllRules 测试
    });
  });

  describe('checkAllRules()', () => {
    it('应该返回通过的规则检查', async () => {
      enforcer.registerRule({
        id: 'always-pass',
        description: '总是通过的规则',
        level: 'hard',
        check: () => true,
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      expect(violations).toHaveLength(0);
    });

    it('应该返回违反的规则', async () => {
      enforcer.registerRule({
        id: 'always-fail',
        description: '总是失败的规则',
        level: 'strong',
        check: () => false,
        suggestion: '建议操作',
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      expect(violations).toHaveLength(1);
      expect(violations[0].rule.id).toBe('always-fail');
      expect(violations[0].suggestion).toBe('建议操作');
    });

    it('应该处理异步规则检查', async () => {
      enforcer.registerRule({
        id: 'async-rule',
        description: '异步规则',
        level: 'suggestion',
        check: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return false;
        },
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      expect(violations).toHaveLength(1);
    });

    it('应该检查多个规则', async () => {
      enforcer.registerRule({
        id: 'rule-1',
        description: '规则 1',
        level: 'hard',
        check: () => true,
      });

      enforcer.registerRule({
        id: 'rule-2',
        description: '规则 2',
        level: 'strong',
        check: () => false,
      });

      enforcer.registerRule({
        id: 'rule-3',
        description: '规则 3',
        level: 'suggestion',
        check: () => false,
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      expect(violations).toHaveLength(2);
      expect(violations[0].rule.id).toBe('rule-2');
      expect(violations[1].rule.id).toBe('rule-3');
    });
  });

  describe('handleViolation()', () => {
    it('硬规则违反且非强制继续时应抛出错误', async () => {
      enforcer.registerRule({
        id: 'hard-rule',
        description: '硬规则',
        level: 'hard',
        check: () => false,
        suggestion: '必须遵守',
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      await expect(
        enforcer.handleViolation(violations[0], { projectRoot: testDir })
      ).rejects.toThrow('违反硬规则: 硬规则');
    });

    it('硬规则违反但强制继续时应记录偏离', async () => {
      enforcer.registerRule({
        id: 'hard-rule',
        description: '硬规则',
        level: 'hard',
        check: () => false,
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      // 不应该抛出错误
      await enforcer.handleViolation(violations[0], { projectRoot: testDir }, true);

      // 应该记录偏离
      const stats = enforcer.getDeviationStats();
      expect(stats.recent).toHaveLength(1);
    });

    it('强建议违反时应警告并记录', async () => {
      enforcer.registerRule({
        id: 'strong-suggestion',
        description: '强建议',
        level: 'strong',
        check: () => false,
        suggestion: '建议遵守',
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      // 不应该抛出错误
      await enforcer.handleViolation(violations[0], { projectRoot: testDir });

      // 应该记录偏离
      const stats = enforcer.getDeviationStats();
      expect(stats.recent).toHaveLength(1);
      expect(stats.recent[0].impact).toBe('medium');
    });

    it('建议违反时应仅提示不记录', async () => {
      enforcer.registerRule({
        id: 'suggestion',
        description: '建议',
        level: 'suggestion',
        check: () => false,
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      // 不应该抛出错误
      await enforcer.handleViolation(violations[0], { projectRoot: testDir });

      // 建议级别不应记录到偏离日志
      const stats = enforcer.getDeviationStats();
      expect(stats.recent).toHaveLength(0);
    });
  });

  describe('getDeviationStats()', () => {
    it('应该返回完整的统计信息', async () => {
      // 创建 openspec 目录避免硬规则违反
      const openspecDir = path.join(testDir, 'openspec', 'changes', 'test-change');
      fs.mkdirSync(openspecDir, { recursive: true });

      enforcer.registerDefaultRules();

      // 触发一些偏离
      enforcer.registerRule({
        id: 'test-violation-1',
        description: '测试偏离 1',
        level: 'strong',
        check: () => false,
      });

      enforcer.registerRule({
        id: 'test-violation-2',
        description: '测试偏离 2',
        level: 'strong',
        check: () => false,
      });

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      for (const violation of violations) {
        await enforcer.handleViolation(violation, { projectRoot: testDir });
      }

      const stats = enforcer.getDeviationStats();

      expect(stats).toHaveProperty('impact');
      expect(stats).toHaveProperty('topReasons');
      expect(stats).toHaveProperty('recent');
      expect(Array.isArray(stats.recent)).toBe(true);
    });
  });

  describe('集成测试：默认规则', () => {
    it('no-spec-no-code 规则应检查 openspec 目录', async () => {
      enforcer.registerDefaultRules();

      // 没有 openspec 目录时应违反
      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      const noSpecViolation = violations.find(
        (v) => v.rule.id === 'no-spec-no-code'
      );

      expect(noSpecViolation).toBeDefined();
    });

    it('有 openspec 目录时应通过 no-spec-no-code 规则', async () => {
      // 创建 openspec 目录结构
      const openspecDir = path.join(testDir, 'openspec', 'changes');
      fs.mkdirSync(openspecDir, { recursive: true });
      
      // 创建一个变更目录
      fs.mkdirSync(path.join(openspecDir, 'test-change'), { recursive: true });

      enforcer.registerDefaultRules();

      const violations = await enforcer.checkAllRules({
        projectRoot: testDir,
      });

      const noSpecViolation = violations.find(
        (v) => v.rule.id === 'no-spec-no-code'
      );

      // 应该通过检查（没有违反）
      expect(noSpecViolation).toBeUndefined();
    });
  });
});
