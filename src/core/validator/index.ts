/**
 * 项目验证引擎
 *
 * 对 ak47 项目配置进行 L1（必需）和 L2（增强）两级验证，
 * 返回结构化结果供 CLI 格式化展示。
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import fg from 'fast-glob';
import { Ak47ConfigSchema } from '../../types/index.js';
import { getAk47Dir, getConfigPath } from '../../utils/paths.js';
import { checkCommand } from '../orchestrator/command-executor.js';

export interface ValidationCheck {
  name: string;
  level: 'L1' | 'L2';
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
  warnings: string[];
  errors: string[];
}

export async function validateProject(projectDir: string): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const ak47Dir = getAk47Dir(projectDir);
  const configPath = getConfigPath(projectDir);

  // --- L1: 文件存在性检查 ---

  const dirExists = existsSync(ak47Dir);
  checks.push({
    name: '.ak47/ 目录存在',
    level: 'L1',
    passed: dirExists,
    message: dirExists ? '目录存在' : '未找到 .ak47/ 目录',
  });
  if (!dirExists) errors.push('.ak47/ 目录不存在');

  const configExists = existsSync(configPath);
  checks.push({
    name: 'config.yaml 存在',
    level: 'L1',
    passed: configExists,
    message: configExists ? '配置文件存在' : '未找到 config.yaml',
  });
  if (!configExists) errors.push('config.yaml 不存在');

  const agentFiles = dirExists
    ? await fg('*.md', { cwd: join(ak47Dir, 'agents'), onlyFiles: true })
    : [];
  const hasAgents = agentFiles.length > 0;
  checks.push({
    name: 'agents/ 包含 Agent 定义',
    level: 'L1',
    passed: hasAgents,
    message: hasAgents ? `找到 ${agentFiles.length} 个` : '无 .md 文件',
  });
  if (!hasAgents) errors.push('agents/ 目录缺少 Agent 定义文件');

  const skillsDir = join(ak47Dir, 'skills');
  const skillsDirExists = existsSync(skillsDir);
  const skillFiles = skillsDirExists ? await fg('*.md', { cwd: skillsDir, onlyFiles: true }) : [];
  if (skillsDirExists) {
    const hasSkills = skillFiles.length > 0;
    checks.push({
      name: 'skills/ 包含 Skill 定义',
      level: 'L1',
      passed: hasSkills,
      message: hasSkills ? `找到 ${skillFiles.length} 个` : '目录存在但无 .md 文件',
    });
    if (!hasSkills) errors.push('skills/ 目录存在但缺少 Skill 定义文件');
  } else {
    checks.push({
      name: 'skills/ 包含 Skill 定义',
      level: 'L1',
      passed: true,
      message: 'skills/ 目录不存在（可选）',
    });
  }

  // --- L1: 配置完整性检查 ---

  let parsed: unknown = null;
  let yamlError: string | null = null;

  if (configExists) {
    try {
      const raw = await readFile(configPath, 'utf-8');
      parsed = parse(raw);
      checks.push({
        name: 'config.yaml YAML 语法正确',
        level: 'L1',
        passed: true,
        message: 'YAML 解析成功',
      });
    } catch (err) {
      yamlError = err instanceof Error ? err.message : String(err);
      checks.push({
        name: 'config.yaml YAML 语法正确',
        level: 'L1',
        passed: false,
        message: `解析失败: ${yamlError}`,
      });
      errors.push(`config.yaml YAML 语法错误: ${yamlError}`);
    }
  } else {
    checks.push({
      name: 'config.yaml YAML 语法正确',
      level: 'L1',
      passed: false,
      message: '文件不存在，跳过',
    });
  }

  if (parsed !== null) {
    const zodResult = Ak47ConfigSchema.safeParse(parsed);
    checks.push({
      name: 'config.yaml 通过 Zod 验证',
      level: 'L1',
      passed: zodResult.success,
      message: zodResult.success ? '结构验证通过' : `验证失败: ${zodResult.error.message}`,
    });
    if (!zodResult.success) errors.push(`config.yaml 配置验证失败: ${zodResult.error.message}`);
  } else {
    checks.push({
      name: 'config.yaml 通过 Zod 验证',
      level: 'L1',
      passed: false,
      message: yamlError ? 'YAML 解析失败，跳过' : '文件不存在，跳过',
    });
  }

  // --- L2: 模板一致性检查 ---

  const zodResult = parsed !== null ? Ak47ConfigSchema.safeParse(parsed) : null;
  const config = zodResult?.success ? zodResult.data : null;

  if (config && config.enabledUnits.length > 0) {
    const agentUnits = config.enabledUnits.filter((u) => u.includes('agent'));
    const skillUnits = config.enabledUnits.filter((u) => u.includes('skill'));

    const agentMatch = agentUnits.length <= agentFiles.length;
    checks.push({
      name: 'enabledUnits Agent 有对应文件',
      level: 'L2',
      passed: agentMatch,
      message: `${agentUnits.length} 个单元 / ${agentFiles.length} 个文件`,
    });
    if (!agentMatch) warnings.push('enabledUnits 中 Agent 单元与文件数量不匹配');

    if (skillsDirExists) {
      const skillMatch = skillUnits.length <= skillFiles.length;
      checks.push({
        name: 'enabledUnits Skill 有对应文件',
        level: 'L2',
        passed: skillMatch,
        message: `${skillUnits.length} 个单元 / ${skillFiles.length} 个文件`,
      });
      if (!skillMatch) warnings.push('enabledUnits 中 Skill 单元与文件数量不匹配');
    } else if (skillUnits.length > 0) {
      checks.push({
        name: 'enabledUnits Skill 有对应文件',
        level: 'L2',
        passed: false,
        message: `${skillUnits.length} 个单元但 skills/ 目录不存在`,
      });
      warnings.push('enabledUnits 中 Skill 单元缺少 skills/ 目录');
    } else {
      checks.push({
        name: 'enabledUnits Skill 有对应文件',
        level: 'L2',
        passed: true,
        message: '无 Skill 单元，跳过',
      });
    }

    const reverseAgent = agentFiles.length <= agentUnits.length;
    checks.push({
      name: 'agents/ 文件都有对应注册单元',
      level: 'L2',
      passed: reverseAgent,
      message: `${agentFiles.length} 个文件 / ${agentUnits.length} 个单元`,
    });
    if (!reverseAgent) warnings.push('agents/ 下存在未注册的 Agent 文件');
  } else {
    const skipMsg = config ? '无 enabledUnits，跳过' : '配置未解析，跳过';
    checks.push({
      name: 'enabledUnits Agent 有对应文件',
      level: 'L2',
      passed: true,
      message: skipMsg,
    });
    checks.push({
      name: 'enabledUnits Skill 有对应文件',
      level: 'L2',
      passed: true,
      message: skipMsg,
    });
    checks.push({
      name: 'agents/ 文件都有对应注册单元',
      level: 'L2',
      passed: true,
      message: skipMsg,
    });
  }

  // --- L2: 工具可用性检查 ---

  if (config && config.platforms.some((p) => p.enabled)) {
    const ok = await checkCommand('openspec');
    checks.push({
      name: 'openspec 命令可用',
      level: 'L2',
      passed: ok,
      message: ok ? '已安装' : '未找到，请安装 @fission-ai/openspec',
    });
    if (!ok) warnings.push('openspec 命令不可用');
  } else {
    checks.push({
      name: 'openspec 命令可用',
      level: 'L2',
      passed: true,
      message: '未启用平台，跳过',
    });
  }

  return { passed: errors.length === 0, checks, warnings, errors };
}
