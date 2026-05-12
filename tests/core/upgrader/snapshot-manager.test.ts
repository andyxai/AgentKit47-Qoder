import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  computeFileHash,
  saveSnapshot,
  loadSnapshot,
  hasUserModified,
} from '../../../src/core/upgrader/snapshot-manager.js';

describe('snapshot-manager', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ak47-snapshot-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('computeFileHash returns correct sha256 for known content', async () => {
    const filePath = join(tempDir, 'test.txt');
    const content = 'hello world';
    writeFileSync(filePath, content, 'utf-8');
    const hash = await computeFileHash(filePath);
    const expected = createHash('sha256').update(content).digest('hex');
    expect(hash).toBe(expected);
  });

  it('saveSnapshot + loadSnapshot roundtrip is consistent', async () => {
    const agentsDir = join(tempDir, '.ak47', 'agents');
    mkdirSync(agentsDir, { recursive: true });
    const filePath = join(agentsDir, 'test.md');
    writeFileSync(filePath, 'agent content', 'utf-8');

    await saveSnapshot(
      tempDir,
      [{ relativePath: '.ak47/agents/test.md', absolutePath: filePath }],
      '1.0.0'
    );

    const snapshot = await loadSnapshot(tempDir);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.version).toBe('1.0.0');
    expect(snapshot!.files['.ak47/agents/test.md']).toBe(
      createHash('sha256').update('agent content').digest('hex')
    );
  });

  it('loadSnapshot returns null when file does not exist', async () => {
    const snapshot = await loadSnapshot(tempDir);
    expect(snapshot).toBeNull();
  });

  it('hasUserModified returns false when user has not modified', async () => {
    const filePath = join(tempDir, '.ak47', 'test.md');
    mkdirSync(join(tempDir, '.ak47'), { recursive: true });
    writeFileSync(filePath, 'original', 'utf-8');

    const snapshot = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      files: { '.ak47/test.md': createHash('sha256').update('original').digest('hex') },
    };

    const modified = await hasUserModified(tempDir, '.ak47/test.md', snapshot);
    expect(modified).toBe(false);
  });

  it('hasUserModified returns true when user has modified', async () => {
    const filePath = join(tempDir, '.ak47', 'test.md');
    mkdirSync(join(tempDir, '.ak47'), { recursive: true });
    writeFileSync(filePath, 'modified', 'utf-8');

    const snapshot = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      files: { '.ak47/test.md': createHash('sha256').update('original').digest('hex') },
    };

    const modified = await hasUserModified(tempDir, '.ak47/test.md', snapshot);
    expect(modified).toBe(true);
  });

  it('hasUserModified returns true when file not in snapshot (conservative)', async () => {
    const snapshot = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      files: {},
    };
    const modified = await hasUserModified(tempDir, '.ak47/missing.md', snapshot);
    expect(modified).toBe(true);
  });
});
