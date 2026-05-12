/**
 * 自动修复器
 *
 * 检测缺失工具并提供自动安装能力，支持 openspec 等外部依赖。
 * 支持版本锁定和多种安装来源（npm/Git）。
 */

import { execute } from './command-executor.js';

interface ToolConfig {
  npmPackage: string;
  gitUrl?: string;
  recommendedVersion?: string;
  description: string;
}

const TOOL_CONFIG: Record<string, ToolConfig> = {
  openspec: {
    npmPackage: '@fission-ai/openspec',
    gitUrl: 'git+ssh://git@github.com:Fission-AI/OpenSpec.git',
    recommendedVersion: '1.3.1',
    description: 'OpenSpec - Spec-Driven Development 框架',
  },
};

/**
 * 获取指定工具的安装命令
 *
 * @param toolName - 工具名称
 * @param useGit - 是否使用 Git 安装（默认 false，使用 npm）
 * @returns 安装命令字符串；未知工具返回 null
 */
export function getInstallCommand(toolName: string, useGit: boolean = false): string | null {
  const config = TOOL_CONFIG[toolName];
  if (!config) {
    return null;
  }

  if (useGit && config.gitUrl) {
    const version = config.recommendedVersion || 'main';
    return `npm install -g ${config.gitUrl}#${version}`;
  }

  const version = config.recommendedVersion ? `@${config.recommendedVersion}` : '';
  return `npm install -g ${config.npmPackage}${version}`;
}

/**
 * 尝试自动安装指定工具
 *
 * @param toolName - 工具名称
 * @param useGit - 是否使用 Git 安装（默认 false）
 * @returns 安装成功返回 true，失败返回 false 并提示用户手动安装
 */
export async function tryInstall(toolName: string, useGit: boolean = false): Promise<boolean> {
  const config = TOOL_CONFIG[toolName];
  if (!config) {
    console.log(`[ak47] 未知工具 "${toolName}"，无法自动安装，请手动安装。`);
    return false;
  }

  const installCommand = getInstallCommand(toolName, useGit);
  if (!installCommand) {
    console.log(`[ak47] 无法生成 ${toolName} 的安装命令。`);
    return false;
  }

  console.log(`[ak47] 正在安装 ${config.description}...`);
  console.log(`[ak47] 安装命令: ${installCommand}`);

  // 解析命令并执行
  const parts = installCommand.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);

  const result = await execute(cmd, args);

  if (result.success) {
    console.log(`[ak47] ${toolName} 安装成功！`);
    return true;
  }

  console.log(`[ak47] 自动安装 ${toolName} 失败。`);
  console.log(`[ak47] 请手动执行以下命令：`);
  console.log(`        ${installCommand}`);
  
  // 提供备选方案
  if (!useGit && config.gitUrl) {
    console.log(`[ak47] 或者使用 Git 安装：`);
    console.log(`        ${getInstallCommand(toolName, true)}`);
  }
  
  return false;
}
