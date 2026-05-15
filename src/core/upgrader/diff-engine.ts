import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import type { Ak47Config } from '../../types/config.js';
import type { CapabilityUnitDef, UnitFileSpec } from '../../types/units.js';
import { getUnitRegistry, getUnitById } from '../recommender/unit-registry.js';
import { loadSnapshot, hasUserModified } from './snapshot-manager.js';
import { renderTemplate } from '../generator/template-engine.js';
import { scanQoderAssets, isQoderAssetUnitId } from './qoder-asset-scanner.js';

// ─── 类型定义 ───────────────────────────────────────────────

export type UpgradeStrategy = 'add' | 'update' | 'update-with-conflict' | 'deprecate' | 'skip';

export interface DiffEntry {
  unitId: string;
  strategy: UpgradeStrategy;
  files: string[]; // 涉及的文件相对路径列表
  details?: string; // 可读的变更说明
}

// ─── 辅助函数 ───────────────────────────────────────────────

/**
 * 根据 unitId 推断默认输出路径（与 file-planner 保持一致）
 * @returns 输出路径字符串，null 表示该单元不产生文件
 * 
 * 注意: Agent/Skill 已改为完全静态化，通过 templates/qoder/ 直接拷贝
 * 不再生成到 .ak47/ 目录
 */
function getDefaultOutputPath(unitId: string): string | null {
  if (unitId === 'platform-config') return null;
  // Agent/Skill 不再通过 file-planner 生成，由 copyQoderConfig() 直接拷贝
  if (unitId.startsWith('ak47-agent-') || unitId.startsWith('ak47-skill-')) {
    return null;
  }
  return `.ak47/rules/${unitId}.md`;
}

/**
 * 根据 unitId 推断默认模板路径（与 file-planner 保持一致）
 * 
 * 注意: Agent/Skill 已改为完全静态化,不再从这里获取模板
 */
function getDefaultTemplatePath(unitId: string, templateDir: string): string {
  // Agent/Skill 不再从 templates/units/ 渲染
  if (unitId.startsWith('ak47-agent-') || unitId.startsWith('ak47-skill-')) {
    return ''; // 返回空字符串,调用方会跳过
  }
  return join(templateDir, 'units', unitId, '_base.md');
}

/**
 * 收集一个能力单元涉及的所有文件相对路径
 * 优先使用 def.files（Phase 2+），否则走默认映射
 */
function collectUnitFilePaths(unitDef: CapabilityUnitDef, _templateDir: string): string[] {
  const fileSpecs: UnitFileSpec[] = unitDef.files && unitDef.files.length > 0 ? unitDef.files : [];

  if (fileSpecs.length > 0) {
    return fileSpecs.map((spec) => spec.outputPath);
  }

  // Phase 1 默认映射
  const outputPath = getDefaultOutputPath(unitDef.id);
  return outputPath ? [outputPath] : [];
}

/**
 * 计算字符串内容的 sha256 hash
 */
function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * 渲染模板并计算 hash
 * 使用与 executeUpgrade 一致的 context，确保 diff 和实际升级行为对齐
 */
async function computeTemplateHash(
  templatePath: string,
  projectName: string
): Promise<string | null> {
  try {
    const content = await readFile(templatePath, 'utf-8');
    const rendered = renderTemplate(content, { projectName, timestamp: new Date().toISOString() });
    return computeContentHash(rendered);
  } catch {
    // 模板文件不存在
    return null;
  }
}

// ─── 核心函数 ───────────────────────────────────────────────

/**
 * 对比 CLI 当前能力单元与项目现有状态，计算升级差异
 *
 * @param config - 项目 ak47 配置
 * @param projectDir - 项目根目录
 * @param templateDir - 模板目录绝对路径
 * @returns 每个能力单元的升级策略列表
 */
export async function computeUpgradeDiff(
  config: Ak47Config,
  projectDir: string,
  templateDir: string
): Promise<DiffEntry[]> {
  const registry = getUnitRegistry();
  const snapshot = await loadSnapshot(projectDir);
  const enabledUnitIds = new Set(config.enabledUnits);

  // 收集 CLI 中所有已注册的单元 ID
  const cliUnitIds = new Set(registry.keys());
  const entries: DiffEntry[] = [];

  // ── 情况 A：CLI 有、项目启用了 ──
  for (const unitId of config.enabledUnits) {
    // Agent/Skill 由静态资产通道统一处理，registry 这里跳过
    if (isQoderAssetUnitId(unitId)) {
      continue;
    }

    const unitDef = getUnitById(unitId);
    if (!unitDef) {
      // CLI 中已不存在，走情况 C
      continue;
    }

    const filePaths = collectUnitFilePaths(unitDef, templateDir);
    if (filePaths.length === 0) {
      // 该单元不产生文件（如 platform-config），跳过
      entries.push({
        unitId,
        strategy: 'skip',
        files: [],
        details: '该单元不产生文件，无需对比',
      });
      continue;
    }

    // 逐文件判定策略，取最严格的策略作为单元整体策略
    let worstStrategy: UpgradeStrategy = 'skip';
    const fileDetails: string[] = [];

    for (const relativePath of filePaths) {
      const snapshotHash = snapshot?.files[relativePath];

      // 先检查模板是否存在，不存在则无法更新
      const templatePath = getDefaultTemplatePath(unitId, templateDir);
      const newTemplateHash = await computeTemplateHash(templatePath, config.projectName);

      if (newTemplateHash === null) {
        // 模板文件不存在，无法更新
        worstStrategy = upgradePriority(worstStrategy, 'skip');
        fileDetails.push(`${relativePath}: 模板文件不存在，跳过`);
        continue;
      }

      if (!snapshot || !snapshotHash) {
        // 快照不存在或快照中无该文件记录 → 保守策略
        worstStrategy = upgradePriority(worstStrategy, 'update-with-conflict');
        fileDetails.push(`${relativePath}: 无快照记录，保守标记为冲突更新`);
        continue;
      }

      if (newTemplateHash === snapshotHash) {
        // 模板未变 → 但还需确认用户是否修改了当前文件
        const modified = await hasUserModified(projectDir, relativePath, snapshot);
        if (!modified) {
          // 模板未变且用户未修改 → 真正的 skip
          fileDetails.push(`${relativePath}: 模板与快照一致且用户未修改`);
        } else {
          // 模板未变但用户有修改 → 标记为冲突（用户本地修改需关注）
          worstStrategy = upgradePriority(worstStrategy, 'update-with-conflict');
          fileDetails.push(`${relativePath}: 模板未变，用户有本地修改，可能存在冲突`);
        }
        continue;
      }

      // 新模板 hash != 快照 hash → 模板已更新
      const userModified = await hasUserModified(projectDir, relativePath, snapshot);
      if (userModified) {
        worstStrategy = upgradePriority(worstStrategy, 'update-with-conflict');
        fileDetails.push(`${relativePath}: 模板已更新且用户有本地修改，存在冲突`);
      } else {
        worstStrategy = upgradePriority(worstStrategy, 'update');
        fileDetails.push(`${relativePath}: 模板已更新，用户未修改，可安全更新`);
      }
    }

    entries.push({
      unitId,
      strategy: worstStrategy,
      files: filePaths,
      details: fileDetails.join('; '),
    });
  }

  // ── 情况 B：CLI 有、项目未启用 ──
  for (const [unitId, unitDef] of registry) {
    if (enabledUnitIds.has(unitId)) continue;
    // Agent/Skill 由静态资产通道统一处理
    if (isQoderAssetUnitId(unitId)) continue;

    const filePaths = collectUnitFilePaths(unitDef, templateDir);
    entries.push({
      unitId,
      strategy: 'add',
      files: filePaths,
      details: `能力单元 ${unitId}（${unitDef.name}）未启用，可添加`,
    });
  }

  // ── 情况 C：项目启用了、CLI 中不存在 ──
  for (const unitId of config.enabledUnits) {
    if (cliUnitIds.has(unitId)) continue;
    // Agent/Skill 的 deprecate 判定在静态资产通道里处理
    if (isQoderAssetUnitId(unitId)) continue;

    entries.push({
      unitId,
      strategy: 'deprecate',
      files: [],
      details: `能力单元 ${unitId} 在当前 CLI 版本中不存在，可能已被移除或重命名`,
    });
  }

  // ── 情况 D：Qoder 静态资产（Agent/Skill） ──
  const assetEntries = await computeQoderAssetDiff(
    config,
    projectDir,
    templateDir,
    snapshot
  );
  entries.push(...assetEntries);

  return entries;
}

/**
 * 为 Qoder 静态资产（Agent/Skill）生成升级 diff。
 *
 * 与 rules-* 的差异：源文件不经 Mustache 渲染，按字节计算 hash。
 * 产生的策略与 rules-* 保持一致（add / update / update-with-conflict / skip / deprecate）。
 */
async function computeQoderAssetDiff(
  config: Ak47Config,
  projectDir: string,
  templateDir: string,
  snapshot: Awaited<ReturnType<typeof loadSnapshot>>
): Promise<DiffEntry[]> {
  const assets = await scanQoderAssets(templateDir);
  const assetIds = new Set(assets.map((a) => a.unitId));
  const enabledSet = new Set(config.enabledUnits);
  const entries: DiffEntry[] = [];

  for (const asset of assets) {
    const relativePath = asset.outputPath;
    const snapshotHash = snapshot?.files[relativePath];
    const newTemplateHash = await computeStaticFileHash(asset.sourcePath);

    if (!enabledSet.has(asset.unitId)) {
      // 情况 B：CLI 有、项目未启用
      entries.push({
        unitId: asset.unitId,
        strategy: 'add',
        files: [relativePath],
        details: `${asset.type === 'agent' ? 'Agent' : 'Skill'} ${asset.unitId} 未启用，可添加`,
      });
      continue;
    }

    if (newTemplateHash === null) {
      entries.push({
        unitId: asset.unitId,
        strategy: 'skip',
        files: [relativePath],
        details: `${relativePath}: 模板源文件不存在，跳过`,
      });
      continue;
    }

    if (!snapshot || !snapshotHash) {
      // 无快照记录 → 保守按冲突处理
      entries.push({
        unitId: asset.unitId,
        strategy: 'update-with-conflict',
        files: [relativePath],
        details: `${relativePath}: 无快照记录，保守标记为冲突更新`,
      });
      continue;
    }

    const userModified = await hasUserModified(projectDir, relativePath, snapshot);

    if (newTemplateHash === snapshotHash) {
      if (!userModified) {
        entries.push({
          unitId: asset.unitId,
          strategy: 'skip',
          files: [relativePath],
          details: `${relativePath}: 模板与快照一致且用户未修改`,
        });
      } else {
        entries.push({
          unitId: asset.unitId,
          strategy: 'update-with-conflict',
          files: [relativePath],
          details: `${relativePath}: 模板未变，用户有本地修改，可能存在冲突`,
        });
      }
      continue;
    }

    // 模板已更新
    entries.push({
      unitId: asset.unitId,
      strategy: userModified ? 'update-with-conflict' : 'update',
      files: [relativePath],
      details: userModified
        ? `${relativePath}: 模板已更新且用户有本地修改，存在冲突`
        : `${relativePath}: 模板已更新，用户未修改，可安全更新`,
    });
  }

  // 情况 C for assets：项目启用了、模板中已不存在 → deprecate
  for (const unitId of config.enabledUnits) {
    if (!isQoderAssetUnitId(unitId)) continue;
    if (assetIds.has(unitId)) continue;
    entries.push({
      unitId,
      strategy: 'deprecate',
      files: [],
      details: `${unitId} 在当前模板中已不存在，可能已被移除或重命名`,
    });
  }

  return entries;
}

/**
 * 计算一个静态文件的 sha256 hash（不做 Mustache 渲染）。
 */
async function computeStaticFileHash(sourcePath: string): Promise<string | null> {
  try {
    const buf = await readFile(sourcePath);
    return createHash('sha256').update(buf).digest('hex');
  } catch {
    return null;
  }
}

// ─── 策略优先级 ─────────────────────────────────────────────

/**
 * 升级策略优先级（从宽松到严格）：
 * skip < add < update < update-with-conflict < deprecate
 *
 * 多文件场景下取最严格的策略作为单元整体策略。
 */
const STRATEGY_PRIORITY: Record<UpgradeStrategy, number> = {
  skip: 0,
  add: 1,
  update: 2,
  'update-with-conflict': 3,
  deprecate: 4,
};

function upgradePriority(a: UpgradeStrategy, b: UpgradeStrategy): UpgradeStrategy {
  return STRATEGY_PRIORITY[a] >= STRATEGY_PRIORITY[b] ? a : b;
}
