import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getProjectRoot,
  getAk47Dir,
  getConfigPath,
  getProgressPath,
  ensureDir,
} from '../../src/utils/paths.js';

describe('paths', () => {
  let tempDir: string;
  let nestedDir: string;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ak47-test-'));
    nestedDir = join(tempDir, 'packages', 'app');
    mkdirSync(nestedDir, { recursive: true });
    writeFileSync(join(tempDir, 'package.json'), '{}');
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getProjectRoot', () => {
    it('finds root from a nested directory containing package.json', () => {
      const root = getProjectRoot(nestedDir);
      expect(root).toBe(tempDir);
    });

    it('finds root from the directory itself', () => {
      const root = getProjectRoot(tempDir);
      expect(root).toBe(tempDir);
    });

    it('finds root from .git directory', () => {
      const gitDir = mkdtempSync(join(tmpdir(), 'ak47-git-test-'));
      mkdirSync(join(gitDir, '.git'), { recursive: true });
      const subDir = join(gitDir, 'src');
      mkdirSync(subDir, { recursive: true });
      const root = getProjectRoot(subDir);
      expect(root).toBe(gitDir);
      rmSync(gitDir, { recursive: true, force: true });
    });

    it('throws when no root is found', () => {
      const noRootDir = mkdtempSync(join(tmpdir(), 'ak47-noroot-'));
      expect(() => getProjectRoot(noRootDir)).toThrow('无法找到项目根目录');
      rmSync(noRootDir, { recursive: true, force: true });
    });
  });

  describe('getAk47Dir', () => {
    it('returns correct .ak47 path when projectRoot is provided', () => {
      const dir = getAk47Dir(tempDir);
      expect(dir).toBe(join(tempDir, '.ak47'));
    });
  });

  describe('getConfigPath', () => {
    it('returns correct config.yaml path', () => {
      const path = getConfigPath(tempDir);
      expect(path).toBe(join(tempDir, '.ak47', 'config.yaml'));
    });
  });

  describe('getProgressPath', () => {
    it('returns correct progress.yaml path', () => {
      const path = getProgressPath(tempDir);
      expect(path).toBe(join(tempDir, '.ak47', 'progress.yaml'));
    });
  });

  describe('ensureDir', () => {
    it('creates directory recursively', async () => {
      const dir = join(tempDir, 'a', 'b', 'c');
      await ensureDir(dir);
      const stat = await import('node:fs/promises').then((m) => m.stat(dir));
      expect(stat.isDirectory()).toBe(true);
    });
  });
});
