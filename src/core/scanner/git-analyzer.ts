import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import type { CollaborationInfo } from '../../types/project.js';

/**
 * 分析项目的 Git 协作信息
 */
export async function analyzeCollaboration(projectDir: string): Promise<CollaborationInfo> {
  const defaultResult: CollaborationInfo = {
    contributorCount: 0,
    branchCount: 0,
    hasGit: false,
    isActive: false,
    recommendedMode: 'solo',
  };

  const gitDir = join(projectDir, '.git');
  if (!existsSync(gitDir)) {
    return defaultResult;
  }

  const result: CollaborationInfo = {
    contributorCount: 0,
    branchCount: 0,
    hasGit: true,
    isActive: false,
    recommendedMode: 'solo',
  };

  const execOptions = {
    cwd: projectDir,
    encoding: 'utf8' as const,
    stdio: ['pipe', 'pipe', 'pipe'] as ['pipe', 'pipe', 'pipe'],
  };

  // ── contributorCount ──
  try {
    const output = execSync("git log --format='%ae' | sort -u | wc -l", execOptions);
    const count = parseInt(output.toString().trim(), 10);
    result.contributorCount = Number.isNaN(count) ? 0 : count;
  } catch {
    result.contributorCount = 0;
  }

  // ── branchCount ──
  try {
    const output = execSync('git branch --list | wc -l', execOptions);
    const count = parseInt(output.toString().trim(), 10);
    result.branchCount = Number.isNaN(count) ? 0 : count;
  } catch {
    result.branchCount = 0;
  }

  // ── isActive（最近 30 天有 commit）──
  try {
    execSync('git log --since="30 days ago" --oneline -1', execOptions);
    result.isActive = true;
  } catch {
    result.isActive = false;
  }

  // ── recommendedMode ──
  result.recommendedMode = result.contributorCount > 1 ? 'collaboration' : 'solo';

  return result;
}
