import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { planFileActions } from '../../../src/core/generator/file-planner.js';
import type { EnabledUnit } from '../../../src/types/units.js';

describe('file-planner', () => {
  let projectDir: string;
  let templateDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'ak47-project-'));
    templateDir = mkdtempSync(join(tmpdir(), 'ak47-templates-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(templateDir, { recursive: true, force: true });
  });

  function createTemplate(unitId: string, content: string) {
    const dir = join(templateDir, 'units', unitId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '_base.md'), content, 'utf-8');
  }

  it('should skip agent unit (now handled by copyQoderConfig)', async () => {
    createTemplate('ak47-agent-developer', '# Agent Developer');
    const units: EnabledUnit[] = [{ unitId: 'ak47-agent-developer', paradigm: 'L1' }];
    const actions = await planFileActions(units, projectDir, templateDir, {});
    // Agent 不再通过 file-planner 生成,由 copyQoderConfig 直接拷贝
    const action = actions.find((a) => a.path.includes('ak47-agent-developer'));
    expect(action).toBeUndefined();
  });

  it('should skip skill unit (now handled by copyQoderConfig)', async () => {
    createTemplate('ak47-skill-entry-guard', '# Entry Guard');
    const units: EnabledUnit[] = [{ unitId: 'ak47-skill-entry-guard', paradigm: 'L1' }];
    const actions = await planFileActions(units, projectDir, templateDir, {});
    // Skill 不再通过 file-planner 生成,由 copyQoderConfig 直接拷贝
    const action = actions.find((a) => a.path.includes('ak47-skill-entry-guard'));
    expect(action).toBeUndefined();
  });

  it('should skip platform-config unit', async () => {
    const units: EnabledUnit[] = [{ unitId: 'platform-config', paradigm: 'L1' }];
    const actions = await planFileActions(units, projectDir, templateDir, {});
    expect(actions).toHaveLength(0);
  });

  it('should skip agent unit even when target file does not exist', async () => {
    createTemplate('ak47-agent-developer', '# Agent Developer');
    const units: EnabledUnit[] = [{ unitId: 'ak47-agent-developer', paradigm: 'L1' }];
    const actions = await planFileActions(units, projectDir, templateDir, {});
    // Agent 不再通过 file-planner 生成
    const action = actions.find((a) => a.path.includes('ak47-agent-developer'));
    expect(action).toBeUndefined();
  });
});
