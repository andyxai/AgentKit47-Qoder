import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectPlatforms } from '../../../src/core/scanner/platform-detector.js';

describe('detectPlatforms', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('空目录 → detected=[], candidates 包含所有已知平台', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'platform-'));
    const result = await detectPlatforms(tempDir);
    expect(result.detected).toHaveLength(0);
    const candidateIds = result.candidates.map((c) => c.id);
    expect(candidateIds).toContain('qoder');
    expect(candidateIds).toContain('claude-code');
    expect(result.candidates.every((c) => c.configFiles.length === 0)).toBe(true);
  });

  it('有 .qoder/ 目录 → detected 含 qoder', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'platform-'));
    mkdirSync(join(tempDir, '.qoder'));
    writeFileSync(join(tempDir, '.qoder', 'superpowers.yaml'), 'skills:\n');
    const result = await detectPlatforms(tempDir);
    const detectedIds = result.detected.map((d) => d.id);
    expect(detectedIds).toContain('qoder');
    const qoder = result.detected.find((d) => d.id === 'qoder');
    expect(qoder?.configFiles).toContain('.qoder');
  });

  it('有 CLAUDE.md → detected 含 claude-code', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'platform-'));
    writeFileSync(join(tempDir, 'CLAUDE.md'), '# Claude\n');
    const result = await detectPlatforms(tempDir);
    const detectedIds = result.detected.map((d) => d.id);
    expect(detectedIds).toContain('claude-code');
    const claude = result.detected.find((d) => d.id === 'claude-code');
    expect(claude?.configFiles).toContain('CLAUDE.md');
  });

  it('多平台共存（.qoder/ + CLAUDE.md）→ detected 含两个，candidates 为空', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'platform-'));
    mkdirSync(join(tempDir, '.qoder'));
    writeFileSync(join(tempDir, 'CLAUDE.md'), '# Claude\n');
    const result = await detectPlatforms(tempDir);
    const detectedIds = result.detected.map((d) => d.id);
    expect(detectedIds).toContain('qoder');
    expect(detectedIds).toContain('claude-code');
    expect(detectedIds).toHaveLength(2);

    expect(result.candidates).toHaveLength(0);
  });
});
