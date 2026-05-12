/**
 * 配置读写工具
 *
 * 提供 `.ak47/config.yaml` 的读取、写入、验证及深度合并能力。
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import { type Ak47Config, Ak47ConfigSchema } from '../types/index.js';
import { getConfigPath, getAk47Dir, ensureDir } from './paths.js';

/**
 * 读取 `.ak47/config.yaml` 并用 Zod 验证，不存在返回 null
 *
 * @param projectRoot - 项目根目录，默认自动查找
 * @returns 验证通过的配置对象；文件不存在或验证失败时返回 null
 */
export async function loadConfig(projectRoot?: string): Promise<Ak47Config | null> {
  const configPath = getConfigPath(projectRoot);

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = parse(raw);
    const result = Ak47ConfigSchema.safeParse(parsed);

    if (!result.success) {
      console.warn(`[ak47] config.yaml 验证失败：${result.error.message}`);
      return null;
    }

    return result.data;
  } catch (err) {
    console.warn(
      `[ak47] 读取 config.yaml 失败：${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

/**
 * 写入 config.yaml（自动创建 `.ak47/` 目录）
 *
 * @param config - 要写入的配置对象
 * @param projectRoot - 项目根目录，默认自动查找
 */
export async function saveConfig(config: Ak47Config, projectRoot?: string): Promise<void> {
  const configPath = getConfigPath(projectRoot);
  await ensureDir(getAk47Dir(projectRoot));

  const raw = stringify(config, {
    sortMapEntries: true,
  });

  await writeFile(configPath, raw, 'utf-8');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMergeRecord(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(patch)) {
    const patchValue = patch[key];
    const baseValue = result[key];
    if (isPlainObject(patchValue) && isPlainObject(baseValue)) {
      result[key] = deepMergeRecord(baseValue, patchValue);
    } else {
      result[key] = patchValue;
    }
  }
  return result;
}

/**
 * 深度合并配置（partial 覆盖到 base 上）
 *
 * 数组属性采取替换策略（而非合并），对象属性（包括 Record 类型）递归合并。
 *
 * @param base - 基础配置
 * @param partial - 用于覆盖的部分配置
 * @returns 合并后的新配置对象
 */
export function mergeConfig(base: Ak47Config, partial: Partial<Ak47Config>): Ak47Config {
  const merged = { ...base } as Record<string, unknown>;
  const patch = partial as Record<string, unknown>;

  for (const key of Object.keys(patch)) {
    const patchValue = patch[key];

    if (patchValue === undefined) {
      continue;
    }

    if (Array.isArray(patchValue)) {
      merged[key] = patchValue;
    } else if (isPlainObject(patchValue) && !Array.isArray(base[key as keyof Ak47Config])) {
      const baseValue = (base[key as keyof Ak47Config] as unknown as Record<string, unknown>) ?? {};
      merged[key] = deepMergeRecord(baseValue, patchValue);
    } else {
      merged[key] = patchValue;
    }
  }

  return merged as Ak47Config;
}
