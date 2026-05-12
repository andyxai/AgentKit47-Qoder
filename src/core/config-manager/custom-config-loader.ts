/**
 * 自定义配置加载和保存
 *
 * 管理 .ak47/custom-configs.yaml 文件的读写
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { CustomConfigs, CustomConfigMetadata } from './types.js';
import { getAk47Dir } from '../../utils/paths.js';

const CUSTOM_CONFIG_FILENAME = 'custom-configs.yaml';

/**
 * 获取自定义配置文件路径
 */
function getCustomConfigPath(projectDir: string): string {
  const ak47Dir = getAk47Dir(projectDir);
  return join(ak47Dir, CUSTOM_CONFIG_FILENAME);
}

/**
 * 创建默认元数据
 */
function createDefaultMetadata(
  createdBy?: string,
  description?: string
): CustomConfigMetadata {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    created_at: now,
    updated_at: now,
    created_by: createdBy,
    description: description || 'AK47 自定义配置',
  };
}

/**
 * 创建空的自定义配置
 */
function createEmptyCustomConfigs(
  createdBy?: string,
  description?: string
): CustomConfigs {
  return {
    metadata: createDefaultMetadata(createdBy, description),
    validation: {
      enabled: false,
      types: [],
    },
    custom_agents: [],
    custom_skills: [],
  };
}

/**
 * 加载自定义配置
 *
 * @param projectDir - 项目目录
 * @returns 自定义配置对象，如果不存在则返回 null
 */
export async function loadCustomConfigs(
  projectDir: string
): Promise<CustomConfigs | null> {
  const configPath = getCustomConfigPath(projectDir);

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const parsed = parse(content) as CustomConfigs;

    // 验证基本结构
    if (!parsed.metadata) {
      console.warn('⚠️  自定义配置文件缺少 metadata，将自动修复');
      parsed.metadata = createDefaultMetadata();
    }

    // 确保数组字段存在
    if (!parsed.validation) {
      parsed.validation = { enabled: false, types: [] };
    }
    if (!parsed.validation.types) {
      parsed.validation.types = [];
    }
    if (!parsed.custom_agents) {
      parsed.custom_agents = [];
    }
    if (!parsed.custom_skills) {
      parsed.custom_skills = [];
    }

    return parsed;
  } catch (error) {
    console.error(`❌ 加载自定义配置失败: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * 保存自定义配置
 *
 * @param projectDir - 项目目录
 * @param configs - 自定义配置对象
 */
export async function saveCustomConfigs(
  projectDir: string,
  configs: CustomConfigs
): Promise<void> {
  const configPath = getCustomConfigPath(projectDir);
  const ak47Dir = getAk47Dir(projectDir);

  // 确保目录存在
  if (!existsSync(ak47Dir)) {
    await mkdir(ak47Dir, { recursive: true });
  }

  // 更新元数据
  configs.metadata.updated_at = new Date().toISOString();

  // 序列化为 YAML
  const content = stringify(configs);

  // 添加文件头注释
  const header = [
    '# ⚠️  AK47 自定义配置文件',
    '# 由 ak47-config-manager 管理，请勿手动编辑',
    '# 使用 `ak47 config-manager` 命令进行修改',
    '',
  ].join('\n');

  await writeFile(configPath, header + content, 'utf-8');
}

/**
 * 初始化自定义配置（如果不存在）
 *
 * @param projectDir - 项目目录
 * @param createdBy - 创建者
 * @param description - 描述
 * @returns 是否创建了新配置
 */
export async function initCustomConfigs(
  projectDir: string,
  createdBy?: string,
  description?: string
): Promise<boolean> {
  const configPath = getCustomConfigPath(projectDir);

  if (existsSync(configPath)) {
    return false;
  }

  const configs = createEmptyCustomConfigs(createdBy, description);
  await saveCustomConfigs(projectDir, configs);
  return true;
}

/**
 * 检查自定义配置是否存在
 */
export async function hasCustomConfigs(projectDir: string): Promise<boolean> {
  const configPath = getCustomConfigPath(projectDir);
  return existsSync(configPath);
}
