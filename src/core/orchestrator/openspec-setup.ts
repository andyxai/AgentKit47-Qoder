/**
 * OpenSpec 安装与初始化设置
 *
 * OpenSpec 是必要依赖，已在 install.sh 中全局安装。
 * 此模块负责检测 OpenSpec 是否可用，并执行 `openspec init` 初始化项目配置。
 * 同时创建宪法层框架（PRD + 架构文档目录结构）。
 */

import { checkCommand, execute } from './command-executor.js';
import { markStepGuided } from './progress-tracker.js';
import type { EnabledUnit } from '../../types/units.js';
import { getProgressPath } from '../../utils/paths.js';
import { getTemplatesRoot } from '../../utils/template-path.js';
import { mkdir, writeFile } from 'fs/promises';
import { join, basename } from 'path';

/**
 * 判断单元是否需要 OpenSpec（Agent 或 Skill 类单元）
 */
function needsOpenSpec(unit: EnabledUnit): boolean {
  return unit.unitId.startsWith('ak47-agent-') || unit.unitId.startsWith('ak47-skill-');
}

/**
 * 创建宪法层框架（PRD + 架构文档目录结构）
 *
 * @param projectDir - 项目根目录
 * @param projectName - 项目名称
 */
async function createConstitutionFramework(projectDir: string, projectName: string): Promise<void> {
  console.log('[ak47] 正在创建宪法层框架...');

  try {
    // 1. 创建正式文档空目录结构（docs/ 下仅建目录，不放空骨架）
    const docsPrdDir = join(projectDir, 'docs', 'prd');
    const docsArchDir = join(projectDir, 'docs', 'architecture');
    await mkdir(join(docsPrdDir, 'modules'), { recursive: true });
    await mkdir(join(docsArchDir, 'modules'), { recursive: true });
    // 写入 .gitkeep 保持空目录可被 Git 追踪
    await writeFile(join(docsPrdDir, '.gitkeep'), '', 'utf-8');
    await writeFile(join(docsArchDir, '.gitkeep'), '', 'utf-8');

    // 2. 渲染后的骨架模板放入 .ak47/staged-docs/（填充内容后再由用户移入 docs/）
    const stagedPrdDir = join(projectDir, '.ak47', 'staged-docs', 'prd');
    const stagedArchDir = join(projectDir, '.ak47', 'staged-docs', 'architecture');
    await mkdir(join(stagedPrdDir, 'modules'), { recursive: true });
    await mkdir(join(stagedArchDir, 'modules'), { recursive: true });

    await renderConstitutionDocs(stagedPrdDir, stagedArchDir, projectName);

    console.log('[ak47] 宪法层框架创建完成（模板已放入 .ak47/staged-docs/，填充内容后移入 docs/）。');
  } catch (err) {
    console.warn(`[ak47] createConstitutionFramework 出错：${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 使用 Mustache 渲染宪法层文档
 *
 * 根据 ADR-001 决策：
 * - 模板文件保留在 templates/ 目录（源文件）
 * - 渲染后的骨架文档先放入 .ak47/staged-docs/（产物缓存）
 * - 用户填充内容后手动移入 docs/（正式产物）
 *
 * @param prdDir - PRD 目标目录
 * @param archDir - 架构文档目标目录
 * @param projectName - 项目名称
 */
async function renderConstitutionDocs(prdDir: string, archDir: string, projectName: string): Promise<void> {
  const { renderTemplate, loadTemplate } = await import('../generator/template-engine.js');
  const templatesRoot = getTemplatesRoot();
  const today = new Date().toISOString().split('T')[0];

  // 渲染上下文
  const context = {
    project_name: projectName,
    date: today,
  };

  // PRD 模板列表
  const prdTemplates = [
    { src: 'prd/vision.md.template', dest: 'vision.md' },
    { src: 'prd/module.md.template', dest: 'module.md' },
    { src: 'prd/_index.md.template', dest: '_index.md' },
  ];

  // 架构文档模板列表
  const archTemplates = [
    { src: 'architecture/01-system-overview.md.template', dest: '01-system-overview.md' },
    { src: 'architecture/module.md.template', dest: 'module.md' },
    { src: 'architecture/_index.md.template', dest: '_index.md' },
  ];

  // 渲染 PRD 文档
  for (const { src, dest } of prdTemplates) {
    const srcPath = join(templatesRoot, src);
    const destPath = join(prdDir, dest);
    try {
      const templateContent = await loadTemplate(srcPath);
      if (!templateContent) {
        console.warn(`[ak47] 模板 ${src} 为空，跳过生成 ${dest}`);
        continue;
      }
      const rendered = renderTemplate(templateContent, context);
      await writeFile(destPath, rendered, 'utf-8');
      console.log(`  ✓ 生成 ${dest}`);
    } catch (err) {
      console.warn(`[ak47] 渲染文档失败 ${src}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 渲染架构文档
  for (const { src, dest } of archTemplates) {
    const srcPath = join(templatesRoot, src);
    const destPath = join(archDir, dest);
    try {
      const templateContent = await loadTemplate(srcPath);
      if (!templateContent) {
        console.warn(`[ak47] 模板 ${src} 为空，跳过生成 ${dest}`);
        continue;
      }
      const rendered = renderTemplate(templateContent, context);
      await writeFile(destPath, rendered, 'utf-8');
      console.log(`  ✓ 生成 ${dest}`);
    } catch (err) {
      console.warn(`[ak47] 渲染文档失败 ${src}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/**
 * 设置 OpenSpec：检测安装 → 自动安装 → 执行 init → 记录进度
 *
 * @param enabledUnits - 已启用的能力单元列表
 * @param selectedPlatforms - 用户选中的目标平台列表
 * @param projectDir - 项目根目录
 */
export async function setupOpenSpec(
  enabledUnits: EnabledUnit[],
  selectedPlatforms: string[],
  projectDir: string
): Promise<void> {
  try {
    const openSpecUnits = enabledUnits.filter(needsOpenSpec);
    if (openSpecUnits.length === 0) {
      return;
    }

    console.log('[ak47] 检测到 Agent/Skill 单元，需要 OpenSpec 支持。');

    const isInstalled = await checkCommand('openspec');

    if (!isInstalled) {
      console.log('[ak47] OpenSpec 未安装，尝试自动安装...');
      // 尝试全局安装 OpenSpec
      const { tryInstall } = await import('./auto-fixer.js');
      const installed = await tryInstall('openspec');

      if (!installed) {
        console.error('[ak47] ❌ OpenSpec 安装失败，这是必要依赖');
        console.error('[ak47] 请手动执行以下命令：');
        console.error(`        npm install -g @fission-ai/openspec`);
        throw new Error('OpenSpec 安装失败，无法继续初始化');
      }
    }

    console.log('[ak47] 正在执行 openspec init...');
    const toolsParam = selectedPlatforms.length > 0 ? selectedPlatforms.join(',') : 'none';
    const result = await execute('openspec', ['init', '--tools', toolsParam], {
      cwd: projectDir,
    });

    if (result.success) {
      console.log('[ak47] OpenSpec 初始化完成。');
      
      // 创建宪法层框架（PRD + 架构文档）
      const projectName = basename(projectDir);
      await createConstitutionFramework(projectDir, projectName);
    } else {
      console.error(`[ak47] ❌ OpenSpec init 执行失败：${result.stderr || result.stdout}`);
      console.error('[ak47] 请手动执行：');
      console.error(`        openspec init --tools ${selectedPlatforms.join(',')}`);
      throw new Error('OpenSpec init 执行失败');
    }

    const progressPath = getProgressPath(projectDir);
    await markStepGuided(progressPath, 'openspec-init');
  } catch (err) {
    console.warn(`[ak47] setupOpenSpec 出错：${err instanceof Error ? err.message : String(err)}`);
  }
}
