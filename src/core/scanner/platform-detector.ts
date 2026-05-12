import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PlatformDetectionResult, DetectedPlatform, PlatformId } from '../../types/project.js';

/**
 * 已知 AI 平台及其特征文件/目录映射
 */
const PLATFORM_SIGNATURES: Array<{
  id: PlatformId;
  files: string[];
  dirs: string[];
}> = [
  {
    id: 'qoder',
    files: [],
    dirs: ['.qoder'],
  },
  {
    id: 'claude-code',
    files: ['CLAUDE.md'],
    dirs: [],
  },
];

/**
 * 检查路径是否存在（文件或目录）
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
 * 检查目录是否存在且非空
 */
async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const entries = await readdir(dirPath);
    return entries.length >= 0; // 目录存在即可，不要求非空
  } catch {
    return false;
  }
}

/**
 * 检测项目中已安装和候选的 AI 平台
 */
export async function detectPlatforms(projectDir: string): Promise<PlatformDetectionResult> {
  const detected: DetectedPlatform[] = [];
  const detectedIds = new Set<PlatformId>();

  for (const platform of PLATFORM_SIGNATURES) {
    const configFiles: string[] = [];

    // 检查特征文件
    for (const file of platform.files) {
      const filePath = join(projectDir, file);
      if (await pathExists(filePath)) {
        configFiles.push(file);
      }
    }

    // 检查特征目录
    for (const dir of platform.dirs) {
      const dirPath = join(projectDir, dir);
      if (await dirExists(dirPath)) {
        configFiles.push(dir);
      }
    }

    if (configFiles.length > 0) {
      detected.push({ id: platform.id, configFiles });
      detectedIds.add(platform.id);
    }
  }

  // 候选平台 = 已知平台中未被检测到的
  const candidates: DetectedPlatform[] = PLATFORM_SIGNATURES.filter(
    (p) => !detectedIds.has(p.id)
  ).map((p) => ({ id: p.id, configFiles: [] }));

  return {
    detected,
    candidates,
  };
}
