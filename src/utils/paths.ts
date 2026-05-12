/**
 * 路径工具函数
 *
 * 提供项目根目录发现、ak47 目录路径计算及目录创建等基础能力。
 */

import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';

const AK47_DIR = '.ak47';

/**
 * 向上查找包含 package.json 或 .git 的目录作为项目根目录
 *
 * @param startDir - 起始搜索目录，默认为当前工作目录
 * @returns 项目根目录的绝对路径
 * @throws 若未找到项目根目录则抛出错误
 */
export function getProjectRoot(startDir: string = process.cwd()): string {
  let current = resolve(startDir);

  while (true) {
    if (existsSync(join(current, 'package.json')) || existsSync(join(current, '.git'))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`无法找到项目根目录（从 ${startDir} 向上查找至文件系统根）`);
    }
    current = parent;
  }
}

/**
 * 返回 .ak47/ 目录的绝对路径
 *
 * @param projectRoot - 项目根目录，默认自动查找
 * @returns .ak47/ 目录的绝对路径
 */
export function getAk47Dir(projectRoot?: string): string {
  const root = projectRoot ? resolve(projectRoot) : getProjectRoot();
  return join(root, AK47_DIR);
}

/**
 * 返回 .ak47/config.yaml 路径
 *
 * @param projectRoot - 项目根目录，默认自动查找
 * @returns config.yaml 的绝对路径
 */
export function getConfigPath(projectRoot?: string): string {
  return join(getAk47Dir(projectRoot), 'config.yaml');
}

/**
 * 返回 .ak47/progress.yaml 路径
 *
 * @param projectRoot - 项目根目录，默认自动查找
 * @returns progress.yaml 的绝对路径
 */
export function getProgressPath(projectRoot?: string): string {
  return join(getAk47Dir(projectRoot), 'progress.yaml');
}

/**
 * 确保目录存在，不存在则递归创建
 *
 * @param dirPath - 目标目录路径
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}
