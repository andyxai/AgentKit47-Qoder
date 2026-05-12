import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, saveConfig, mergeConfig } from '../../src/utils/config.js';
import type { Ak47Config } from '../../src/types/index.js';

describe('config utils', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ak47-config-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  const createValidConfig = (): Ak47Config => ({
    version: '1.0.0',
    projectName: 'test-project',
    platforms: [{ id: 'qoder', enabled: true, configDir: '.qoder' }],
    enabledUnits: ['unit-a'],
    paradigm: 'L1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  describe('loadConfig', () => {
    it('returns null when config file does not exist', async () => {
      const result = await loadConfig(tempDir);
      expect(result).toBeNull();
    });

    it('returns config when file exists and is valid', async () => {
      const config = createValidConfig();
      await saveConfig(config, tempDir);
      const result = await loadConfig(tempDir);
      expect(result).toEqual(config);
    });

    it('returns null when file content is invalid', async () => {
      const ak47Dir = join(tempDir, '.ak47');
      const configPath = join(ak47Dir, 'config.yaml');
      const fs = await import('node:fs/promises');
      await fs.mkdir(ak47Dir, { recursive: true });
      await fs.writeFile(configPath, 'invalid: [yaml: content', 'utf-8');
      const result = await loadConfig(tempDir);
      expect(result).toBeNull();
    });

    it('returns null when parsed content fails schema validation', async () => {
      const ak47Dir = join(tempDir, '.ak47');
      const configPath = join(ak47Dir, 'config.yaml');
      const fs = await import('node:fs/promises');
      await fs.mkdir(ak47Dir, { recursive: true });
      await fs.writeFile(configPath, 'version: "1.0.0"\nprojectName: test\n', 'utf-8');
      const result = await loadConfig(tempDir);
      expect(result).toBeNull();
    });
  });

  describe('saveConfig', () => {
    it('writes config and creates .ak47 directory', async () => {
      const config = createValidConfig();
      await saveConfig(config, tempDir);
      const ak47Dir = join(tempDir, '.ak47');
      expect(existsSync(ak47Dir)).toBe(true);
      const result = await loadConfig(tempDir);
      expect(result).toEqual(config);
    });

    it('writes consistent yaml that can be re-read', async () => {
      const config = createValidConfig();
      config.customReviewers = [{ id: 'r1', name: 'R1', path: 'r1.md', order: 0 }];
      await saveConfig(config, tempDir);
      const result = await loadConfig(tempDir);
      expect(result).toEqual(config);
    });
  });

  describe('mergeConfig', () => {
    const base: Ak47Config = createValidConfig();

    it('deep merges simple fields', () => {
      const patch: Partial<Ak47Config> = { projectName: 'merged-project' };
      const result = mergeConfig(base, patch);
      expect(result.projectName).toBe('merged-project');
      expect(result.version).toBe('1.0.0');
    });

    it('replaces arrays instead of merging', () => {
      const patch: Partial<Ak47Config> = { enabledUnits: ['unit-b', 'unit-c'] };
      const result = mergeConfig(base, patch);
      expect(result.enabledUnits).toEqual(['unit-b', 'unit-c']);
    });

    it('does not overwrite with undefined fields', () => {
      const patch: Partial<Ak47Config> = { projectName: undefined };
      const result = mergeConfig(base, patch);
      expect(result.projectName).toBe('test-project');
    });

    it('recursively merges object fields', () => {
      const patch: Partial<Ak47Config> = {
        platforms: [{ id: 'cursor', enabled: false, configDir: '.cursor' }],
      };
      const result = mergeConfig(base, patch);
      expect(result.platforms).toEqual([{ id: 'cursor', enabled: false, configDir: '.cursor' }]);
    });
  });
});
