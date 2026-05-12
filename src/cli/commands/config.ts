import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'node:fs';
import {
  configGet,
  configSet,
  configList,
  configReset,
  backupConfig,
} from '../../core/config-manager/index.js';
import { validateProject } from '../../core/validator/index.js';
import { getConfigPath } from '../../utils/paths.js';

const VALID_ACTIONS = ['set', 'get', 'list', 'reset'] as const;
type ConfigAction = (typeof VALID_ACTIONS)[number];

const VALID_CATEGORIES = ['agent', 'flow', 'platform', 'general'] as const;
type ConfigCategory = (typeof VALID_CATEGORIES)[number];

function isValidAction(value: string): value is ConfigAction {
  return (VALID_ACTIONS as readonly string[]).includes(value);
}

function isValidCategory(value: string): value is ConfigCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(value);
}

/**
 * 格式化配置值用于显示
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return chalk.gray('(未设置)');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * 检查 config.yaml 是否存在，不存在则报错退出
 */
function ensureConfigExists(projectDir: string): void {
  const configPath = getConfigPath(projectDir);
  if (!existsSync(configPath)) {
    console.error(chalk.red('✗ 未找到 .ak47/config.yaml'));
    console.error(chalk.gray('  请先运行 ak47 init 初始化项目'));
    process.exit(1);
  }
}

/**
 * 处理 set 操作
 */
async function handleSet(
  projectDir: string,
  category: string,
  key: string,
  value: string
): Promise<void> {
  if (!isValidCategory(category)) {
    console.error(chalk.red(`✗ 非法分类: ${category}`));
    console.error(chalk.gray(`  有效值: ${VALID_CATEGORIES.join(', ')}`));
    process.exit(1);
  }

  // 操作前自动备份
  let backupPath: string;
  try {
    backupPath = await backupConfig(projectDir);
  } catch (err) {
    console.error(chalk.red('✗ 备份配置失败:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  // 执行修改
  let result: { oldValue: unknown; newValue: unknown };
  try {
    result = await configSet(projectDir, category, key, value);
  } catch (err) {
    console.error(chalk.red('✗ 配置修改失败:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  // 操作后验证
  let validationPassed = false;
  let errorCount = 0;
  let warningCount = 0;
  try {
    const validationResult = await validateProject(projectDir);
    validationPassed = validationResult.passed;
    errorCount = validationResult.errors.length;
    warningCount = validationResult.warnings.length;
  } catch {
    // 验证失败不影响配置修改结果
  }

  // 输出结果
  console.log(chalk.green('✅ 配置修改成功'));
  console.log('');
  console.log('修改内容:');
  const oldDisplay = formatValue(result.oldValue);
  const newDisplay = formatValue(result.newValue);
  console.log(`  ${chalk.cyan(`${category}.${key}`)}: ${oldDisplay} → ${chalk.yellow(newDisplay)}`);
  console.log('');

  if (validationPassed) {
    console.log(`验证结果: ${chalk.green('通过')} (${errorCount} 错误, ${warningCount} 警告)`);
  } else {
    console.log(`验证结果: ${chalk.red('未通过')} (${errorCount} 错误, ${warningCount} 警告)`);
  }
  console.log('');
  console.log(chalk.gray(`备份已保存至: ${backupPath}`));
}

/**
 * 处理 get 操作
 */
async function handleGet(projectDir: string, category: string, key: string): Promise<void> {
  if (!isValidCategory(category)) {
    console.error(chalk.red(`✗ 非法分类: ${category}`));
    console.error(chalk.gray(`  有效值: ${VALID_CATEGORIES.join(', ')}`));
    process.exit(1);
  }

  let value: unknown;
  try {
    value = await configGet(projectDir, category, key);
  } catch (err) {
    console.error(chalk.red('✗ 读取配置失败:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  if (value === null || value === undefined) {
    console.log(chalk.yellow(`⚠ ${category}.${key} 未设置`));
    return;
  }

  console.log(chalk.cyan(`${category}.${key}`));
  if (typeof value === 'object') {
    console.log(formatValue(value));
  } else {
    console.log(formatValue(value));
  }
}

/**
 * 处理 list 操作
 */
async function handleList(projectDir: string, category?: string): Promise<void> {
  if (category && !isValidCategory(category)) {
    console.error(chalk.red(`✗ 非法分类: ${category}`));
    console.error(chalk.gray(`  有效值: ${VALID_CATEGORIES.join(', ')}`));
    process.exit(1);
  }

  let grouped: Record<string, Record<string, unknown>>;
  try {
    grouped = await configList(projectDir, category as ConfigCategory | undefined);
  } catch (err) {
    console.error(chalk.red('✗ 读取配置失败:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  console.log(chalk.cyan.bold('📋 ak47 项目配置'));
  console.log('');

  for (const [cat, entries] of Object.entries(grouped)) {
    console.log(chalk.yellow(`[${cat}]`));
    for (const [k, v] of Object.entries(entries)) {
      if (typeof v === 'object' && v !== null) {
        // platform 条目是对象，展开显示
        const obj = v as Record<string, unknown>;
        if ('enabled' in obj) {
          const enabledLabel = obj.enabled ? chalk.green('enabled') : chalk.red('disabled');
          console.log(`  ${k}: ${enabledLabel}`);
        } else {
          console.log(`  ${k}: ${formatValue(v)}`);
        }
      } else {
        console.log(`  ${k}: ${formatValue(v)}`);
      }
    }
    console.log('');
  }
}

/**
 * 处理 reset 操作
 */
async function handleReset(projectDir: string, category?: string, key?: string): Promise<void> {
  if (category && !isValidCategory(category)) {
    console.error(chalk.red(`✗ 非法分类: ${category}`));
    console.error(chalk.gray(`  有效值: ${VALID_CATEGORIES.join(', ')}`));
    process.exit(1);
  }

  // 操作前自动备份
  let backupPath: string;
  try {
    backupPath = await backupConfig(projectDir);
  } catch (err) {
    console.error(chalk.red('✗ 备份配置失败:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  // 执行重置
  try {
    await configReset(projectDir, category as ConfigCategory | undefined, key);
  } catch (err) {
    console.error(chalk.red('✗ 配置重置失败:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }

  // 输出结果
  console.log(chalk.green('✅ 配置重置成功'));
  console.log('');

  if (!category) {
    console.log('重置范围: 全部配置（已保留 projectName 和 createdAt）');
  } else if (!key) {
    console.log(`重置范围: ${chalk.cyan(category)} 分类`);
  } else {
    console.log(`重置范围: ${chalk.cyan(`${category}.${key}`)}`);
  }

  console.log('');
  console.log(chalk.gray(`备份已保存至: ${backupPath}`));
}

export const configCommand = new Command('config')
  .description('项目配置管理 - 替换 Agent/调整参数')
  .argument('<action>', '操作类型（set/get/list/reset）')
  .argument('[category]', '配置分类（agent/flow/platform/general）')
  .argument('[key]', '配置项键名')
  .argument('[value]', '配置项值')
  .action(async (action: string, category?: string, key?: string, value?: string) => {
    console.log(chalk.blue('ak47 config - 项目配置管理'));
    console.log('');

    // 校验 action
    if (!isValidAction(action)) {
      console.error(chalk.red(`✗ 非法操作: ${action}`));
      console.error(chalk.gray(`  可用操作: ${VALID_ACTIONS.join(', ')}`));
      process.exit(1);
    }

    const projectDir = '.';

    // set 需要三个参数，get 需要两个参数
    if (action === 'set' && (!category || !key || value === undefined)) {
      console.error(chalk.red('✗ set 操作需要提供 category、key 和 value'));
      console.error(chalk.gray('  用法: ak47 config set <category> <key> <value>'));
      process.exit(1);
    }

    if (action === 'get' && (!category || !key)) {
      console.error(chalk.red('✗ get 操作需要提供 category 和 key'));
      console.error(chalk.gray('  用法: ak47 config get <category> <key>'));
      process.exit(1);
    }

    // 检查配置文件存在性（list 不强制要求，由 configList 内部处理）
    if (action !== 'list') {
      ensureConfigExists(projectDir);
    }

    try {
      switch (action as ConfigAction) {
        case 'set':
          await handleSet(projectDir, category!, key!, value!);
          break;
        case 'get':
          await handleGet(projectDir, category!, key!);
          break;
        case 'list':
          ensureConfigExists(projectDir);
          await handleList(projectDir, category);
          break;
        case 'reset':
          await handleReset(projectDir, category, key);
          break;
      }
    } catch (err) {
      console.error('');
      console.error(chalk.red('命令执行失败:'));
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  });
