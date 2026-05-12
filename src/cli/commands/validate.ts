/**
 * validate 命令
 * 
 * 验证项目状态，检查规则遵守情况，显示偏离统计
 * 支持外部平台功能测试验证
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { existsSync } from 'node:fs';
import { RulesEnforcer } from '../../core/orchestrator/rules-enforcer.js';
import { getAk47Dir } from '../../utils/paths.js';

export const validateCommand = new Command('validate')
  .description('验证项目状态和规则遵守情况')
  .argument('[path]', '项目路径（默认为当前目录）', '.')
  .option('--strict', '严格模式：硬规则违反时退出', false)
  .option('--stats', '仅显示偏离统计', false)
  // 外部验证相关选项
  .option('--type <type>', '执行指定类型的验证（或使用 "all" 执行所有 auto 类型）')
  .option('--list', '列出当前变更的验证数据')
  .option('--summary', '生成验证摘要')
  .option('--skip-validation', '跳过验证环节（快速归档）')
  .action(async (projectPath: string, options: {
    strict?: boolean;
    stats?: boolean;
    type?: string;
    list?: boolean;
    summary?: boolean;
    skipValidation?: boolean;
  }) => {
    const projectRoot = path.resolve(projectPath);

    // 如果指定了验证相关选项，执行验证逻辑
    if (options.list || options.summary || options.type || options.skipValidation) {
      await handleValidation(projectRoot, options);
      return;
    }

    // 否则执行原有的规则验证逻辑
    await handleRulesValidation(projectRoot, options);
  });

/**
 * 显示偏离统计
 */
function displayDeviationStats(enforcer: RulesEnforcer): void {
  const stats = enforcer.getDeviationStats();

  console.log(chalk.blue('偏离统计:'));
  console.log('');

  // 影响级别分布
  console.log('影响级别分布:');
  console.log(`  低 (low):    ${stats.impact.low || 0}`);
  console.log(`  中 (medium): ${stats.impact.medium || 0}`);
  console.log(`  高 (high):   ${stats.impact.high || 0}`);
  console.log('');

  // 高频偏离原因
  if (stats.topReasons.length > 0) {
    console.log('高频偏离原因:');
    stats.topReasons.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.reason} (${item.count} 次)`);
    });
    console.log('');
  }

  // 最近的偏离
  if (stats.recent.length > 0) {
    console.log('最近的偏离:');
    stats.recent.forEach((record) => {
      const time = new Date(record.timestamp).toLocaleString('zh-CN');
      console.log(`  [${time}] ${record.deviation}`);
      console.log(`    原因: ${record.reason}`);
      console.log(`    影响: ${record.impact}`);
      console.log('');
    });
  } else {
    console.log(chalk.gray('暂无偏离记录'));
    console.log('');
  }
}

/**
 * 获取违反图标
 */
function getViolationIcon(level: string): string {
  switch (level) {
    case 'hard':
      return chalk.red('❌');
    case 'strong':
      return chalk.yellow('⚠️ ');
    case 'suggestion':
      return chalk.blue('💡');
    default:
      return '•';
  }
}

/**
 * 处理外部验证逻辑
 */
async function handleValidation(
  projectRoot: string,
  options: {
    type?: string;
    list?: boolean;
    summary?: boolean;
    skipValidation?: boolean;
  }
): Promise<void> {
  console.log(chalk.blue('ak47 validate - 外部验证'));
  console.log(chalk.gray(`项目路径: ${projectRoot}`));
  console.log('');

  try {
    // 列出验证数据
    if (options.list) {
      await listValidationResults(projectRoot);
      return;
    }

    // 生成验证摘要
    if (options.summary) {
      await showValidationSummary(projectRoot);
      return;
    }

    // 跳过验证
    if (options.skipValidation) {
      console.log(chalk.yellow('⊘ 跳过验证环节'));
      return;
    }

    // 执行指定类型的验证
    if (options.type) {
      console.log(chalk.blue(`→ 执行验证类型: ${options.type}`));
      // TODO: 实现执行指定类型验证的逻辑
      console.log(chalk.gray('  (功能待实现)'));
      return;
    }
  } catch (err) {
    console.error('');
    console.error(chalk.red('验证失败:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }
}

/**
 * 处理原有的规则验证逻辑
 */
async function handleRulesValidation(
  projectRoot: string,
  options: { strict?: boolean; stats?: boolean }
): Promise<void> {
  console.log(chalk.blue('ak47 validate - 项目验证'));
  console.log(chalk.gray(`项目路径: ${projectRoot}`));
  console.log('');

  try {
    const enforcer = new RulesEnforcer(projectRoot);
    enforcer.registerDefaultRules();

    // 如果只需要显示统计
    if (options.stats) {
      displayDeviationStats(enforcer);
      return;
    }

    // 检查所有规则
    console.log(chalk.gray('→ 检查项目规则...'));
    console.log('');

    const violations = await enforcer.checkAllRules({
      projectRoot,
    });

    if (violations.length === 0) {
      console.log(chalk.green('✓ 所有规则检查通过'));
    } else {
      console.log(chalk.yellow(`发现 ${violations.length} 个规则问题:`));
      console.log('');

      for (const violation of violations) {
        const icon = getViolationIcon(violation.rule.level);
        console.log(`${icon} ${violation.rule.description}`);
        if (violation.suggestion) {
          console.log(chalk.gray(`   建议: ${violation.suggestion}`));
        }
        console.log('');

        // 处理偏离
        await enforcer.handleViolation(violation, { projectRoot });
      }
    }

    // 显示偏离统计
    console.log('');
    displayDeviationStats(enforcer);

    // 严格模式：有硬规则违反时退出
    if (options.strict) {
      const hardViolations = violations.filter((v) => v.rule.level === 'hard');
      if (hardViolations.length > 0) {
        console.log('');
        console.log(chalk.red('✗ 严格模式：发现硬规则违反，退出'));
        process.exit(1);
      }
    }
  } catch (err) {
    console.error('');
    console.error(chalk.red('验证失败:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }
}

/**
 * 列出验证结果
 */
async function listValidationResults(projectRoot: string): Promise<void> {
  const ak47Dir = getAk47Dir(projectRoot);
  const changesDir = path.join(ak47Dir, 'changes');

  if (!existsSync(changesDir)) {
    console.log(chalk.yellow('⊘ 未找到变更目录'));
    return;
  }

  // TODO: 列出所有变更的验证结果
  console.log(chalk.blue('验证数据列表:'));
  console.log(chalk.gray('  (功能待实现)'));
}

/**
 * 显示验证摘要
 */
async function showValidationSummary(projectRoot: string): Promise<void> {
  const ak47Dir = getAk47Dir(projectRoot);
  const changesDir = path.join(ak47Dir, 'changes');

  if (!existsSync(changesDir)) {
    console.log(chalk.yellow('⊘ 未找到变更目录'));
    return;
  }

  // TODO: 读取最新的验证结果并显示摘要
  console.log(chalk.blue('验证摘要:'));
  console.log(chalk.gray('  (功能待实现)'));
}
