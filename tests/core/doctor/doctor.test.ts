import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { runDoctor } from '../../../src/core/doctor/index.js';

describe('doctor', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'ak47-doctor-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  const writeFile = (relative: string, content: string) => {
    const abs = join(projectDir, relative);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, content, 'utf-8');
  };

  const writeConfig = (overrides: Record<string, unknown> = {}) => {
    const config = {
      version: '1.0.0',
      projectName: 'doctor-fixture',
      platforms: [{ id: 'qoder', enabled: true, configDir: '.qoder' }],
      enabledUnits: ['rules-ts'],
      paradigm: 'L1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
    const yaml = [
      `version: ${config.version}`,
      `projectName: ${config.projectName}`,
      `platforms:`,
      `  - id: qoder`,
      `    enabled: true`,
      `    configDir: .qoder`,
      `enabledUnits:`,
      `  - rules-ts`,
      `paradigm: ${config.paradigm}`,
      `createdAt: ${config.createdAt}`,
      `updatedAt: ${config.updatedAt}`,
      '',
    ].join('\n');
    writeFile('.ak47/config.yaml', yaml);
  };

  const hash = (content: string) => createHash('sha256').update(content).digest('hex');

  it('未初始化项目：报告整体 fail，.ak47/ 缺失', async () => {
    const report = await runDoctor(projectDir);
    expect(report.overall).toBe('fail');
    const structChecks = report.sections.find((s) => s.name === '项目结构')!.checks;
    const ak47Check = structChecks.find((c) => c.id === 'struct.ak47-dir')!;
    expect(ak47Check.severity).toBe('fail');
  });

  it('已初始化但无快照：报告 warn', async () => {
    writeConfig();
    const report = await runDoctor(projectDir);
    const snapshotCheck = report.sections
      .find((s) => s.name === '项目结构')!
      .checks.find((c) => c.id === 'struct.snapshot')!;
    expect(snapshotCheck.severity).toBe('warn');
    expect(report.overall).toBe('warn');
  });

  it('快照文件全部存在且一致：missing 和 modified 均为 pass', async () => {
    writeConfig();
    const ruleContent = '# rules content';
    writeFile('.ak47/rules/rules-ts.md', ruleContent);
    writeFile(
      '.ak47/.snapshots.json',
      JSON.stringify({
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        files: { '.ak47/rules/rules-ts.md': hash(ruleContent) },
      })
    );

    const report = await runDoctor(projectDir);
    const snapshotSection = report.sections.find((s) => s.name === '快照一致性')!;
    const missing = snapshotSection.checks.find((c) => c.id === 'snapshot.missing')!;
    expect(missing.severity).toBe('pass');
    const modified = snapshotSection.checks.find((c) => c.id === 'snapshot.modified');
    expect(modified).toBeUndefined(); // 无修改时不插入该 check
  });

  it('快照记录的文件缺失：报告 fail', async () => {
    writeConfig();
    writeFile(
      '.ak47/.snapshots.json',
      JSON.stringify({
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        files: { '.ak47/rules/rules-ts.md': hash('v1') },
      })
    );

    const report = await runDoctor(projectDir);
    const missing = report.sections
      .find((s) => s.name === '快照一致性')!
      .checks.find((c) => c.id === 'snapshot.missing')!;
    expect(missing.severity).toBe('fail');
    expect(report.overall).toBe('fail');
  });

  it('用户修改了文件：报告 warn', async () => {
    writeConfig();
    writeFile('.ak47/rules/rules-ts.md', 'user modified');
    writeFile(
      '.ak47/.snapshots.json',
      JSON.stringify({
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        files: { '.ak47/rules/rules-ts.md': hash('original') },
      })
    );

    const report = await runDoctor(projectDir);
    const modified = report.sections
      .find((s) => s.name === '快照一致性')!
      .checks.find((c) => c.id === 'snapshot.modified')!;
    expect(modified.severity).toBe('warn');
  });

  it('检测到 .new 冲突残留：报告 warn', async () => {
    writeConfig();
    writeFile('.qoder/agents/ak47-agent-developer.md.new', '冲突版本');
    const report = await runDoctor(projectDir);
    const conflict = report.sections
      .find((s) => s.name === '升级冲突残留')!
      .checks.find((c) => c.id === 'conflict.residue')!;
    expect(conflict.severity).toBe('warn');
    expect(conflict.message).toContain('1');
  });

  it('自定义 Qoder 资产：列入 details 且不报 fail', async () => {
    writeConfig();
    writeFile('.qoder/agents/my-custom-agent.md', '# custom');
    writeFile('.qoder/skills/custom-category/my-skill/SKILL.md', '# skill');
    const report = await runDoctor(projectDir);
    const custom = report.sections
      .find((s) => s.name === '自定义资产')!
      .checks.find((c) => c.id === 'custom.qoder')!;
    expect(custom.severity).toBe('pass');
    expect(custom.message).toMatch(/Agent 1/);
    expect(custom.message).toMatch(/Skill 1/);
  });

  it('报告包含所有 6 个 section 和 meta 信息', async () => {
    writeConfig();
    const report = await runDoctor(projectDir);
    const names = report.sections.map((s) => s.name);
    expect(names).toEqual([
      '环境',
      '项目结构',
      '快照一致性',
      '升级待办',
      '自定义资产',
      '升级冲突残留',
    ]);
    expect(report.meta.projectDir).toBe(projectDir);
    expect(report.meta.cliVersion).toBeDefined();
    expect(report.meta.nodeVersion).toMatch(/^v/);
  });
});
