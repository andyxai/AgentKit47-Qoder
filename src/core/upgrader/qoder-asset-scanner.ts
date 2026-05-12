import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Qoder 静态资产：Agent 或 Skill。
 *
 * 区别于 rules-* 这类需要 Mustache 渲染的单元，Agent/Skill 在 init 阶段
 * 是从 `templates/qoder/` 直接拷贝的静态文件，升级时也应保持"按字节比对、
 * 按字节覆盖"的语义。
 */
export interface QoderAsset {
  /** unitId，例如 `ak47-agent-developer` 或 `ak47-skill-entry-guard` */
  unitId: string;
  type: 'agent' | 'skill';
  /** 模板源文件绝对路径 */
  sourcePath: string;
  /** 相对项目根目录的输出路径 */
  outputPath: string;
}

/**
 * 扫描 templates/qoder/ 下的 Agent 与 Skill 清单。
 *
 * 约定：
 * - Agent：`templates/qoder/agents/<name>.md` → `.qoder/agents/<name>.md`
 * - Skill：`templates/qoder/skills/<category>/<name>/SKILL.md`
 *          → `.qoder/skills/<category>/<name>/SKILL.md`
 *
 * 只返回 ak47-* 前缀的资产（官方资产），用户自定义资产由 `isUserCustomContent`
 * 单独保护，不进入升级通道。
 *
 * @param templateDir - `templates/` 目录绝对路径
 * @returns Agent + Skill 扫描清单；当 templates/qoder/ 不存在时返回空数组
 */
export async function scanQoderAssets(templateDir: string): Promise<QoderAsset[]> {
  const assets: QoderAsset[] = [];
  const qoderDir = join(templateDir, 'qoder');
  if (!existsSync(qoderDir)) {
    return assets;
  }

  // Agents: templates/qoder/agents/*.md
  const agentsDir = join(qoderDir, 'agents');
  if (existsSync(agentsDir)) {
    const agentFiles = await readdir(agentsDir, { withFileTypes: true });
    for (const entry of agentFiles) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.md')) continue;
      const base = entry.name.replace(/\.md$/, '');
      if (!base.startsWith('ak47-')) continue;
      assets.push({
        unitId: base,
        type: 'agent',
        sourcePath: join(agentsDir, entry.name),
        outputPath: `.qoder/agents/${entry.name}`,
      });
    }
  }

  // Skills: templates/qoder/skills/<category>/<name>/SKILL.md
  const skillsDir = join(qoderDir, 'skills');
  if (existsSync(skillsDir)) {
    const categories = await readdir(skillsDir, { withFileTypes: true });
    for (const category of categories) {
      if (!category.isDirectory()) continue;
      const categoryDir = join(skillsDir, category.name);
      const skillEntries = await readdir(categoryDir, { withFileTypes: true });
      for (const skill of skillEntries) {
        // 类别目录下允许存在说明文件（README.md 等），跳过
        if (!skill.isDirectory()) continue;
        if (!skill.name.startsWith('ak47-')) continue;
        const skillMd = join(categoryDir, skill.name, 'SKILL.md');
        if (!existsSync(skillMd)) continue;
        assets.push({
          unitId: skill.name,
          type: 'skill',
          sourcePath: skillMd,
          outputPath: `.qoder/skills/${category.name}/${skill.name}/SKILL.md`,
        });
      }
    }
  }

  return assets;
}

/**
 * 判断一个 unitId 是否属于 Qoder 静态资产命名空间（ak47-agent-* / ak47-skill-*）。
 */
export function isQoderAssetUnitId(unitId: string): boolean {
  return unitId.startsWith('ak47-agent-') || unitId.startsWith('ak47-skill-');
}
