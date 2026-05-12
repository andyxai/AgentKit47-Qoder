import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import fg from 'fast-glob';
import type { ProjectStructure } from '../../types/project.js';

/**
 * 检查指定路径是否存在（文件或目录）
 */
async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查指定目录下是否存在子项
 */
async function dirHasEntries(dirPath: string): Promise<boolean> {
  try {
    const entries = await readdir(dirPath);
    return entries.length > 0;
  } catch {
    return false;
  }
}

/**
 * 分析项目结构信息
 */
export async function analyzeStructure(projectDir: string): Promise<ProjectStructure> {
  // ── Monorepo 检测 ──
  const [hasPnpmWorkspace, hasLerna, hasPackagesDir] = await Promise.all([
    pathExists(join(projectDir, 'pnpm-workspace.yaml')),
    pathExists(join(projectDir, 'lerna.json')),
    dirHasEntries(join(projectDir, 'packages')),
  ]);
  const isMonorepo = hasPnpmWorkspace || hasLerna || hasPackagesDir;

  // ── srcDir 检测（优先级：src > app > lib）──
  let srcDir: string | null = null;
  const srcCandidates = ['src', 'app', 'lib'];
  for (const candidate of srcCandidates) {
    if (await dirHasEntries(join(projectDir, candidate))) {
      srcDir = candidate;
      break;
    }
  }

  // ── 测试目录检测 ──
  const testDirs = ['tests', 'test', '__tests__', 'spec'];
  const testExistResults = await Promise.all(testDirs.map((d) => pathExists(join(projectDir, d))));
  const hasTests = testExistResults.some(Boolean);

  // ── 文档目录检测 ──
  const hasDocs = await pathExists(join(projectDir, 'docs'));

  // ── CI 配置检测 ──
  const [hasGitHubWorkflows, hasGitLabCI, hasJenkinsfile] = await Promise.all([
    dirHasEntries(join(projectDir, '.github', 'workflows')),
    pathExists(join(projectDir, '.gitlab-ci.yml')),
    pathExists(join(projectDir, 'Jenkinsfile')),
  ]);
  const hasCI = hasGitHubWorkflows || hasGitLabCI || hasJenkinsfile;

  // ── 文件数量统计 ──
  let fileCount = 0;
  try {
    const files = await fg('**/*', {
      cwd: projectDir,
      dot: false,
      onlyFiles: true,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'coverage/**'],
    });
    fileCount = files.length;
  } catch {
    // 统计失败时返回 0
  }

  return {
    isMonorepo,
    srcDir,
    hasTests,
    hasDocs,
    hasCI,
    fileCount,
  };
}
