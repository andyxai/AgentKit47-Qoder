import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

/**
 * 快照数据结构
 *
 * 存储在 `.ak47/.snapshots.json`，记录 CLI 版本及所有生成文件的 sha256 hash。
 */
export interface SnapshotData {
  /** 快照对应的 CLI 版本 */
  version: string;
  /** 快照创建时间（ISO 8601） */
  createdAt: string;
  /** 相对路径 -> sha256 hash 映射 */
  files: Record<string, string>;
}

const SNAPSHOT_FILENAME = '.snapshots.json';

/**
 * 计算文件内容的 sha256 hash
 *
 * @param filePath - 文件绝对路径
 * @returns 十六进制 sha256 摘要
 */
export async function computeFileHash(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * 保存快照到 `.ak47/.snapshots.json`
 *
 * @param projectDir - 项目根目录
 * @param files - 文件列表（含相对路径和绝对路径）
 * @param version - CLI 版本号
 */
export async function saveSnapshot(
  projectDir: string,
  files: Array<{ relativePath: string; absolutePath: string }>,
  version: string
): Promise<void> {
  const fileHashMap: Record<string, string> = {};

  for (const file of files) {
    try {
      fileHashMap[file.relativePath] = await computeFileHash(file.absolutePath);
    } catch {
      // 文件可能不存在（skip 的文件），跳过
    }
  }

  const snapshotData: SnapshotData = {
    version,
    createdAt: new Date().toISOString(),
    files: fileHashMap,
  };

  const snapshotPath = join(projectDir, '.ak47', SNAPSHOT_FILENAME);
  await mkdir(dirname(snapshotPath), { recursive: true });
  await writeFile(snapshotPath, JSON.stringify(snapshotData, null, 2), 'utf-8');
}

/**
 * 读取快照
 *
 * @param projectDir - 项目根目录
 * @returns 快照数据，文件不存在时返回 null
 */
export async function loadSnapshot(projectDir: string): Promise<SnapshotData | null> {
  const snapshotPath = join(projectDir, '.ak47', SNAPSHOT_FILENAME);
  try {
    const raw = await readFile(snapshotPath, 'utf-8');
    return JSON.parse(raw) as SnapshotData;
  } catch {
    return null;
  }
}

/**
 * 检测用户是否修改了文件
 *
 * 对比当前文件 hash 与快照中的 hash，不一致则视为用户已修改。
 *
 * @param projectDir - 项目根目录
 * @param relativePath - 文件相对路径（相对于项目根目录）
 * @param snapshotData - 快照数据
 * @returns true 表示文件已被用户修改（或快照中无记录）
 */
export async function hasUserModified(
  projectDir: string,
  relativePath: string,
  snapshotData: SnapshotData
): Promise<boolean> {
  const snapshotHash = snapshotData.files[relativePath];
  if (!snapshotHash) {
    // 快照中无该文件记录，视为已修改（保守策略）
    return true;
  }

  const absolutePath = join(projectDir, relativePath);
  try {
    const currentHash = await computeFileHash(absolutePath);
    return currentHash !== snapshotHash;
  } catch {
    // 文件不存在或无法读取，视为已修改
    return true;
  }
}
