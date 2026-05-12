import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { ProjectProfileSchema } from '../../src/types/project.js';
import { Ak47ConfigSchema } from '../../src/types/config.js';
import { CapabilityUnitDefSchema } from '../../src/types/units.js';
import { GenerationPlanSchema } from '../../src/types/plan.js';
import { ProgressStateSchema } from '../../src/types/progress.js';

describe('ProjectProfileSchema', () => {
  const validProjectProfile = {
    techStack: {
      primaryLanguage: 'typescript',
      framework: 'react',
      buildTool: 'vite',
      testFramework: 'vitest',
      packageManager: 'npm',
      hasTypeScript: true,
      hasPython: false,
    },
    structure: {
      isMonorepo: false,
      srcDir: 'src',
      hasTests: true,
      hasDocs: true,
      hasCI: false,
      fileCount: 42,
    },
    platforms: {
      detected: [{ id: 'qoder', configFiles: ['.qoder/superpowers.yaml'] }],
      candidates: [],
    },
    collaboration: {
      contributorCount: 1,
      branchCount: 3,
      hasGit: true,
      isActive: true,
      recommendedMode: 'solo',
    },
    maturity: 'growing',
    projectState: 'existing',
    existingConfig: {
      hasAgentsMd: false,
      hasClaudeMd: false,
      hasCursorRules: false,
      hasQoderDir: true,
      hasOpenspecDir: false,
    },
    gaps: [],
  };

  it('parses valid project profile', () => {
    const result = ProjectProfileSchema.parse(validProjectProfile);
    expect(result.techStack.primaryLanguage).toBe('typescript');
    expect(result.maturity).toBe('growing');
  });

  it('throws ZodError for missing required field', () => {
    const invalid = { ...validProjectProfile, techStack: undefined };
    expect(() => ProjectProfileSchema.parse(invalid)).toThrow(ZodError);
  });

  it('throws ZodError for wrong enum value', () => {
    const invalid = { ...validProjectProfile, maturity: 'unknown' };
    expect(() => ProjectProfileSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('Ak47ConfigSchema', () => {
  const validConfig = {
    version: '1.0.0',
    projectName: 'my-project',
    platforms: [{ id: 'qoder', enabled: true, configDir: '.qoder' }],
    enabledUnits: ['ak47-agent-developer'],
    paradigm: 'L1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('parses valid config without customReviewers', () => {
    const result = Ak47ConfigSchema.parse(validConfig);
    expect(result.projectName).toBe('my-project');
    expect(result.paradigm).toBe('L1');
    expect(result.customReviewers).toBeUndefined();
  });

  it('parses valid config with customReviewers', () => {
    const withReviewers = {
      ...validConfig,
      customReviewers: [{ id: 'r1', name: 'Reviewer1', path: 'r1.md', order: 1 }],
    };
    const result = Ak47ConfigSchema.parse(withReviewers);
    expect(result.customReviewers).toHaveLength(1);
  });

  it('throws ZodError for missing required field', () => {
    const invalid = { ...validConfig, projectName: undefined };
    expect(() => Ak47ConfigSchema.parse(invalid)).toThrow(ZodError);
  });

  it('throws ZodError for invalid platform id', () => {
    const invalid = {
      ...validConfig,
      platforms: [{ id: 'invalid-platform', enabled: true, configDir: 'x' }],
    };
    expect(() => Ak47ConfigSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('CapabilityUnitDefSchema', () => {
  const validUnit = {
    id: 'ak47-agent-developer',
    name: 'Developer Agent',
    category: 'B',
    description: 'A developer agent',
    platforms: ['qoder', 'claude-code'],
    dependencies: [],
    paradigmLevels: ['L1', 'L2'],
  };

  it('parses valid unit definition', () => {
    const result = CapabilityUnitDefSchema.parse(validUnit);
    expect(result.id).toBe('ak47-agent-developer');
    expect(result.category).toBe('B');
  });

  it('parses valid unit with optional fields', () => {
    const withOptional = {
      ...validUnit,
      source: 'agentkit47',
      suggests: ['ak47-agent-tester'],
      files: [{ templatePath: 't.md', outputPath: 'o.md', type: 'render' }],
    };
    const result = CapabilityUnitDefSchema.parse(withOptional);
    expect(result.files).toHaveLength(1);
  });

  it('throws ZodError for missing required field', () => {
    const invalid = { ...validUnit, name: undefined };
    expect(() => CapabilityUnitDefSchema.parse(invalid)).toThrow(ZodError);
  });

  it('throws ZodError for invalid category', () => {
    const invalid = { ...validUnit, category: 'D' };
    expect(() => CapabilityUnitDefSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('GenerationPlanSchema', () => {
  const validPlan = {
    files: [
      { path: 'README.md', action: 'create' },
      { path: 'src/index.ts', action: 'update', content: 'export {};' },
    ],
    dependencies: ['lodash'],
    postActions: ['npm install'],
  };

  it('parses valid generation plan', () => {
    const result = GenerationPlanSchema.parse(validPlan);
    expect(result.files).toHaveLength(2);
    expect(result.dependencies).toContain('lodash');
  });

  it('parses valid plan with installations', () => {
    const withInstall = {
      ...validPlan,
      installations: [{ tool: 'openspec', action: 'install', message: 'Install OpenSpec' }],
    };
    const result = GenerationPlanSchema.parse(withInstall);
    expect(result.installations).toHaveLength(1);
  });

  it('throws ZodError for invalid file action', () => {
    const invalid = {
      ...validPlan,
      files: [{ path: 'x.md', action: 'delete' }],
    };
    expect(() => GenerationPlanSchema.parse(invalid)).toThrow(ZodError);
  });

  it('throws ZodError for missing required field', () => {
    const invalid = { ...validPlan, postActions: undefined };
    expect(() => GenerationPlanSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('ProgressStateSchema', () => {
  const validProgress = {
    currentStep: 'step-1',
    steps: [
      { id: 'step-1', title: 'Init', status: 'in_progress', commands: ['ak47 init'] },
      { id: 'step-2', title: 'Review', status: 'pending' },
    ],
    startedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('parses valid progress state', () => {
    const result = ProgressStateSchema.parse(validProgress);
    expect(result.currentStep).toBe('step-1');
    expect(result.steps).toHaveLength(2);
  });

  it('throws ZodError for invalid step status', () => {
    const invalid = {
      ...validProgress,
      steps: [{ id: 's1', title: 'T', status: 'done' }],
    };
    expect(() => ProgressStateSchema.parse(invalid)).toThrow(ZodError);
  });

  it('throws ZodError for missing required field', () => {
    const invalid = { ...validProgress, startedAt: undefined };
    expect(() => ProgressStateSchema.parse(invalid)).toThrow(ZodError);
  });
});
