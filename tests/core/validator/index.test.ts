import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateProject } from '../../../src/core/validator/index.js';

describe('validateProject', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ak47-validator-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  const createValidConfig = (overrides?: Record<string, unknown>): string => {
    const config = {
      version: '1.0.0',
      projectName: 'test-project',
      platforms: [{ id: 'qoder', enabled: false, configDir: '.qoder' }],
      enabledUnits: ['ak47-agent-po', 'ak47-agent-developer'],
      paradigm: 'L1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
    return JSON.stringify(config, null, 2);
  };

  it('returns passed=false when .ak47/ directory does not exist', async () => {
    const result = await validateProject(tempDir);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('.ak47'))).toBe(true);
    const dirCheck = result.checks.find((c) => c.name.includes('.ak47/ 目录存在'));
    expect(dirCheck?.passed).toBe(false);
  });

  it('returns errors containing config.yaml missing when .ak47/ exists but config.yaml does not', async () => {
    mkdirSync(join(tempDir, '.ak47'), { recursive: true });
    const result = await validateProject(tempDir);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('config.yaml'))).toBe(true);
    const configCheck = result.checks.find((c) => c.name.includes('config.yaml 存在'));
    expect(configCheck?.passed).toBe(false);
  });

  it('returns errors when config.yaml contains invalid YAML', async () => {
    const ak47Dir = join(tempDir, '.ak47');
    mkdirSync(ak47Dir, { recursive: true });
    writeFileSync(join(ak47Dir, 'config.yaml'), 'invalid: [yaml: content', 'utf-8');
    const result = await validateProject(tempDir);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('YAML'))).toBe(true);
    const yamlCheck = result.checks.find((c) => c.name.includes('YAML 语法正确'));
    expect(yamlCheck?.passed).toBe(false);
  });

  it('returns passed=true with valid config.yaml and agent files', async () => {
    const ak47Dir = join(tempDir, '.ak47');
    const agentsDir = join(ak47Dir, 'agents');
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(join(ak47Dir, 'config.yaml'), createValidConfig(), 'utf-8');
    writeFileSync(join(agentsDir, 'po.md'), '# PO Agent', 'utf-8');
    writeFileSync(join(agentsDir, 'developer.md'), '# Developer Agent', 'utf-8');

    const result = await validateProject(tempDir);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.checks.some((c) => c.name.includes('agents/ 包含 Agent 定义') && c.passed)).toBe(
      true
    );
  });

  it('returns warnings when enabledUnits has agents but corresponding files do not exist', async () => {
    const ak47Dir = join(tempDir, '.ak47');
    const agentsDir = join(ak47Dir, 'agents');
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      join(ak47Dir, 'config.yaml'),
      createValidConfig({
        enabledUnits: ['ak47-agent-po', 'ak47-agent-developer', 'ak47-agent-architect'],
      }),
      'utf-8'
    );
    // Only create 2 agent files, but config expects 3
    writeFileSync(join(agentsDir, 'po.md'), '# PO Agent', 'utf-8');
    writeFileSync(join(agentsDir, 'developer.md'), '# Developer Agent', 'utf-8');

    const result = await validateProject(tempDir);
    expect(result.passed).toBe(true);
    expect(result.warnings.some((w) => w.includes('不匹配') || w.includes('enabledUnits'))).toBe(
      true
    );
    const agentMatchCheck = result.checks.find((c) =>
      c.name.includes('enabledUnits Agent 有对应文件')
    );
    expect(agentMatchCheck?.passed).toBe(false);
  });
});
