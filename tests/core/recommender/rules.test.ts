import { describe, it, expect } from 'vitest';
import { executeRules, type RuleExecutionResult } from '../../../src/core/recommender/rules.js';
import type { ProjectProfile, EnabledUnit } from '../../../src/types/index.js';

function makeProfile(overrides: Partial<ProjectProfile> = {}): ProjectProfile {
  const base: ProjectProfile = {
    techStack: {
      primaryLanguage: null,
      framework: null,
      buildTool: null,
      testFramework: null,
      packageManager: null,
      hasTypeScript: false,
      hasPython: false,
    },
    structure: {
      isMonorepo: false,
      srcDir: null,
      hasTests: false,
      hasDocs: false,
      hasCI: false,
      fileCount: 0,
    },
    platforms: { detected: [], candidates: [] },
    collaboration: {
      contributorCount: 0,
      branchCount: 0,
      hasGit: false,
      isActive: false,
      recommendedMode: 'solo',
    },
    maturity: 'growing',
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
  return { ...base, ...overrides };
}

describe('executeRules', () => {
  it("R1: hasPython=true → addedUnits 含 'rules-python'", () => {
    const profile = makeProfile({
      techStack: { ...makeProfile().techStack, hasPython: true },
    });
    const result = executeRules(profile, []);
    expect(result.addedUnits.has('rules-python')).toBe(true);
    expect(result.reasoning.some((r) => r.includes('R1'))).toBe(true);
  });

  it("R2: hasTypeScript=true → addedUnits 含 'rules-ts'", () => {
    const profile = makeProfile({
      techStack: { ...makeProfile().techStack, hasTypeScript: true },
    });
    const result = executeRules(profile, []);
    expect(result.addedUnits.has('rules-ts')).toBe(true);
    expect(result.reasoning.some((r) => r.includes('R2'))).toBe(true);
  });

  it("R3: hasTests=false 且无 TDD skill → addedUnits 含 'skill-test-driven-development'", () => {
    const profile = makeProfile({
      structure: { ...makeProfile().structure, hasTests: false },
    });
    const result = executeRules(profile, []);
    expect(result.addedUnits.has('skill-test-driven-development')).toBe(true);
    expect(result.reasoning.some((r) => r.includes('R3'))).toBe(true);
  });

  it('R3: hasTests=false 但已有 TDD skill → 不触发建议', () => {
    const profile = makeProfile({
      structure: { ...makeProfile().structure, hasTests: false },
    });
    const enabledUnits: EnabledUnit[] = [
      { unitId: 'skill-test-driven-development', paradigm: 'L1' },
    ];
    const result = executeRules(profile, enabledUnits);
    expect(result.suggestedUnits).not.toContain('skill-test-driven-development');
    expect(result.reasoning.some((r) => r.includes('R3'))).toBe(false);
  });

  it('R4: collaboration mode → suggestedUnits 含相关单元', () => {
    const profile = makeProfile({
      collaboration: { ...makeProfile().collaboration, recommendedMode: 'collaboration' },
    });
    const result = executeRules(profile, []);
    expect(result.suggestedUnits).toContain('skill-requesting-code-review');
    expect(result.suggestedUnits).toContain('ak47-agent-reviewer');
    expect(result.reasoning.some((r) => r.includes('R4'))).toBe(true);
  });

  it("R5: maturity='legacy' → suggestedUnits 含 'skill-systematic-debugging'", () => {
    const profile = makeProfile({ maturity: 'legacy' });
    const result = executeRules(profile, []);
    expect(result.suggestedUnits).toContain('skill-systematic-debugging');
    expect(result.reasoning.some((r) => r.includes('R5'))).toBe(true);
  });

  it("R6: hasOpenspecDir=true → alreadyConfigured 含 'spec-management'", () => {
    const profile = makeProfile({
      existingConfig: { ...makeProfile().existingConfig, hasOpenspecDir: true },
    });
    const result = executeRules(profile, []);
    expect(result.alreadyConfigured.has('spec-management')).toBe(true);
    expect(result.reasoning.some((r) => r.includes('R6'))).toBe(true);
  });

  it("R8: collaboration → addedUnits 含 'collab-sync'", () => {
    const profile = makeProfile({
      collaboration: { ...makeProfile().collaboration, recommendedMode: 'collaboration' },
    });
    const result = executeRules(profile, []);
    expect(result.addedUnits.has('collab-sync')).toBe(true);
    expect(result.reasoning.some((r) => r.includes('R8'))).toBe(true);
  });

  it('多规则组合触发验证', () => {
    const profile = makeProfile({
      techStack: {
        ...makeProfile().techStack,
        hasTypeScript: true,
        hasPython: true,
      },
      collaboration: {
        ...makeProfile().collaboration,
        recommendedMode: 'collaboration',
      },
      maturity: 'legacy',
      structure: { ...makeProfile().structure, hasTests: false },
      existingConfig: { ...makeProfile().existingConfig, hasOpenspecDir: true },
    });
    const result = executeRules(profile, []);

    expect(result.addedUnits.has('rules-python')).toBe(true);
    expect(result.addedUnits.has('rules-ts')).toBe(true);
    expect(result.addedUnits.has('collab-sync')).toBe(true);
    expect(result.addedUnits.has('skill-test-driven-development')).toBe(true);
    expect(result.suggestedUnits).toContain('skill-systematic-debugging');
    expect(result.alreadyConfigured.has('spec-management')).toBe(true);
  });

  it('reasoning 数组包含触发的规则说明', () => {
    const profile = makeProfile({
      techStack: { ...makeProfile().techStack, hasTypeScript: true },
    });
    const result = executeRules(profile, []);
    expect(result.reasoning.length).toBeGreaterThanOrEqual(1);
    expect(result.reasoning[0]).toMatch(/^\[R\d+\]/);
  });
});
