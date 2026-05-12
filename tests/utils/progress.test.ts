import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadProgress, saveProgress, updateStepStatus } from '../../src/utils/progress.js';
import type { ProgressState } from '../../src/types/index.js';

describe('progress utils', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ak47-progress-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  const createValidProgress = (): ProgressState => ({
    currentStep: 'step-1',
    steps: [
      { id: 'step-1', title: 'Initialize', status: 'in_progress', commands: ['ak47 init'] },
      { id: 'step-2', title: 'Configure', status: 'pending' },
      { id: 'step-3', title: 'Review', status: 'pending' },
    ],
    startedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  describe('loadProgress', () => {
    it('returns null when progress file does not exist', async () => {
      const result = await loadProgress(tempDir);
      expect(result).toBeNull();
    });

    it('returns progress when file exists and is valid', async () => {
      const progress = createValidProgress();
      await saveProgress(progress, tempDir);
      const result = await loadProgress(tempDir);
      expect(result).toEqual(progress);
    });

    it('returns null when file content is invalid yaml', async () => {
      const ak47Dir = join(tempDir, '.ak47');
      const progressPath = join(ak47Dir, 'progress.yaml');
      const fs = await import('node:fs/promises');
      await fs.mkdir(ak47Dir, { recursive: true });
      await fs.writeFile(progressPath, 'invalid: [yaml', 'utf-8');
      const result = await loadProgress(tempDir);
      expect(result).toBeNull();
    });

    it('returns null when parsed content fails schema validation', async () => {
      const ak47Dir = join(tempDir, '.ak47');
      const progressPath = join(ak47Dir, 'progress.yaml');
      const fs = await import('node:fs/promises');
      await fs.mkdir(ak47Dir, { recursive: true });
      await fs.writeFile(progressPath, 'currentStep: s1\nsteps: []\n', 'utf-8');
      const result = await loadProgress(tempDir);
      expect(result).toBeNull();
    });
  });

  describe('saveProgress', () => {
    it('writes progress and creates .ak47 directory', async () => {
      const progress = createValidProgress();
      await saveProgress(progress, tempDir);
      expect(existsSync(join(tempDir, '.ak47'))).toBe(true);
      const result = await loadProgress(tempDir);
      expect(result).toEqual(progress);
    });

    it('writes progress that can be re-read', async () => {
      const progress = createValidProgress();
      await saveProgress(progress, tempDir);
      const result = await loadProgress(tempDir);
      expect(result?.currentStep).toBe('step-1');
      expect(result?.steps).toHaveLength(3);
    });
  });

  describe('updateStepStatus', () => {
    it('returns null when progress file does not exist', async () => {
      const result = await updateStepStatus('step-1', 'completed', tempDir);
      expect(result).toBeNull();
    });

    it('returns null when step id is not found', async () => {
      const progress = createValidProgress();
      await saveProgress(progress, tempDir);
      const result = await updateStepStatus('nonexistent', 'completed', tempDir);
      expect(result).toBeNull();
    });

    it('updates specific step status and updatedAt timestamp', async () => {
      const progress = createValidProgress();
      await saveProgress(progress, tempDir);
      const beforeUpdate = await loadProgress(tempDir);
      expect(beforeUpdate!.updatedAt).toBe('2026-01-01T00:00:00.000Z');

      const result = await updateStepStatus('step-2', 'completed', tempDir);
      expect(result).not.toBeNull();
      expect(result!.steps[1].status).toBe('completed');
      expect(result!.steps[0].status).toBe('in_progress');
      expect(result!.updatedAt).not.toBe('2026-01-01T00:00:00.000Z');

      // Verify persistence
      const loaded = await loadProgress(tempDir);
      expect(loaded!.steps[1].status).toBe('completed');
      expect(loaded!.updatedAt).toBe(result!.updatedAt);
    });

    it('does not affect other steps', async () => {
      const progress = createValidProgress();
      await saveProgress(progress, tempDir);
      await updateStepStatus('step-1', 'completed', tempDir);
      const loaded = await loadProgress(tempDir);
      expect(loaded!.steps[0].status).toBe('completed');
      expect(loaded!.steps[1].status).toBe('pending');
      expect(loaded!.steps[2].status).toBe('pending');
    });
  });
});
