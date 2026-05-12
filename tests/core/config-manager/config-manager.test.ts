/**
 * ConfigManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigManager } from '../../../src/core/config-manager/config-manager.js';

describe('ConfigManager', () => {
  let tempDir: string;
  let manager: ConfigManager;

  beforeEach(() => {
    // 创建临时目录（使用时间戳确保唯一性）
    tempDir = join(process.cwd(), `test-temp-config-manager-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    manager = new ConfigManager(tempDir);
  });

  afterEach(() => {
    // 清理临时目录
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('addValidation', () => {
    it('should add a validation type with metadata', async () => {
      const validation = await manager.addValidation({
        id: 'web-test',
        name: 'Web 部署测试',
        description: '部署后验证核心功能',
        agent: 'custom-web-tester',
        trigger: 'manual',
        required: true,
        reason: '需要在部署后验证功能',
        author: 'test-user',
      });

      expect(validation.id).toBe('web-test');
      expect(validation.name).toBe('Web 部署测试');
      expect(validation._custom).toBe(true);
      expect(validation._reason).toBe('需要在部署后验证功能');
      expect(validation._author).toBe('test-user');
      expect(validation._created_at).toBeDefined();
    });

    it('should save validation to custom-configs.yaml', async () => {
      await manager.addValidation({
        id: 'web-test',
        name: 'Web 部署测试',
        trigger: 'manual',
        required: false,
      });

      const configs = await manager.listConfigs();
      expect(configs.validation?.types).toHaveLength(1);
      expect(configs.validation?.types?.[0].id).toBe('web-test');
    });

    it('should throw error for duplicate validation id', async () => {
      await manager.addValidation({
        id: 'web-test',
        name: 'Web 部署测试',
        trigger: 'manual',
        required: false,
      });

      await expect(
        manager.addValidation({
          id: 'web-test',
          name: 'Web 部署测试 2',
          trigger: 'auto',
          required: false,
        })
      ).rejects.toThrow('已存在');
    });
  });

  describe('addAgent', () => {
    it('should add a custom agent with metadata', async () => {
      const agent = await manager.addAgent({
        id: 'custom-web-tester',
        name: '自定义 Web 测试 Agent',
        file: '.ak47/agents/custom-web-tester.md',
        reason: '用于 Web 部署测试',
        author: 'test-user',
      });

      expect(agent.id).toBe('custom-web-tester');
      expect(agent.name).toBe('自定义 Web 测试 Agent');
      expect(agent._custom).toBe(true);
      expect(agent._reason).toBe('用于 Web 部署测试');
      expect(agent._author).toBe('test-user');
      expect(agent._created_at).toBeDefined();
    });

    it('should save agent to custom-configs.yaml', async () => {
      await manager.addAgent({
        id: 'custom-web-tester',
        name: '自定义 Web 测试 Agent',
        file: '.ak47/agents/custom-web-tester.md',
      });

      const configs = await manager.listConfigs();
      expect(configs.custom_agents).toHaveLength(1);
      expect(configs.custom_agents?.[0].id).toBe('custom-web-tester');
    });
  });

  describe('addSkill', () => {
    it('should add a custom skill with metadata', async () => {
      const skill = await manager.addSkill({
        id: 'custom-web-test-skill',
        name: '自定义 Web 测试 Skill',
        directory: '.ak47/skills/custom-web-test-skill',
        reason: '用于 Web 部署测试',
        author: 'test-user',
      });

      expect(skill.id).toBe('custom-web-test-skill');
      expect(skill.name).toBe('自定义 Web 测试 Skill');
      expect(skill._custom).toBe(true);
      expect(skill._reason).toBe('用于 Web 部署测试');
      expect(skill._author).toBe('test-user');
      expect(skill._created_at).toBeDefined();
    });

    it('should save skill to custom-configs.yaml', async () => {
      await manager.addSkill({
        id: 'custom-web-test-skill',
        name: '自定义 Web 测试 Skill',
        directory: '.ak47/skills/custom-web-test-skill',
      });

      const configs = await manager.listConfigs();
      expect(configs.custom_skills).toHaveLength(1);
      expect(configs.custom_skills?.[0].id).toBe('custom-web-test-skill');
    });
  });

  describe('listConfigs', () => {
    it('should return empty configs when no custom configs exist', async () => {
      const configs = await manager.listConfigs();
      expect(configs.metadata).toBeDefined();
      expect(configs.validation?.types).toHaveLength(0);
      expect(configs.custom_agents).toHaveLength(0);
      expect(configs.custom_skills).toHaveLength(0);
    });

    it('should return all custom configs', async () => {
      await manager.addValidation({
        id: 'web-test',
        name: 'Web 部署测试',
        trigger: 'manual',
        required: true,
      });

      await manager.addAgent({
        id: 'custom-web-tester',
        name: '自定义 Web 测试 Agent',
        file: '.ak47/agents/custom-web-tester.md',
      });

      await manager.addSkill({
        id: 'custom-web-test-skill',
        name: '自定义 Web 测试 Skill',
        directory: '.ak47/skills/custom-web-test-skill',
      });

      const configs = await manager.listConfigs();
      expect(configs.validation?.types).toHaveLength(1);
      expect(configs.custom_agents).toHaveLength(1);
      expect(configs.custom_skills).toHaveLength(1);
    });
  });

  describe('metadata', () => {
    it('should update updated_at when adding new config', async () => {
      await manager.addValidation({
        id: 'web-test',
        name: 'Web 部署测试',
        trigger: 'manual',
        required: false,
      });

      const configs1 = await manager.listConfigs();
      const updatedAt1 = configs1.metadata?.updated_at;

      // 等待 1 秒
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await manager.addAgent({
        id: 'custom-web-tester',
        name: '自定义 Web 测试 Agent',
        file: '.ak47/agents/custom-web-tester.md',
      });

      const configs2 = await manager.listConfigs();
      const updatedAt2 = configs2.metadata?.updated_at;

      expect(updatedAt2).not.toBe(updatedAt1);
    });
  });
});
