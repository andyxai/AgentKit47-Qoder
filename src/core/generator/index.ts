import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { GenerationPlan } from '../../types/plan.js';
import type { EnabledUnit } from '../../types/units.js';
import type { ProjectProfile } from '../../types/project.js';
import { getUnitById } from '../recommender/unit-registry.js';
import { planFileActions } from './file-planner.js';
import { ensureDir } from '../../utils/paths.js';
import { saveSnapshot } from '../upgrader/snapshot-manager.js';

/**
 * 从当前文件路径向上查找 package.json 所在的目录作为包根目录
 */
function findPackageRoot(currentFilePath: string): string {
  let current = dirname(resolve(currentFilePath));
  while (true) {
    if (existsSync(join(current, 'package.json'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error('无法找到 package.json 所在的包根目录');
    }
    current = parent;
  }
}

/**
 * 从项目画像和启用的能力单元组装 Mustache 模板变量对象
 *
 * @param profile - 项目画像
 * @param enabledUnits - 启用的能力单元列表
 * @param projectDir - 项目目录（用于推断项目名称）
 * @returns 模板变量对象
 */
export function buildTemplateContext(
  profile: ProjectProfile,
  enabledUnits: EnabledUnit[],
  projectDir: string
): Record<string, unknown> {
  const agents = enabledUnits
    .filter((u) => u.unitId.startsWith('ak47-agent-'))
    .map((u) => {
      const def = getUnitById(u.unitId);
      return {
        name: u.unitId,
        displayName: def?.name ?? u.unitId,
        description: def?.description ?? '',
      };
    });

  const skills = enabledUnits
    .filter((u) => u.unitId.startsWith('ak47-skill-'))
    .map((u) => {
      const def = getUnitById(u.unitId);
      return {
        name: u.unitId,
        displayName: def?.name ?? u.unitId,
        description: def?.description ?? '',
      };
    });

  const hasPlatformConfig = enabledUnits.some((u) => u.unitId === 'platform-config');

  return {
    projectName: basename(projectDir),
    techStack: {
      primaryLanguage: profile.techStack.primaryLanguage,
      framework: profile.techStack.framework,
      buildTool: profile.techStack.buildTool,
      testFramework: profile.techStack.testFramework,
    },
    agents,
    skills,
    tools: {
      openspec: hasPlatformConfig,
      superpowers: hasPlatformConfig,
    },
    teamSize: profile.collaboration.recommendedMode === 'solo' ? 'solo' : 'team',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 生成文件生成计划
 *
 * @param enabledUnits - 启用的能力单元列表
 * @param profile - 项目画像
 * @param projectDir - 目标项目根目录
 * @param selectedPlatforms - 选中的平台列表（可选）
 * @returns 生成计划
 */
export async function plan(
  enabledUnits: EnabledUnit[],
  profile: ProjectProfile,
  projectDir: string,
  selectedPlatforms?: string[]
): Promise<GenerationPlan> {
  const variables = buildTemplateContext(profile, enabledUnits, projectDir);

  const currentFilePath = fileURLToPath(import.meta.url);
  const packageRoot = findPackageRoot(currentFilePath);
  const templateDir = join(packageRoot, 'templates');

  const files = await planFileActions(enabledUnits, projectDir, templateDir, variables, selectedPlatforms);

  return {
    files,
    dependencies: [],
    postActions: [],
  };
}

/**
 * 从项目根目录的 package.json 读取 CLI 版本号
 *
 * @param projectDir - 项目根目录
 * @returns CLI 版本号，读取失败时回退到 '0.0.0'
 */
async function getCliVersion(): Promise<string> {
  try {
    // 从 CLI 自身 package.json 读取版本号
    const currentFilePath = fileURLToPath(import.meta.url);
    const cliPkgRoot = findPackageRoot(currentFilePath);
    const cliPkgPath = join(cliPkgRoot, 'package.json');
    const raw = await readFile(cliPkgPath, 'utf-8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * 执行生成计划，写入文件系统
 *
 * @param generationPlan - 生成计划
 * @param projectDir - 目标项目根目录
 */
export async function applyPlan(generationPlan: GenerationPlan, projectDir: string): Promise<void> {
  const writtenFiles: Array<{ relativePath: string; absolutePath: string }> = [];

  for (const fileAction of generationPlan.files) {
    if (fileAction.action === 'skip') {
      continue;
    }

    const fullPath = join(projectDir, fileAction.path);
    await ensureDir(dirname(fullPath));

    const content = fileAction.content ?? '';
    await writeFile(fullPath, content, 'utf-8');

    writtenFiles.push({
      relativePath: fileAction.path,
      absolutePath: fullPath,
    });
  }

  // 所有文件写入完成后，保存快照
  if (writtenFiles.length > 0) {
    const cliVersion = await getCliVersion();
    await saveSnapshot(projectDir, writtenFiles, cliVersion);
  }
}
