import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { DeviationLogger } from '../../../src/core/orchestrator/deviation-logger.js';

describe('DeviationLogger', () => {
  let testDir: string;
  let logger: DeviationLogger;

  beforeEach(() => {
    // 创建临时测试目录
    testDir = path.join(__dirname, 'test-deviation-logger-' + Date.now());
    fs.mkdirSync(testDir, { recursive: true });
    logger = new DeviationLogger(testDir);
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('log()', () => {
    it('应该成功记录一条偏离', () => {
      logger.log({
        session: 'test-session-1',
        deviation: '跳过 brainstorming 直接写代码',
        ruleViolated: '使用 brainstorming 开始创造性工作',
        reason: '用户要求快速实现',
        impact: 'low',
        userApproval: true,
      });

      const recent = logger.getRecent(1);
      expect(recent).toHaveLength(1);
      expect(recent[0].deviation).toBe('跳过 brainstorming 直接写代码');
      expect(recent[0].impact).toBe('low');
      expect(recent[0].userApproval).toBe(true);
    });

    it('应该记录时间戳', () => {
      logger.log({
        deviation: '测试偏离',
        reason: '测试原因',
        impact: 'medium',
        userApproval: false,
      });

      const recent = logger.getRecent(1);
      expect(recent[0].timestamp).toBeDefined();
      // 时间戳应该是有效的 ISO 8601 格式
      expect(new Date(recent[0].timestamp).toISOString()).toBe(recent[0].timestamp);
    });

    it('应该记录多条偏离', () => {
      logger.log({
        deviation: '偏离 1',
        reason: '原因 1',
        impact: 'low',
        userApproval: true,
      });

      logger.log({
        deviation: '偏离 2',
        reason: '原因 2',
        impact: 'high',
        userApproval: true,
      });

      logger.log({
        deviation: '偏离 3',
        reason: '原因 3',
        impact: 'medium',
        userApproval: false,
      });

      const recent = logger.getRecent(10);
      expect(recent).toHaveLength(3);
      expect(recent[0].deviation).toBe('偏离 1');
      expect(recent[2].deviation).toBe('偏离 3');
    });
  });

  describe('getRecent()', () => {
    it('应该返回最近 N 条记录', () => {
      for (let i = 1; i <= 5; i++) {
        logger.log({
          deviation: `偏离 ${i}`,
          reason: `原因 ${i}`,
          impact: 'low',
          userApproval: true,
        });
      }

      const recent = logger.getRecent(3);
      expect(recent).toHaveLength(3);
      // 应该返回最新的 3 条
      expect(recent[0].deviation).toBe('偏离 3');
      expect(recent[2].deviation).toBe('偏离 5');
    });

    it('当记录少于请求数量时应返回所有记录', () => {
      logger.log({
        deviation: '唯一偏离',
        reason: '原因',
        impact: 'low',
        userApproval: true,
      });

      const recent = logger.getRecent(10);
      expect(recent).toHaveLength(1);
    });
  });

  describe('getImpactStats()', () => {
    it('应该正确统计影响级别分布', () => {
      logger.log({
        deviation: '低影响偏离',
        reason: '原因',
        impact: 'low',
        userApproval: true,
      });

      logger.log({
        deviation: '中影响偏离 1',
        reason: '原因',
        impact: 'medium',
        userApproval: true,
      });

      logger.log({
        deviation: '中影响偏离 2',
        reason: '原因',
        impact: 'medium',
        userApproval: true,
      });

      logger.log({
        deviation: '高影响偏离',
        reason: '原因',
        impact: 'high',
        userApproval: true,
      });

      const stats = logger.getImpactStats();
      expect(stats.low).toBe(1);
      expect(stats.medium).toBe(2);
      expect(stats.high).toBe(1);
    });

    it('没有记录时应返回零统计', () => {
      const stats = logger.getImpactStats();
      expect(stats.low).toBe(0);
      expect(stats.medium).toBe(0);
      expect(stats.high).toBe(0);
    });
  });

  describe('getTopReasons()', () => {
    it('应该返回高频偏离原因', () => {
      logger.log({
        deviation: '偏离 1',
        reason: '用户要求快速实现',
        impact: 'low',
        userApproval: true,
      });

      logger.log({
        deviation: '偏离 2',
        reason: '用户要求快速实现',
        impact: 'low',
        userApproval: true,
      });

      logger.log({
        deviation: '偏离 3',
        reason: '第三方库调用',
        impact: 'medium',
        userApproval: true,
      });

      const topReasons = logger.getTopReasons(5);
      expect(topReasons).toHaveLength(2);
      expect(topReasons[0].reason).toBe('用户要求快速实现');
      expect(topReasons[0].count).toBe(2);
      expect(topReasons[1].reason).toBe('第三方库调用');
      expect(topReasons[1].count).toBe(1);
    });

    it('应该限制返回数量', () => {
      logger.log({
        deviation: '偏离 1',
        reason: '原因 1',
        impact: 'low',
        userApproval: true,
      });

      logger.log({
        deviation: '偏离 2',
        reason: '原因 2',
        impact: 'low',
        userApproval: true,
      });

      logger.log({
        deviation: '偏离 3',
        reason: '原因 3',
        impact: 'low',
        userApproval: true,
      });

      const topReasons = logger.getTopReasons(2);
      expect(topReasons).toHaveLength(2);
    });
  });

  describe('持久化', () => {
    it('应该将记录保存到文件', () => {
      logger.log({
        deviation: '持久化测试',
        reason: '测试原因',
        impact: 'medium',
        userApproval: true,
      });

      const logPath = path.join(testDir, '.ak47', 'deviations.log');
      expect(fs.existsSync(logPath)).toBe(true);

      const content = fs.readFileSync(logPath, 'utf-8');
      expect(content).toContain('持久化测试');
      expect(content).toContain('测试原因');
    });

    it('应该从文件加载现有记录', () => {
      // 创建第一条记录
      logger.log({
        deviation: '第一条记录',
        reason: '原因 1',
        impact: 'low',
        userApproval: true,
      });

      // 创建新的 logger 实例（模拟重启）
      const logger2 = new DeviationLogger(testDir);

      // 应该加载之前的记录
      const recent = logger2.getRecent(10);
      expect(recent).toHaveLength(1);
      expect(recent[0].deviation).toBe('第一条记录');
    });
  });
});
