import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { loadConfig, saveConfig } from '../../utils/config.js';
import { backupConfig } from '../../core/config-manager/index.js';
import { computeUpgradeDiff } from './diff-engine.js';
import type { DiffEntry } from './diff-engine.js';
import { saveSnapshot } from './snapshot-manager.js';
import { validateProject } from '../validator/index.js';
import { loadTemplate, renderTemplate } from '../generator/template-engine.js';
import { ensureDir } from '../../utils/paths.js';
import { scanQoderAssets, isQoderAssetUnitId } from './qoder-asset-scanner.js';
import type { QoderAsset } from './qoder-asset-scanner.js';

export interface UpgradeOptions {
  dryRun?: boolean;
  yes?: boolean;
  only?: string[];
}

export interface UpgradeResult {
  success: boolean;
  entries: DiffEntry[];
  backupPath: string;
}

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

function getTemplateDir(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  const packageRoot = findPackageRoot(currentFilePath);
  return join(packageRoot, 'templates');
}

async function getCliVersion(): Promise<string> {
  try {
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

export async function executeUpgrade(
  projectDir: string,
  options: UpgradeOptions
): Promise<UpgradeResult> {
  // 1. loadConfig 验证项目已初始化
  const config = await loadConfig(projectDir);
  if (!config) {
    throw new Error('项目未初始化，请先运行 ak47 init');
  }

  // 3. 读取 CLI 版本
  const cliVersion = await getCliVersion();

  // 4. 确定 templateDir
  const templateDir = getTemplateDir();

  // 5. computeUpgradeDiff 计算差异
  let entries = await computeUpgradeDiff(config, projectDir, templateDir);

  // 6. 如果有 --only 选项，过滤 entries
  if (options.only && options.only.length > 0) {
    const onlySet = new Set(options.only);
    entries = entries.filter((entry) => onlySet.has(entry.unitId));
  }

  // 7. 如果 dryRun，直接返回结果（不执行）
  if (options.dryRun) {
    return { success: true, entries, backupPath: '' };
  }

  // 2. backupConfig 自动备份（仅在非 dryRun 时执行）
  const backupPath = await backupConfig(projectDir);

  // 8. 按策略执行每个 entry
  const writtenFiles: Array<{ relativePath: string; absolutePath: string }> = [];
  const context = {
    projectName: config.projectName,
    timestamp: new Date().toISOString(),
  };

  // 预先扫描 Qoder 静态资产，建立 unitId → asset 索引
  const qoderAssets = await scanQoderAssets(templateDir);
  const assetByUnitId = new Map<string, QoderAsset>();
  for (const asset of qoderAssets) {
    assetByUnitId.set(asset.unitId, asset);
  }

  for (const entry of entries) {
    if (entry.strategy === 'skip') {
      continue;
    }

    if (entry.strategy === 'deprecate') {
      config.enabledUnits = config.enabledUnits.filter((id) => id !== entry.unitId);
      continue;
    }

    for (const relativePath of entry.files) {
      // 静态资产（Agent/Skill）：按字节拷贝，不走 Mustache 渲染
      if (isQoderAssetUnitId(entry.unitId)) {
        const asset = assetByUnitId.get(entry.unitId);
        if (!asset) {
          continue;
        }
        const rawContent = await readFile(asset.sourcePath);
        const targetRelative =
          entry.strategy === 'update-with-conflict' ? `${relativePath}.new` : relativePath;
        const absolutePath = join(projectDir, targetRelative);
        await ensureDir(dirname(absolutePath));
        await writeFile(absolutePath, rawContent);
        writtenFiles.push({ relativePath: targetRelative, absolutePath });
        continue;
      }

      const templatePath = join(templateDir, 'units', entry.unitId, '_base.md');
      const templateContent = await loadTemplate(templatePath);

      if (!templateContent) {
        continue;
      }

      const rendered = renderTemplate(templateContent, context);

      if (entry.strategy === 'update-with-conflict') {
        const conflictPath = `${relativePath}.new`;
        const absolutePath = join(projectDir, conflictPath);
        await ensureDir(dirname(absolutePath));
        await writeFile(absolutePath, rendered, 'utf-8');
        writtenFiles.push({ relativePath: conflictPath, absolutePath });
      } else {
        const absolutePath = join(projectDir, relativePath);
        await ensureDir(dirname(absolutePath));
        await writeFile(absolutePath, rendered, 'utf-8');
        writtenFiles.push({ relativePath, absolutePath });
      }
    }

    // add 策略还需要将单元加入 enabledUnits
    if (entry.strategy === 'add' && !config.enabledUnits.includes(entry.unitId)) {
      config.enabledUnits.push(entry.unitId);
    }
  }

  // 9. 更新 config
  config.version = cliVersion;
  config.ak47Version = cliVersion;
  config.updatedAt = new Date().toISOString();
  await saveConfig(config, projectDir);

  // 10. 保存新快照
  if (writtenFiles.length > 0) {
    await saveSnapshot(projectDir, writtenFiles, cliVersion);
  }

  // 11. validateProject 验证一致性
  const validationResult = await validateProject(projectDir);

  return {
    success: validationResult.passed,
    entries,
    backupPath,
  };
}
