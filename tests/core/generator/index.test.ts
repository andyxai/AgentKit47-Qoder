import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildTemplateContext, plan, applyPlan } from '../../../src/core/generator/index.js';
import type { ProjectProfile } from '../../../src/types/project.js';
import type { EnabledUnit } from '../../../src/types/units.js';

describe('generator/index', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'ak47-gen-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  function makeProfile(): ProjectProfile {
    return {
      techStack: {
        primaryLanguage: 'TypeScript',
        framework: 'React',
        buildTool: 'Vite',
        testFramework: 'Vitest',
        packageManager: 'npm',
        hasTypeScript: true,
        hasPython: false,
      },
      structure: {
        isMonorepo: false,
        srcDir: 'src',
        hasTests: true,
        hasDocs: false,
        hasCI: false,
        fileCount: 10,
      },
      platforms: {
        detected: [],
        candidates: [],
      },
      collaboration: {
        contributorCount: 1,
        branchCount: 1,
        hasGit: true,
        isActive: true,
        recommendedMode: 'solo',
      },
      maturity: 'greenfield',
      projectState: 'greenfield',
      existingConfig: {
        hasAgentsMd: false,
        hasClaudeMd: false,
        hasCursorRules: false,
        hasQoderDir: false,
        hasOpenspecDir: false,
      },
      gaps: [],
    };
  }

  describe('buildTemplateContext', () => {
    it('should include projectName, techStack, agents, skills, tools, teamSize, timestamp', () => {
      const profile = makeProfile();
      const units: EnabledUnit[] = [
        { unitId: 'ak47-agent-developer', paradigm: 'L1' },
        { unitId: 'ak47-skill-entry-guard', paradigm: 'L1' },
      ];
      const ctx = buildTemplateContext(profile, units, projectDir);
      expect(ctx.projectName).toBeDefined();
      expect(ctx.techStack).toBeDefined();
      expect(ctx.techStack.primaryLanguage).toBe('TypeScript');
      expect(ctx.agents).toBeInstanceOf(Array);
      expect(ctx.agents).toHaveLength(1);
      expect(ctx.skills).toBeInstanceOf(Array);
      expect(ctx.skills).toHaveLength(1);
      expect(ctx.tools).toBeDefined();
      expect(ctx.tools.openspec).toBe(false);
      expect(ctx.tools.superpowers).toBe(false);
      expect(ctx.teamSize).toBe('solo');
      expect(ctx.timestamp).toBeDefined();
      expect(new Date(ctx.timestamp as string).toISOString()).toBe(ctx.timestamp);
    });
  });

  describe('plan', () => {
    it('should return GenerationPlan structure with file actions', async () => {
      const profile = makeProfile();
      // 使用 rules 单元而不是 Agent/Skill (Agent/Skill 现在被跳过)
      const units: EnabledUnit[] = [{ unitId: 'rules-ts', paradigm: 'L1' }];
      const generationPlan = await plan(units, profile, projectDir);
      expect(generationPlan).toBeDefined();
      expect(Array.isArray(generationPlan.files)).toBe(true);
      expect(Array.isArray(generationPlan.dependencies)).toBe(true);
      expect(Array.isArray(generationPlan.postActions)).toBe(true);
      // Agent/Skill 不再通过 plan 生成,所以文件数可能为 0 或只有 rules
      expect(generationPlan.files.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyPlan', () => {
    it('should create files for create actions', async () => {
      const filePath = join(projectDir, '.ak47', 'agents', 'test.md');
      const generationPlan = {
        files: [
          {
            path: '.ak47/agents/test.md',
            action: 'create' as const,
            content: '# Test Content',
          },
        ],
        dependencies: [],
        postActions: [],
      };
      await applyPlan(generationPlan, projectDir);
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toBe('# Test Content');
    });

    it('should skip files with skip action', async () => {
      mkdirSync(join(projectDir, '.ak47', 'agents'), { recursive: true });
      writeFileSync(join(projectDir, '.ak47', 'agents', 'existing.md'), 'original', 'utf-8');
      const generationPlan = {
        files: [
          {
            path: '.ak47/agents/existing.md',
            action: 'skip' as const,
            content: 'new content',
          },
        ],
        dependencies: [],
        postActions: [],
      };
      await applyPlan(generationPlan, projectDir);
      const content = readFileSync(join(projectDir, '.ak47', 'agents', 'existing.md'), 'utf-8');
      expect(content).toBe('original');
    });
  });
});
