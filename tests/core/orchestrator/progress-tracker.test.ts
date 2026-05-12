import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isStepGuided, markStepGuided } from '../../../src/core/orchestrator/progress-tracker.js';
import type { ProgressState } from '../../../src/types/progress.js';

describe('progress-tracker', () => {
  describe('isStepGuided', () => {
    it('should return false when progress is null', () => {
      expect(isStepGuided(null, 'step1')).toBe(false);
    });

    it('should return true when step is in guidedSteps', () => {
      const progress = {
        currentStep: 'step1',
        steps: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        guidedSteps: [
          {
            stepId: 'step1',
            status: 'completed',
            guidedAt: new Date().toISOString(),
            userConfirmed: true,
          },
        ],
      } as ProgressState;
      expect(isStepGuided(progress, 'step1')).toBe(true);
    });
  });

  describe('markStepGuided', () => {
    let tempDir: string;
    let progressPath: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'ak47-progress-'));
      const ak47Dir = join(tempDir, '.ak47');
      mkdirSync(ak47Dir, { recursive: true });
      progressPath = join(ak47Dir, 'progress.yaml');
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('should write and read back guided step', async () => {
      await markStepGuided(progressPath, 'step1');
      const raw = readFileSync(progressPath, 'utf-8');
      expect(raw).toContain('step1');
      expect(raw).toContain('completed');
    });

    it('should not duplicate guided steps', async () => {
      await markStepGuided(progressPath, 'step1');
      await markStepGuided(progressPath, 'step1');
      const raw = readFileSync(progressPath, 'utf-8');
      const { parse } = await import('yaml');
      const data = parse(raw);
      expect(data.guidedSteps).toHaveLength(1);
    });
  });
});
