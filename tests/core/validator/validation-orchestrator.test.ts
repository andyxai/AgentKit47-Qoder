/**
 * ValidationOrchestrator 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ValidationOrchestrator } from '../../../src/core/validator/validation-orchestrator.js';
import type { ValidationConfig } from '../../../src/core/validator/types.js';

describe('ValidationOrchestrator', () => {
  let tempDir: string;
  let orchestrator: ValidationOrchestrator;

  beforeEach(() => {
    // 创建临时目录
    tempDir = join(process.cwd(), 'test-temp-validation');
    mkdirSync(tempDir, { recursive: true });
    orchestrator = new ValidationOrchestrator(tempDir);
  });

  afterEach(() => {
    // 清理临时目录
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('triggerValidation', () => {
    it('should skip validation when disabled', async () => {
      // 创建不含 validation 配置的配置
      const configPath = join(tempDir, '.ak47');
      mkdirSync(configPath, { recursive: true });
      writeFileSync(
        join(configPath, 'config.yaml'),
        `version: '1.0.0'
projectName: test
platforms: []
enabledUnits: []
createdAt: 2026-05-07T00:00:00Z
updatedAt: 2026-05-07T00:00:00Z
`,
        'utf-8'
      );

      const result = await orchestrator.triggerValidation('test-change-001');

      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('validation disabled');
    });

    it('should skip validation when no types configured', async () => {
      // 创建含空 validation 配置
      const configPath = join(tempDir, '.ak47');
      mkdirSync(configPath, { recursive: true });
      writeFileSync(
        join(configPath, 'config.yaml'),
        `version: '1.0.0'
projectName: test
platforms: []
enabledUnits: []
createdAt: 2026-05-07T00:00:00Z
updatedAt: 2026-05-07T00:00:00Z
validation:
  enabled: true
  types: []
  on_failure:
    action: warn-and-continue
    message: "验证未通过"
`,
        'utf-8'
      );

      const result = await orchestrator.triggerValidation('test-change-001');

      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('no validation types configured');
    });

    it('should execute auto trigger validations', async () => {
      // 创建含 auto 验证类型的配置
      const configPath = join(tempDir, '.ak47');
      mkdirSync(configPath, { recursive: true });
      writeFileSync(
        join(configPath, 'config.yaml'),
        `version: '1.0.0'
projectName: test
platforms: []
enabledUnits: []
createdAt: 2026-05-07T00:00:00Z
updatedAt: 2026-05-07T00:00:00Z
validation:
  enabled: true
  types:
    - id: unit-test
      name: 单元测试
      skill: skill-test-driven-development
      trigger: auto
      required: true
  on_failure:
    action: warn-and-continue
    message: "验证未通过"
`,
        'utf-8'
      );

      const result = await orchestrator.triggerValidation('test-change-001');

      expect(result.status).toBe('passed');
      expect(result.total).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].validationType).toBe('unit-test');
      // 由于执行器未实现，应该是 skipped
      expect(result.results[0].status).toBe('skipped');
    });

    it('should archive validation results', async () => {
      // 创建配置
      const configPath = join(tempDir, '.ak47');
      mkdirSync(configPath, { recursive: true });
      writeFileSync(
        join(configPath, 'config.yaml'),
        `version: '1.0.0'
projectName: test
platforms: []
enabledUnits: []
createdAt: 2026-05-07T00:00:00Z
updatedAt: 2026-05-07T00:00:00Z
validation:
  enabled: true
  types:
    - id: test-validation
      name: 测试验证
      trigger: auto
      required: false
  on_failure:
    action: warn-and-continue
    message: "验证未通过"
`,
        'utf-8'
      );

      await orchestrator.triggerValidation('test-change-001');

      // 验证归档文件是否存在
      const resultsPath = join(
        tempDir,
        '.ak47',
        'changes',
        'test-change-001',
        'validation',
        'results.yaml'
      );

      expect(existsSync(resultsPath)).toBe(true);
    });
  });

  describe('loadValidationConfig', () => {
    it('should return default config when config file does not exist', async () => {
      // 不创建配置文件
      const result = await (orchestrator as any).loadValidationConfig();

      expect(result.enabled).toBe(false);
      expect(result.types).toEqual([]);
    });

    it('should return default config when validation field is missing', async () => {
      // 创建不含 validation 的配置
      const configPath = join(tempDir, '.ak47');
      mkdirSync(configPath, { recursive: true });
      writeFileSync(
        join(configPath, 'config.yaml'),
        `version: '1.0.0'
projectName: test
platforms: []
enabledUnits: []
createdAt: 2026-05-07T00:00:00Z
updatedAt: 2026-05-07T00:00:00Z
`,
        'utf-8'
      );

      const result = await (orchestrator as any).loadValidationConfig();

      expect(result.enabled).toBe(false);
      expect(result.types).toEqual([]);
    });

    it('should load validation config from config.yaml', async () => {
      // 创建含 validation 的配置
      const configPath = join(tempDir, '.ak47');
      mkdirSync(configPath, { recursive: true });
      writeFileSync(
        join(configPath, 'config.yaml'),
        `version: '1.0.0'
projectName: test
platforms: []
enabledUnits: []
createdAt: 2026-05-07T00:00:00Z
updatedAt: 2026-05-07T00:00:00Z
validation:
  enabled: true
  types:
    - id: test-type
      name: 测试类型
      trigger: auto
      required: true
  on_failure:
    action: block-archive
    message: "必须通过"
`,
        'utf-8'
      );

      const result = await (orchestrator as any).loadValidationConfig();

      expect(result.enabled).toBe(true);
      expect(result.types).toHaveLength(1);
      expect(result.types[0].id).toBe('test-type');
      expect(result.on_failure.action).toBe('block-archive');
    });
  });
});
