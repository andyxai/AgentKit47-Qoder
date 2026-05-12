import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectTechStack } from '../../../src/core/scanner/tech-detector.js';

describe('detectTechStack', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('空目录 → 所有字段为 null/false', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    const result = await detectTechStack(tempDir);
    expect(result.primaryLanguage).toBeNull();
    expect(result.framework).toBeNull();
    expect(result.buildTool).toBeNull();
    expect(result.testFramework).toBeNull();
    expect(result.packageManager).toBeNull();
    expect(result.hasTypeScript).toBe(false);
    expect(result.hasPython).toBe(false);
  });

  it("有 package.json（含 react + typescript 依赖）→ primaryLanguage='node.js', framework='react', hasTypeScript=true", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    const pkg = {
      dependencies: { react: '^18.0.0', typescript: '^5.0.0' },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(pkg));
    const result = await detectTechStack(tempDir);
    expect(result.primaryLanguage).toBe('node.js');
    expect(result.framework).toBe('react');
    expect(result.hasTypeScript).toBe(true);
  });

  it('有 tsconfig.json → hasTypeScript=true', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    writeFileSync(join(tempDir, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }));
    const result = await detectTechStack(tempDir);
    expect(result.hasTypeScript).toBe(true);
    expect(result.primaryLanguage).toBe('node.js');
  });

  it("有 pyproject.toml → hasPython=true, primaryLanguage='python'", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    writeFileSync(join(tempDir, 'pyproject.toml'), "[project]\nname = 'test'\n");
    const result = await detectTechStack(tempDir);
    expect(result.hasPython).toBe(true);
    expect(result.primaryLanguage).toBe('python');
  });

  it("有 go.mod → primaryLanguage='go'", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    writeFileSync(join(tempDir, 'go.mod'), 'module example.com/test\n\ngo 1.21\n');
    const result = await detectTechStack(tempDir);
    expect(result.primaryLanguage).toBe('go');
    expect(result.packageManager).toBe('go');
  });

  it("存在 yarn.lock → packageManager='yarn'", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ dependencies: {} }));
    writeFileSync(join(tempDir, 'yarn.lock'), '# yarn lockfile\n');
    const result = await detectTechStack(tempDir);
    expect(result.packageManager).toBe('yarn');
  });

  it("存在 pnpm-lock.yaml → packageManager='pnpm'", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ dependencies: {} }));
    writeFileSync(join(tempDir, 'pnpm-lock.yaml'), "lockfileVersion: '6.0'\n");
    const result = await detectTechStack(tempDir);
    expect(result.packageManager).toBe('pnpm');
  });

  it("deps 含 vite → buildTool='vite'", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ devDependencies: { vite: '^5.0.0' } })
    );
    const result = await detectTechStack(tempDir);
    expect(result.buildTool).toBe('vite');
  });

  it("deps 含 vitest → testFramework='vitest'", async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'tech-detector-'));
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ devDependencies: { vitest: '^1.0.0' } })
    );
    const result = await detectTechStack(tempDir);
    expect(result.testFramework).toBe('vitest');
  });
});
