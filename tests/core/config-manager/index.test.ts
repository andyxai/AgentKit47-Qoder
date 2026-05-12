import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  configGet,
  configSet,
  configList,
  configReset,
  backupConfig,
  getDefaultConfig,
} from '../../../src/core/config-manager/index.js';
import { saveConfig } from '../../../src/utils/config.js';
import type { Ak47Config } from '../../../src/types/index.js';

describe('config-manager', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ak47-cm-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  const createValidConfig = (overrides?: Partial<Ak47Config>): Ak47Config => ({
    version: '1.0.0',
    projectName: 'test-project',
    platforms: [{ id: 'qoder', enabled: true, configDir: '.qoder' }],
    enabledUnits: ['ak47-agent-po'],
    paradigm: 'L1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  const writeConfig = async (overrides?: Partial<Ak47Config>) => {
    await saveConfig(createValidConfig(overrides), tempDir);
  };

  // ─── configGet ────────────────────────────────────────────
  describe('configGet', () => {
    it('reads general category (projectName)', async () => {
      await writeConfig();
      const value = await configGet(tempDir, 'general', 'projectName');
      expect(value).toBe('test-project');
    });

    it('reads agent category from agentOverrides', async () => {
      await writeConfig({ agentOverrides: { developer: 'custom-dev.md' } });
      const value = await configGet(tempDir, 'agent', 'developer');
      expect(value).toBe('custom-dev.md');
    });

    it('reads platform category by id', async () => {
      await writeConfig();
      const value = await configGet(tempDir, 'platform', 'qoder');
      expect(value).toEqual({ id: 'qoder', enabled: true, configDir: '.qoder' });
    });

    it('returns null for non-existent key in agent category', async () => {
      await writeConfig();
      const value = await configGet(tempDir, 'agent', 'reviewer');
      expect(value).toBeNull();
    });

    it('returns null for non-existent platform id', async () => {
      await writeConfig();
      const value = await configGet(tempDir, 'platform', 'cursor');
      expect(value).toBeNull();
    });

    it('throws on invalid category', async () => {
      await writeConfig();
      await expect(configGet(tempDir, 'invalid' as any, 'x')).rejects.toThrow('非法分类');
    });

    it('throws on invalid agent key', async () => {
      await writeConfig();
      await expect(configGet(tempDir, 'agent', 'nonexistent')).rejects.toThrow('非法 Agent 角色');
    });

    it('throws when config file not found', async () => {
      await expect(configGet(tempDir, 'general', 'projectName')).rejects.toThrow('未找到配置文件');
    });
  });

  // ─── configSet ────────────────────────────────────────────
  describe('configSet', () => {
    it('writes general category and updates updatedAt', async () => {
      await writeConfig();
      const before = new Date('2026-01-01T00:00:00.000Z').getTime();
      const result = await configSet(tempDir, 'general', 'projectName', 'new-name');
      expect(result).toEqual({ oldValue: 'test-project', newValue: 'new-name' });

      // verify persisted
      const value = await configGet(tempDir, 'general', 'projectName');
      expect(value).toBe('new-name');

      // verify updatedAt changed
      const config = await (await import('../../../src/utils/config.js')).loadConfig(tempDir);
      expect(new Date(config!.updatedAt).getTime()).toBeGreaterThanOrEqual(before);
    });

    it('writes agent category → agentOverrides', async () => {
      await writeConfig();
      const result = await configSet(tempDir, 'agent', 'reviewer', 'my-reviewer.md');
      expect(result.oldValue).toBeNull();
      expect(result.newValue).toBe('my-reviewer.md');

      const value = await configGet(tempDir, 'agent', 'reviewer');
      expect(value).toBe('my-reviewer.md');
    });

    it('writes flow category → flowParams', async () => {
      await writeConfig();
      const result = await configSet(tempDir, 'flow', 'strictMode', 'true');
      expect(result.oldValue).toBeNull();
      expect(result.newValue).toBe(true);
    });

    it('throws on invalid category', async () => {
      await writeConfig();
      await expect(configSet(tempDir, 'bogus' as any, 'x', 'v')).rejects.toThrow('非法分类');
    });

    it('returns { oldValue, newValue } for overwrite', async () => {
      await writeConfig({ agentOverrides: { developer: 'old.md' } });
      const result = await configSet(tempDir, 'agent', 'developer', 'new.md');
      expect(result.oldValue).toBe('old.md');
      expect(result.newValue).toBe('new.md');
    });

    it('throws on invalid paradigm value', async () => {
      await writeConfig();
      await expect(configSet(tempDir, 'general', 'paradigm', 'L4')).rejects.toThrow('非法范式值');
    });

    it('adds new platform when key not found', async () => {
      await writeConfig();
      const result = await configSet(tempDir, 'platform', 'cursor', 'true');
      expect(result.oldValue).toBeNull();
      expect(result.newValue).toEqual({ id: 'cursor', enabled: true, configDir: '.' });
    });
  });

  // ─── configList ───────────────────────────────────────────
  describe('configList', () => {
    it('returns only the specified category', async () => {
      await writeConfig();
      const result = await configList(tempDir, 'general');
      expect(Object.keys(result)).toEqual(['general']);
      expect(result.general).toEqual({
        projectName: 'test-project',
        paradigm: 'L1',
        version: '1.0.0',
      });
    });

    it('returns all categories when no category specified', async () => {
      await writeConfig();
      const result = await configList(tempDir);
      expect(Object.keys(result).sort()).toEqual(['agent', 'flow', 'general', 'platform']);
    });
  });

  // ─── configReset ──────────────────────────────────────────
  describe('configReset', () => {
    it('resets a single key within a category', async () => {
      await writeConfig({ agentOverrides: { developer: 'custom.md', reviewer: 'rev.md' } });
      await configReset(tempDir, 'agent', 'developer');

      const dev = await configGet(tempDir, 'agent', 'developer');
      const rev = await configGet(tempDir, 'agent', 'reviewer');
      expect(dev).toBeNull();
      expect(rev).toBe('rev.md');
    });

    it('resets an entire category when only category specified', async () => {
      await writeConfig({ agentOverrides: { developer: 'a.md', reviewer: 'b.md' } });
      await configReset(tempDir, 'agent');

      const dev = await configGet(tempDir, 'agent', 'developer');
      const rev = await configGet(tempDir, 'agent', 'reviewer');
      expect(dev).toBeNull();
      expect(rev).toBeNull();
    });

    it('resets all categories preserving projectName and createdAt', async () => {
      await writeConfig({
        paradigm: 'L3',
      });
      await configReset(tempDir);

      const { loadConfig: lc } = await import('../../../src/utils/config.js');
      const config = await lc(tempDir);
      expect(config!.projectName).toBe('test-project');
      expect(config!.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(config!.paradigm).toBe('L1');
    });
  });

  // ─── backupConfig ─────────────────────────────────────────
  describe('backupConfig', () => {
    it('creates .ak47/.backup/ directory and backup file', async () => {
      await writeConfig();
      const backupPath = await backupConfig(tempDir);
      expect(existsSync(backupPath)).toBe(true);

      const backupDir = join(tempDir, '.ak47', '.backup');
      expect(existsSync(backupDir)).toBe(true);
    });

    it('backup content matches original config', async () => {
      await writeConfig();
      const backupPath = await backupConfig(tempDir);

      const originalPath = join(tempDir, '.ak47', 'config.yaml');
      const originalContent = readFileSync(originalPath, 'utf-8');
      const backupContent = readFileSync(backupPath, 'utf-8');
      expect(backupContent).toBe(originalContent);
    });

    it('throws when config file does not exist', async () => {
      await expect(backupConfig(tempDir)).rejects.toThrow('未找到配置文件');
    });
  });

  // ─── Zod compatibility ────────────────────────────────────
  describe('Zod compatibility (old config without optional fields)', () => {
    it('loads config without agentOverrides/flowParams', async () => {
      const { loadConfig: lc } = await import('../../../src/utils/config.js');
      const minimal: Ak47Config = {
        version: '1.0.0',
        projectName: 'legacy-project',
        platforms: [],
        enabledUnits: [],
        paradigm: 'L1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      await saveConfig(minimal, tempDir);

      const loaded = await lc(tempDir);
      expect(loaded).not.toBeNull();
      expect(loaded!.projectName).toBe('legacy-project');
      expect(loaded!.agentOverrides).toBeUndefined();
      expect(loaded!.flowParams).toBeUndefined();
    });
  });

  // ─── getDefaultConfig ─────────────────────────────────────
  describe('getDefaultConfig', () => {
    it('returns config with default projectName', () => {
      const config = getDefaultConfig();
      expect(config.projectName).toBe('untitled');
      expect(config.paradigm).toBe('L1');
      expect(config.platforms).toEqual([]);
    });

    it('accepts custom projectName', () => {
      const config = getDefaultConfig('my-project');
      expect(config.projectName).toBe('my-project');
    });
  });
});
