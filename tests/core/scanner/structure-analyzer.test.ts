import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { analyzeStructure } from '../../../src/core/scanner/structure-analyzer.js';

describe('analyzeStructure', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('空目录 → isMonorepo=false, srcDir=null, hasTests=false', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'structure-'));
    const result = await analyzeStructure(tempDir);
    expect(result.isMonorepo).toBe(false);
    expect(result.srcDir).toBeNull();
    expect(result.hasTests).toBe(false);
    expect(result.hasDocs).toBe(false);
    expect(result.hasCI).toBe(false);
    expect(result.fileCount).toBe(0);
  });

  it("有 src/ 目录 → srcDir='src'", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'structure-'));
    mkdirSync(join(tempDir, 'src'));
    writeFileSync(join(tempDir, 'src', 'index.ts'), 'export {};');
    const result = await analyzeStructure(tempDir);
    expect(result.srcDir).toBe('src');
  });

  it("有 app/ 但无 src/ → srcDir='app'", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'structure-'));
    mkdirSync(join(tempDir, 'app'));
    writeFileSync(join(tempDir, 'app', 'page.tsx'), 'export default function Page() {};');
    const result = await analyzeStructure(tempDir);
    expect(result.srcDir).toBe('app');
  });

  it('有 pnpm-workspace.yaml → isMonorepo=true', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'structure-'));
    writeFileSync(join(tempDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");
    const result = await analyzeStructure(tempDir);
    expect(result.isMonorepo).toBe(true);
  });

  it('有 tests/ 目录 → hasTests=true', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'structure-'));
    mkdirSync(join(tempDir, 'tests'));
    writeFileSync(join(tempDir, 'tests', 'index.test.ts'), "test('x', () => {});");
    const result = await analyzeStructure(tempDir);
    expect(result.hasTests).toBe(true);
  });

  it('有 .github/workflows/ → hasCI=true', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'structure-'));
    mkdirSync(join(tempDir, '.github', 'workflows'), { recursive: true });
    writeFileSync(join(tempDir, '.github', 'workflows', 'ci.yml'), 'name: CI\n');
    const result = await analyzeStructure(tempDir);
    expect(result.hasCI).toBe(true);
  });

  it('fileCount 统计正确', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'structure-'));
    writeFileSync(join(tempDir, 'a.ts'), 'export {};');
    writeFileSync(join(tempDir, 'b.ts'), 'export {};');
    writeFileSync(join(tempDir, 'c.md'), '# Hello');
    const result = await analyzeStructure(tempDir);
    expect(result.fileCount).toBe(3);
  });
});
