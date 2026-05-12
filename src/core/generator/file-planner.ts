import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { FileAction } from '../../types/plan.js';
import type { EnabledUnit, UnitFileSpec } from '../../types/units.js';
import { getUnitById } from '../recommender/unit-registry.js';
import { loadTemplate, renderTemplate } from './template-engine.js';

/**
 * 根据 unitId 推断默认输出路径
 * @returns 输出路径字符串，null 表示跳过该单元
 * 
 * 注意: Agent/Skill 模板已改为完全静态化,不再从这里渲染
 * 它们通过 templates/qoder/ 直接拷贝到 .qoder/ 目录
 */
function getDefaultOutputPath(unitId: string, platform?: string): string | null {
  // Agent/Skill 不再通过 file-planner 渲染,由 copyQoderConfig() 直接拷贝
  if (unitId.startsWith('ak47-agent-') || unitId.startsWith('ak47-skill-')) {
    return null;
  }
  if (unitId === 'platform-config') return null; // 平台配置特殊处理
  
  // 其他非 Agent/Skill 类型(如 rules)输出到 .qoder/rules/ 目录
  if (platform) {
    const configDir = platform === 'qoder' ? '.qoder' : '.';
    return `${configDir}/rules/${unitId}.md`;
  }
  // 默认生成到项目根目录的 rules 文件
  return `rules/${unitId}.md`;
}

/**
 * 根据 unitId 推断默认模板路径
 */
function getDefaultTemplatePath(unitId: string, templateDir: string): string {
  return join(templateDir, 'units', unitId, '_base.md');
}

/**
 * 根据启用的能力单元列表，规划文件操作
 *
 * @param enabledUnits - 启用的能力单元列表
 * @param projectDir - 目标项目根目录
 * @param templateDir - 模板目录绝对路径
 * @param variables - Mustache 模板变量
 * @param selectedPlatforms - 选中的平台列表（可选）
 * @returns 文件操作列表
 */
export async function planFileActions(
  enabledUnits: EnabledUnit[],
  projectDir: string,
  templateDir: string,
  variables: Record<string, unknown>,
  selectedPlatforms?: string[]
): Promise<FileAction[]> {
  const actions: FileAction[] = [];

  for (const unit of enabledUnits) {
    const def = getUnitById(unit.unitId);
    if (!def) continue;

    const fileSpecs: UnitFileSpec[] = def.files && def.files.length > 0 ? def.files : [];

    if (fileSpecs.length === 0) {
      // Phase 1：使用默认映射
      // 如果有选中的平台，为每个平台生成文件
      const platformsToGenerate = selectedPlatforms && selectedPlatforms.length > 0 
        ? selectedPlatforms 
        : [undefined]; // 未选择平台时只生成通用配置

      for (const platform of platformsToGenerate) {
        const outputPath = getDefaultOutputPath(unit.unitId, platform);
        if (outputPath === null) continue;

        const templatePath = getDefaultTemplatePath(unit.unitId, templateDir);
        const fullOutputPath = join(projectDir, outputPath);
        const templateContent = await loadTemplate(templatePath);
        const content = templateContent ? renderTemplate(templateContent, variables) : '';

        actions.push({
          path: outputPath,
          action: existsSync(fullOutputPath) ? 'skip' : 'create',
          templatePath,
          variables,
          content: content || undefined,
        });
      }
    } else {
      for (const spec of fileSpecs) {
        const templatePath = join(templateDir, spec.templatePath);
        const fullOutputPath = join(projectDir, spec.outputPath);
        const templateContent = await loadTemplate(templatePath);

        let content: string | undefined;
        if (spec.type === 'render' && templateContent) {
          content = renderTemplate(templateContent, variables);
        } else {
          content = templateContent || undefined;
        }

        actions.push({
          path: spec.outputPath,
          action: existsSync(fullOutputPath) ? 'skip' : 'create',
          templatePath,
          variables: spec.type === 'render' ? variables : undefined,
          content,
        });
      }
    }
  }

  return actions;
}
