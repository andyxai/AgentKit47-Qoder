/**
 * 配置管理器
 *
 * 提供分类化的配置读写、重置与备份能力。
 */

import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, saveConfig } from '../../utils/config.js';
import { getConfigPath, getAk47Dir } from '../../utils/paths.js';
import type { Ak47Config, PlatformConfig } from '../../types/config.js';

const VALID_CATEGORIES = ['agent', 'flow', 'platform', 'general'] as const;
type ConfigCategory = (typeof VALID_CATEGORIES)[number];

const VALID_AGENTS = [
  'developer',
  'reviewer',
  'architect',
  'po',
  'scaffold-maintainer',
  'process-guardian',
  'knowledge-engineer',
  'config-maintainer',
] as const;

const GENERAL_KEYS = ['projectName', 'paradigm', 'version'] as const;

/**
 * 获取默认配置
 *
 * @param projectName - 项目名称
 * @returns 默认 Ak47Config 对象
 */
export function getDefaultConfig(projectName?: string): Ak47Config {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    projectName: projectName ?? 'untitled',
    platforms: [],
    enabledUnits: [],
    paradigm: 'L1',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 读取配置项
 *
 * @param projectDir - 项目目录
 * @param category - 配置分类
 * @param key - 配置键
 * @returns 配置值
 */
export async function configGet(
  projectDir: string,
  category: ConfigCategory,
  key: string
): Promise<unknown> {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`非法分类: ${category}，有效值为: ${VALID_CATEGORIES.join(', ')}`);
  }

  const config = await loadConfig(projectDir);
  if (!config) {
    throw new Error(`未找到配置文件，项目: ${projectDir}`);
  }

  switch (category) {
    case 'agent': {
      if (!VALID_AGENTS.includes(key as (typeof VALID_AGENTS)[number])) {
        throw new Error(`非法 Agent 角色: ${key}，有效值为: ${VALID_AGENTS.join(', ')}`);
      }
      return config.agentOverrides?.[key] ?? null;
    }
    case 'flow': {
      return config.flowParams?.[key] ?? null;
    }
    case 'platform': {
      const platform = config.platforms.find((p) => p.id === key);
      return platform ?? null;
    }
    case 'general': {
      if (!GENERAL_KEYS.includes(key as (typeof GENERAL_KEYS)[number])) {
        throw new Error(`非法通用配置项: ${key}，有效值为: ${GENERAL_KEYS.join(', ')}`);
      }
      return (config as Record<string, unknown>)[key];
    }
  }
}

/**
 * 解析流程参数值为合适类型
 */
function parseFlowValue(value: string): unknown {
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * 设置配置项
 *
 * @param projectDir - 项目目录
 * @param category - 配置分类
 * @param key - 配置键
 * @param value - 配置值（字符串形式）
 * @returns 新旧值
 */
export async function configSet(
  projectDir: string,
  category: ConfigCategory,
  key: string,
  value: string
): Promise<{ oldValue: unknown; newValue: unknown }> {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`非法分类: ${category}，有效值为: ${VALID_CATEGORIES.join(', ')}`);
  }

  const config = await loadConfig(projectDir);
  if (!config) {
    throw new Error(`未找到配置文件，项目: ${projectDir}`);
  }

  let oldValue: unknown;
  let newValue: unknown;

  switch (category) {
    case 'agent': {
      if (!VALID_AGENTS.includes(key as (typeof VALID_AGENTS)[number])) {
        throw new Error(`非法 Agent 角色: ${key}，有效值为: ${VALID_AGENTS.join(', ')}`);
      }
      oldValue = config.agentOverrides?.[key] ?? null;
      if (!config.agentOverrides) {
        config.agentOverrides = {};
      }
      config.agentOverrides[key] = value;
      newValue = value;
      break;
    }
    case 'flow': {
      oldValue = config.flowParams?.[key] ?? null;
      if (!config.flowParams) {
        config.flowParams = {};
      }
      const parsed = parseFlowValue(value);
      config.flowParams[key] = parsed;
      newValue = parsed;
      break;
    }
    case 'platform': {
      const platformIndex = config.platforms.findIndex((p) => p.id === key);
      oldValue = platformIndex >= 0 ? config.platforms[platformIndex] : null;
      const boolValue = value.toLowerCase() === 'true';
      if (platformIndex >= 0) {
        config.platforms[platformIndex].enabled = boolValue;
        newValue = config.platforms[platformIndex];
      } else {
        const newPlatform: PlatformConfig = {
          id: key as PlatformConfig['id'],
          enabled: boolValue,
          configDir: '.',
        };
        config.platforms.push(newPlatform);
        newValue = newPlatform;
      }
      break;
    }
    case 'general': {
      if (!GENERAL_KEYS.includes(key as (typeof GENERAL_KEYS)[number])) {
        throw new Error(`非法通用配置项: ${key}，有效值为: ${GENERAL_KEYS.join(', ')}`);
      }
      oldValue = (config as Record<string, unknown>)[key];
      if (key === 'paradigm') {
        if (!['L1', 'L2', 'L3'].includes(value)) {
          throw new Error(`非法范式值: ${value}，有效值为: L1, L2, L3`);
        }
      }
      (config as Record<string, unknown>)[key] = value;
      newValue = value;
      break;
    }
  }

  config.updatedAt = new Date().toISOString();
  await saveConfig(config, projectDir);

  return { oldValue, newValue };
}

/**
 * 列出配置
 *
 * @param projectDir - 项目目录
 * @param category - 可选，指定分类
 * @returns 按分类分组的配置
 */
export async function configList(
  projectDir: string,
  category?: ConfigCategory
): Promise<Record<string, Record<string, unknown>>> {
  const config = await loadConfig(projectDir);
  if (!config) {
    throw new Error(`未找到配置文件，项目: ${projectDir}`);
  }

  const result: Record<string, Record<string, unknown>> = {};
  const categories = category ? [category] : ([...VALID_CATEGORIES] as ConfigCategory[]);

  for (const cat of categories) {
    switch (cat) {
      case 'agent': {
        result[cat] = { ...(config.agentOverrides ?? {}) };
        break;
      }
      case 'flow': {
        result[cat] = { ...(config.flowParams ?? {}) };
        break;
      }
      case 'platform': {
        result[cat] = {};
        for (const p of config.platforms) {
          result[cat][p.id] = p;
        }
        break;
      }
      case 'general': {
        result[cat] = {
          projectName: config.projectName,
          paradigm: config.paradigm,
          version: config.version,
        };
        break;
      }
    }
  }

  return result;
}

/**
 * 重置配置为默认值
 *
 * @param projectDir - 项目目录
 * @param category - 可选，指定分类
 * @param key - 可选，指定键
 */
export async function configReset(
  projectDir: string,
  category?: ConfigCategory,
  key?: string
): Promise<void> {
  const config = await loadConfig(projectDir);
  if (!config) {
    throw new Error(`未找到配置文件，项目: ${projectDir}`);
  }

  const defaultConfig = getDefaultConfig(config.projectName);
  const now = new Date().toISOString();

  if (!category) {
    // 整体重置，保留 projectName 和 createdAt
    const preserved = {
      projectName: config.projectName,
      createdAt: config.createdAt,
    };
    Object.assign(config, defaultConfig, preserved, { updatedAt: now });
  } else if (!key) {
    switch (category) {
      case 'agent': {
        delete (config as Record<string, unknown>).agentOverrides;
        break;
      }
      case 'flow': {
        delete (config as Record<string, unknown>).flowParams;
        break;
      }
      case 'platform': {
        config.platforms = defaultConfig.platforms;
        break;
      }
      case 'general': {
        config.paradigm = defaultConfig.paradigm;
        config.version = defaultConfig.version;
        break;
      }
    }
    config.updatedAt = now;
  } else {
    switch (category) {
      case 'agent': {
        if (config.agentOverrides && key in config.agentOverrides) {
          delete config.agentOverrides[key];
        }
        break;
      }
      case 'flow': {
        if (config.flowParams && key in config.flowParams) {
          delete config.flowParams[key];
        }
        break;
      }
      case 'platform': {
        config.platforms = config.platforms.filter((p) => p.id !== key);
        break;
      }
      case 'general': {
        const defaultValue = (defaultConfig as Record<string, unknown>)[key];
        if (defaultValue !== undefined) {
          (config as Record<string, unknown>)[key] = defaultValue;
        }
        break;
      }
    }
    config.updatedAt = now;
  }

  await saveConfig(config, projectDir);
}

/**
 * 备份配置
 *
 * @param projectDir - 项目目录
 * @returns 备份文件路径
 */
export async function backupConfig(projectDir: string): Promise<string> {
  const configPath = getConfigPath(projectDir);
  if (!existsSync(configPath)) {
    throw new Error(`未找到配置文件: ${configPath}`);
  }

  const backupDir = join(getAk47Dir(projectDir), '.backup');
  await mkdir(backupDir, { recursive: true });

  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  const backupPath = join(backupDir, `config.yaml.${timestamp}`);
  await copyFile(configPath, backupPath);
  return backupPath;
}
