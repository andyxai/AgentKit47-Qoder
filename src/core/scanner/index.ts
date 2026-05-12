import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectProfile, ProjectGap, ExistingConfigMap } from '../../types/project.js';
import { detectTechStack } from './tech-detector.js';
import { analyzeStructure } from './structure-analyzer.js';
import { detectPlatforms } from './platform-detector.js';
import { analyzeCollaboration } from './git-analyzer.js';
import { assessMaturity } from './maturity-assessor.js';

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
 * 检测已有 AI 工具配置
 */
async function detectExistingConfig(projectDir: string): Promise<ExistingConfigMap> {
  const [hasAgentsMd, hasClaudeMd, hasCursorRules, hasQoderDir, hasOpenspecDir] = await Promise.all(
    [
      pathExists(join(projectDir, 'AGENTS.md')),
      pathExists(join(projectDir, 'CLAUDE.md')),
      pathExists(join(projectDir, '.cursor', 'rules')),
      pathExists(join(projectDir, '.qoder')),
      pathExists(join(projectDir, 'openspec')),
    ]
  );

  return {
    hasAgentsMd,
    hasClaudeMd,
    hasCursorRules,
    hasQoderDir,
    hasOpenspecDir,
  };
}

/**
 * 根据扫描结果计算项目缺口
 */
function computeGaps(
  structure: Awaited<ReturnType<typeof analyzeStructure>>,
  collaboration: Awaited<ReturnType<typeof analyzeCollaboration>>,
  existingConfig: ExistingConfigMap
): ProjectGap[] {
  const gaps: ProjectGap[] = [];

  if (!collaboration.hasGit) {
    gaps.push({
      id: 'missing-vcs',
      severity: 'critical',
      description: '未检测到 Git 版本控制',
      suggestion: '执行 `git init` 初始化仓库并建立基础版本管理流程',
    });
  }

  if (!structure.hasTests) {
    gaps.push({
      id: 'missing-tests',
      severity: 'warn',
      description: '未检测到测试目录或测试配置',
      suggestion: '添加 Jest / Vitest / Mocha 等测试框架并编写测试用例',
    });
  }

  if (!structure.hasCI) {
    gaps.push({
      id: 'missing-ci',
      severity: 'warn',
      description: '未检测到 CI/CD 配置',
      suggestion: '配置 GitHub Actions、GitLab CI 或其他持续集成流水线',
    });
  }

  if (!structure.hasDocs) {
    gaps.push({
      id: 'missing-docs',
      severity: 'info',
      description: '未检测到文档目录',
      suggestion: '创建 docs/ 目录并维护 README、API 文档等项目说明',
    });
  }

  if (!existingConfig.hasAgentsMd && !existingConfig.hasClaudeMd && !existingConfig.hasQoderDir) {
    gaps.push({
      id: 'missing-ai-config',
      severity: 'info',
      description: '未检测到 AI 编程助手配置',
      suggestion: '使用 `ak47 init` 初始化项目级的 AI 助手配置',
    });
  }

  return gaps;
}

/**
 * 扫描项目并生成完整画像
 *
 * 编排逻辑：
 * 1. 并行执行 4 个独立检测器
 * 2. 同步评估成熟度
 * 3. 计算项目状态与缺口
 * 4. 组装完整 ProjectProfile
 */
export async function scanProject(projectDir: string): Promise<ProjectProfile> {
  // 1. 并行执行 4 个独立检测器
  const [techStack, structure, platforms, collaboration] = await Promise.all([
    detectTechStack(projectDir),
    analyzeStructure(projectDir),
    detectPlatforms(projectDir),
    analyzeCollaboration(projectDir),
  ]);

  // 2. 同步评估成熟度
  const maturity = assessMaturity(techStack, structure, collaboration, platforms);

  // 3. 计算 projectState
  const projectState = structure.fileCount < 5 && !collaboration.hasGit ? 'greenfield' : 'existing';

  // 4. 检测已有配置
  const existingConfig = await detectExistingConfig(projectDir);

  // 5. 计算 gaps
  const gaps = computeGaps(structure, collaboration, existingConfig);

  // 6. 组装结果
  return {
    techStack,
    structure,
    platforms,
    collaboration,
    maturity,
    projectState,
    existingConfig,
    gaps,
  };
}
