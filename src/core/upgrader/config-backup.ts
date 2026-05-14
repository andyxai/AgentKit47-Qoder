import { readdir, mkdir, cp, rm, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * 升级前需要备份的关键配置路径（相对于项目根目录）
 */
const BACKUP_PATHS = [
  '.ak47',
  '.qoder',
  'AGENTS.md',
];

/**
 * 最多保留的备份数量
 */
const MAX_BACKUPS = 2;

/**
 * 备份目录名称（相对于项目根目录）
 */
const BACKUP_DIR_NAME = 'backup';

interface BackupResult {
  /** 本次备份路径 */
  backupPath: string;
  /** 备份的文件/目录数量 */
  itemCount: number;
  /** 清理的旧备份数量 */
  cleanedCount: number;
}

/**
 * 升级前自动备份关键配置
 *
 * 备份内容：.ak47/、.qoder/、AGENTS.md 等
 * 存储位置：项目根目录 backup/ 下
 * 保留策略：仅保留最近 MAX_BACKUPS 次备份
 *
 * @param projectDir - 项目根目录
 * @returns 备份结果
 */
export async function backupProjectConfig(projectDir: string): Promise<BackupResult> {
  const backupRoot = join(projectDir, BACKUP_DIR_NAME);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = join(backupRoot, `pre-upgrade-${timestamp}`);

  await mkdir(backupRoot, { recursive: true });
  await mkdir(backupPath, { recursive: true });

  let itemCount = 0;

  for (const relPath of BACKUP_PATHS) {
    const sourcePath = join(projectDir, relPath);
    if (!existsSync(sourcePath)) {
      continue;
    }

    const destPath = join(backupPath, relPath);
    const stats = await stat(sourcePath);

    if (stats.isDirectory()) {
      await cp(sourcePath, destPath, { recursive: true });
    } else {
      await cp(sourcePath, destPath);
    }
    itemCount++;
  }

  // 清理旧备份
  const cleanedCount = await rotateBackups(backupRoot);

  return { backupPath, itemCount, cleanedCount };
}

/**
 * 旋转备份：仅保留最近的 MAX_BACKUPS 次
 */
async function rotateBackups(backupRoot: string): Promise<number> {
  if (!existsSync(backupRoot)) {
    return 0;
  }

  const entries = await readdir(backupRoot, { withFileTypes: true });
  const backupDirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('pre-upgrade-'))
    .map((e) => e.name)
    .sort() // 按名称排序 = 按时间排序（ISO 格式）
    .reverse(); // 最新的在前

  if (backupDirs.length <= MAX_BACKUPS) {
    return 0;
  }

  const toRemove = backupDirs.slice(MAX_BACKUPS);
  let removed = 0;

  for (const dir of toRemove) {
    await rm(join(backupRoot, dir), { recursive: true, force: true });
    removed++;
  }

  return removed;
}
