import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { existsSync } from 'node:fs';
import { getUnitRegistry } from '../recommender/unit-registry.js';

/**
 * 用户自定义文件信息
 */
export interface CustomFileInfo {
  /** 文件相对路径 (相对于项目根目录) */
  relativePath: string;
  /** 文件绝对路径 */
  absolutePath: string;
  /** 文件类型 */
  fileType: 'agent' | 'skill' | 'rule' | 'experience' | 'config' | 'other';
  /** 是否可能受升级影响 */
  possiblyAffected: boolean;
  /** 影响原因 */
  affectedReason?: string;
}

/**
 * 扫描项目中的自定义文件
 *
 * 识别逻辑:
 * 1. 遍历 .ak47/ 目录下所有 .md 和 .yaml/.yml 文件
 * 2. 排除快照中记录的文件 (这些是 ak47 生成的)
 * 3. 排除配置文件 (config.yaml, .snapshots.json)
 * 4. 剩余文件视为用户自定义
 *
 * @param projectDir - 项目根目录
 * @param snapshotFiles - 快照中的文件列表 (可选)
 * @returns 自定义文件列表
 */
export async function scanCustomFiles(
  projectDir: string,
  snapshotFiles?: string[]
): Promise<CustomFileInfo[]> {
  const ak47Dir = join(projectDir, '.ak47');
  
  if (!existsSync(ak47Dir)) {
    return [];
  }

  const customFiles: CustomFileInfo[] = [];
  const snapshotSet = new Set(snapshotFiles || []);

  // 递归扫描 .ak47/ 目录
  await scanDirectory(ak47Dir, projectDir, snapshotSet, customFiles);

  // 分析每个文件是否可能受升级影响
  await analyzeAffectedStatus(customFiles);

  return customFiles;
}

/**
 * 递归扫描目录
 */
async function scanDirectory(
  dirPath: string,
  projectDir: string,
  snapshotSet: Set<string>,
  customFiles: CustomFileInfo[]
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const relPath = relative(projectDir, fullPath);

    // 跳过配置文件
    if (entry.name === 'config.yaml' || entry.name === '.snapshots.json') {
      continue;
    }

    // 跳过 backups 目录 (我们自己的备份)
    if (entry.name === 'backups') {
      continue;
    }

    if (entry.isDirectory()) {
      // 递归扫描子目录
      await scanDirectory(fullPath, projectDir, snapshotSet, customFiles);
    } else if (entry.isFile()) {
      // 检查是否是目标文件类型
      if (isTargetFileType(entry.name)) {
        // 如果不在快照中,视为自定义文件
        if (!snapshotSet.has(relPath)) {
          const fileType = classifyFileType(relPath);
          customFiles.push({
            relativePath: relPath,
            absolutePath: fullPath,
            fileType,
            possiblyAffected: false,
          });
        }
      }
    }
  }
}

/**
 * 判断是否为目标文件类型
 */
function isTargetFileType(fileName: string): boolean {
  const ext = fileName.toLowerCase();
  return ext.endsWith('.md') || ext.endsWith('.yaml') || ext.endsWith('.yml');
}

/**
 * 分类文件类型
 */
function classifyFileType(filePath: string): CustomFileInfo['fileType'] {
  if (filePath.includes('/agents/') || filePath.includes('\\agents\\')) {
    return 'agent';
  }
  if (filePath.includes('/skills/') || filePath.includes('\\skills\\')) {
    return 'skill';
  }
  if (filePath.includes('/rules/') || filePath.includes('\\rules\\')) {
    return 'rule';
  }
  if (filePath.includes('/experiences/') || filePath.includes('\\experiences\\')) {
    return 'experience';
  }
  if (filePath.includes('config')) {
    return 'config';
  }
  return 'other';
}

/**
 * 分析文件是否可能受升级影响
 */
async function analyzeAffectedStatus(files: CustomFileInfo[]): Promise<void> {
  const registry = getUnitRegistry();
  const registeredUnitIds = Array.from(registry.keys());

  for (const file of files) {
    // 检查文件名是否与已知单元相似
    const fileName = file.relativePath.split('/').pop()?.replace(/\.(md|yaml|yml)$/, '') || '';
    
    for (const unitId of registeredUnitIds) {
      // 如果文件名包含单元 ID 的关键词,可能受影响
      const unitKeywords = unitId.replace(/ak47-|skill-|agent-|rule-/g, '').split('-');
      const hasOverlap = unitKeywords.some(keyword => 
        fileName.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasOverlap) {
        file.possiblyAffected = true;
        file.affectedReason = `文件名与已知能力单元 "${unitId}" 相似,可能需要适配新版本`;
        break;
      }
    }
  }
}

/**
 * 备份自定义文件
 *
 * @param projectDir - 项目根目录
 * @param customFiles - 自定义文件列表
 * @returns 备份目录路径
 */
export async function backupCustomFiles(
  projectDir: string,
  customFiles: CustomFileInfo[]
): Promise<string> {
  if (customFiles.length === 0) {
    return '';
  }

  const { mkdir, cp } = await import('node:fs/promises');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(projectDir, '.ak47', 'backups', `pre-upgrade-${timestamp}`);

  await mkdir(backupDir, { recursive: true });

  for (const file of customFiles) {
    const relativeFromProject = relative(projectDir, file.absolutePath);
    const backupPath = join(backupDir, relativeFromProject);
    const { dirname } = await import('node:path');
    const { mkdir: mkdirDir } = await import('node:fs/promises');
    
    await mkdirDir(dirname(backupPath), { recursive: true });
    await cp(file.absolutePath, backupPath);
  }

  return backupDir;
}
