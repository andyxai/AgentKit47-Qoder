import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { computeUpgradeDiff } from '../../../src/core/upgrader/diff-engine.js';
import type { Ak47Config } from '../../../src/types/config.js';

describe('diff-engine', () => {
  let projectDir: string;
  let templateDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'ak47-diff-project-'));
    templateDir = mkdtempSync(join(tmpdir(), 'ak47-diff-template-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(templateDir, { recursive: true, force: true });
  });

  const createConfig = (overrides?: Partial<Ak47Config>): Ak47Config => ({
    version: '1.0.0',
    projectName: 'test-project',
    platforms: [{ id: 'qoder', enabled: true, configDir: '.qoder' }],
    enabledUnits: ['rules-ts'], // 使用 rules 而不是 Agent (Agent 已改为静态化)
    paradigm: 'L1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  const writeSnapshot = (files: Record<string, string>, version = '1.0.0') => {
    const snapshotPath = join(projectDir, '.ak47', '.snapshots.json');
    mkdirSync(join(projectDir, '.ak47'), { recursive: true });
    writeFileSync(
      snapshotPath,
      JSON.stringify({ version, createdAt: new Date().toISOString(), files }, null, 2),
      'utf-8'
    );
  };

  const setupTemplate = (unitId: string, content: string) => {
    const dir = join(templateDir, 'units', unitId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '_base.md'), content, 'utf-8');
  };

  /** 在 templates/qoder/agents/ 下放入一个 Agent 源文件 */
  const setupQoderAgent = (name: string, content: string) => {
    const dir = join(templateDir, 'qoder', 'agents');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${name}.md`), content, 'utf-8');
  };

  /** 在 templates/qoder/skills/<category>/<name>/SKILL.md 下放入一个 Skill 源文件 */
  const setupQoderSkill = (category: string, name: string, content: string) => {
    const dir = join(templateDir, 'qoder', 'skills', category, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), content, 'utf-8');
  };

  const setupProjectFile = (relativePath: string, content: string) => {
    const absPath = join(projectDir, relativePath);
    mkdirSync(join(absPath, '..'), { recursive: true });
    writeFileSync(absPath, content, 'utf-8');
  };

  const hash = (content: string) => createHash('sha256').update(content).digest('hex');

  it('skip strategy: template unchanged and user not modified', async () => {
    const content = 'template v1';
    setupTemplate('rules-ts', content);
    setupProjectFile('.ak47/rules/rules-ts.md', content);
    writeSnapshot({ '.ak47/rules/rules-ts.md': hash(content) });

    const result = await computeUpgradeDiff(createConfig(), projectDir, templateDir);
    const entry = result.find((e) => e.unitId === 'rules-ts');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('skip');
  });

  it('update strategy: template changed and user not modified', async () => {
    const oldContent = 'template v1';
    const newContent = 'template v2';
    setupTemplate('rules-ts', newContent);
    setupProjectFile('.ak47/rules/rules-ts.md', oldContent);
    writeSnapshot({ '.ak47/rules/rules-ts.md': hash(oldContent) });

    const result = await computeUpgradeDiff(createConfig(), projectDir, templateDir);
    const entry = result.find((e) => e.unitId === 'rules-ts');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('update');
  });

  it('update-with-conflict strategy: template changed and user modified', async () => {
    const oldContent = 'template v1';
    setupTemplate('rules-ts', 'template v2');
    setupProjectFile('.ak47/rules/rules-ts.md', 'user modified');
    writeSnapshot({ '.ak47/rules/rules-ts.md': hash(oldContent) });

    const result = await computeUpgradeDiff(createConfig(), projectDir, templateDir);
    const entry = result.find((e) => e.unitId === 'rules-ts');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('update-with-conflict');
  });

  it('deprecate strategy: project enables a unit not in CLI', async () => {
    const config = createConfig({ enabledUnits: ['non-existent-unit'] });
    const result = await computeUpgradeDiff(config, projectDir, templateDir);
    const entry = result.find((e) => e.unitId === 'non-existent-unit');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('deprecate');
  });

  it('add strategy: CLI has new unit not enabled in project', async () => {
    // Agent 由静态资产通道处理：要先在 templates/qoder/agents/ 里放入源文件
    setupQoderAgent('ak47-agent-reviewer', '# Reviewer');
    const config = createConfig({ enabledUnits: ['rules-ts'] });
    const result = await computeUpgradeDiff(config, projectDir, templateDir);
    const entry = result.find((e) => e.unitId === 'ak47-agent-reviewer');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('add');
  });

  it('conservative strategy when no snapshot exists', async () => {
    const content = 'template v1';
    setupTemplate('rules-ts', content);
    setupProjectFile('.ak47/rules/rules-ts.md', content);

    const result = await computeUpgradeDiff(createConfig(), projectDir, templateDir);
    const entry = result.find((e) => e.unitId === 'rules-ts');
    expect(entry).toBeDefined();
    // 没有 snapshot 但有文件存在时,策略是 'update-with-conflict' (保守)
    expect(entry!.strategy).toBe('update-with-conflict');
  });

  // ── Qoder 静态资产（Agent/Skill）单独四种策略用例 ──

  it('static asset skip: template unchanged and user not modified', async () => {
    const content = '# Agent body v1';
    setupQoderAgent('ak47-agent-developer', content);
    setupProjectFile('.qoder/agents/ak47-agent-developer.md', content);
    writeSnapshot({ '.qoder/agents/ak47-agent-developer.md': hash(content) });

    const result = await computeUpgradeDiff(
      createConfig({ enabledUnits: ['ak47-agent-developer'] }),
      projectDir,
      templateDir
    );
    const entry = result.find((e) => e.unitId === 'ak47-agent-developer');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('skip');
  });

  it('static asset update: template changed and user not modified', async () => {
    const oldContent = '# Agent body v1';
    const newContent = '# Agent body v2';
    setupQoderAgent('ak47-agent-developer', newContent);
    setupProjectFile('.qoder/agents/ak47-agent-developer.md', oldContent);
    writeSnapshot({ '.qoder/agents/ak47-agent-developer.md': hash(oldContent) });

    const result = await computeUpgradeDiff(
      createConfig({ enabledUnits: ['ak47-agent-developer'] }),
      projectDir,
      templateDir
    );
    const entry = result.find((e) => e.unitId === 'ak47-agent-developer');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('update');
  });

  it('static asset update-with-conflict: template changed and user modified', async () => {
    const oldContent = '# Agent body v1';
    setupQoderAgent('ak47-agent-developer', '# Agent body v2');
    setupProjectFile('.qoder/agents/ak47-agent-developer.md', '# user local edit');
    writeSnapshot({ '.qoder/agents/ak47-agent-developer.md': hash(oldContent) });

    const result = await computeUpgradeDiff(
      createConfig({ enabledUnits: ['ak47-agent-developer'] }),
      projectDir,
      templateDir
    );
    const entry = result.find((e) => e.unitId === 'ak47-agent-developer');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('update-with-conflict');
  });

  it('static asset deprecate: enabled unit missing from templates', async () => {
    // templates/qoder/agents/ 存在但不包含 ak47-agent-removed
    setupQoderAgent('ak47-agent-developer', '# keep');
    const result = await computeUpgradeDiff(
      createConfig({ enabledUnits: ['ak47-agent-developer', 'ak47-agent-removed'] }),
      projectDir,
      templateDir
    );
    const entry = result.find((e) => e.unitId === 'ak47-agent-removed');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('deprecate');
  });

  it('static asset conservative when no snapshot exists', async () => {
    const content = '# Agent body v1';
    setupQoderAgent('ak47-agent-developer', content);
    setupProjectFile('.qoder/agents/ak47-agent-developer.md', content);
    // 注意：不写入快照

    const result = await computeUpgradeDiff(
      createConfig({ enabledUnits: ['ak47-agent-developer'] }),
      projectDir,
      templateDir
    );
    const entry = result.find((e) => e.unitId === 'ak47-agent-developer');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('update-with-conflict');
  });

  it('static asset covers Skill directory layout', async () => {
    const content = '---\nname: ak47-skill-entry-guard\n---\nbody';
    setupQoderSkill('ak47-core', 'ak47-skill-entry-guard', content);
    setupProjectFile(
      '.qoder/skills/ak47-core/ak47-skill-entry-guard/SKILL.md',
      content
    );
    writeSnapshot({
      '.qoder/skills/ak47-core/ak47-skill-entry-guard/SKILL.md': hash(content),
    });

    const result = await computeUpgradeDiff(
      createConfig({ enabledUnits: ['ak47-skill-entry-guard'] }),
      projectDir,
      templateDir
    );
    const entry = result.find((e) => e.unitId === 'ak47-skill-entry-guard');
    expect(entry).toBeDefined();
    expect(entry!.strategy).toBe('skip');
    expect(entry!.files[0]).toBe(
      '.qoder/skills/ak47-core/ak47-skill-entry-guard/SKILL.md'
    );
  });
});
