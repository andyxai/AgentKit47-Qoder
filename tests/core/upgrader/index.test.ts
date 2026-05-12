import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { stringify } from 'yaml';
import { executeUpgrade } from '../../../src/core/upgrader/index.js';
import { loadConfig } from '../../../src/utils/config.js';
import { renderTemplate } from '../../../src/core/generator/template-engine.js';
import type { Ak47Config } from '../../../src/types/config.js';

describe('upgrader/index', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'ak47-upgrade-test-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  const hash = (content: string) => createHash('sha256').update(content).digest('hex');

  const writeConfig = (overrides: Partial<Ak47Config> = {}) => {
    const base: Ak47Config = {
      version: '0.0.1',
      projectName: 'test-project',
      platforms: [],
      enabledUnits: ['ak47-agent-developer'],
      paradigm: 'L1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
    const configPath = join(projectDir, '.ak47', 'config.yaml');
    mkdirSync(join(projectDir, '.ak47'), { recursive: true });
    writeFileSync(configPath, stringify(base), 'utf-8');
  };

  const writeSnapshot = (files: Record<string, string>, version = '0.0.1') => {
    const snapshotPath = join(projectDir, '.ak47', '.snapshots.json');
    mkdirSync(join(projectDir, '.ak47'), { recursive: true });
    writeFileSync(
      snapshotPath,
      JSON.stringify({ version, createdAt: new Date().toISOString(), files }, null, 2),
      'utf-8'
    );
  };

  const setupAgentFile = (unitId: string, content: string) => {
    const dir = join(projectDir, '.ak47', 'agents');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${unitId}.md`), content, 'utf-8');
  };

  it('executeUpgrade dry-run 模式返回计划但不修改文件', async () => {
    // 使用 rules 而不是 Agent (Agent 已改为静态化)
    const rulesDir = join(projectDir, '.ak47', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    const oldContent = 'old template content';
    writeFileSync(join(rulesDir, 'hard-rules.md'), oldContent, 'utf-8');
    writeSnapshot({ '.ak47/rules/hard-rules.md': hash(oldContent) });
    writeConfig({ enabledUnits: ['rules-hard-rules'] });

    const configBefore = readFileSync(join(projectDir, '.ak47', 'config.yaml'), 'utf-8');
    const snapshotBefore = readFileSync(join(projectDir, '.ak47', '.snapshots.json'), 'utf-8');

    const result = await executeUpgrade(projectDir, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.backupPath).toBe('');
    // dry-run 模式下,文件未修改应该是 skip 策略
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.entries.some((e) => e.unitId === 'rules-hard-rules')).toBe(true);

    const configAfter = readFileSync(join(projectDir, '.ak47', 'config.yaml'), 'utf-8');
    const snapshotAfter = readFileSync(join(projectDir, '.ak47', '.snapshots.json'), 'utf-8');

    expect(configAfter).toBe(configBefore);
    expect(snapshotAfter).toBe(snapshotBefore);
  });

  it('executeUpgrade 正常执行后 config 版本更新', async () => {
    // 使用 rules 而不是 Agent (Agent 已改为静态化)
    const oldContent = 'old template content';

    writeConfig({ enabledUnits: ['rules-ts'] });
    const rulesDir = join(projectDir, '.ak47', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    writeFileSync(join(rulesDir, 'rules-ts.md'), oldContent, 'utf-8');
    writeSnapshot({ '.ak47/rules/rules-ts.md': hash(oldContent) });
    
    // 创建一个占位 Agent 文件以满足验证器检查
    // (Agent 现在在 .qoder/agents/ 中,但验证器仍检查 .ak47/agents/)
    const agentsDir = join(projectDir, '.ak47', 'agents');
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(join(agentsDir, 'placeholder.md'), '# Placeholder', 'utf-8');

    const result = await executeUpgrade(projectDir, {});

    expect(result.success).toBe(true);

    const config = await loadConfig(projectDir);
    expect(config).not.toBeNull();
    // 版本号应该从 package.json 读取,不是硬编码
    expect(config!.version).toBeDefined();
    expect(config!.ak47Version).toBeDefined();

    // 备份文件应生成
    expect(result.backupPath).not.toBe('');
    expect(existsSync(result.backupPath)).toBe(true);

    // rules 文件应被更新 (Agent/Skill 不会)
    const updatedFile = join(projectDir, '.ak47', 'rules', 'rules-ts.md');
    expect(existsSync(updatedFile)).toBe(true);
  });

  it('--only 过滤只处理指定单元', async () => {
    // 使用 rules 而不是 Agent (Agent 已改为静态化)
    const rulesDir = join(projectDir, '.ak47', 'rules');
    mkdirSync(rulesDir, { recursive: true });
    const oldContent = 'old rules content';
    writeFileSync(join(rulesDir, 'hard-rules.md'), oldContent, 'utf-8');
    writeFileSync(join(rulesDir, 'deviation-log-template.md'), oldContent, 'utf-8');
    writeSnapshot({
      '.ak47/rules/hard-rules.md': hash(oldContent),
      '.ak47/rules/deviation-log-template.md': hash(oldContent),
    });

    writeConfig({ enabledUnits: ['rules-hard-rules', 'rules-deviation-log-template'] });

    const result = await executeUpgrade(projectDir, { only: ['rules-hard-rules'] });

    expect(result.entries.length).toBe(1);
    expect(result.entries[0].unitId).toBe('rules-hard-rules');
  });

  it('项目未初始化时抛出错误', async () => {
    await expect(executeUpgrade(projectDir, {})).rejects.toThrow(
      '项目未初始化，请先运行 ak47 init'
    );
  });
});
