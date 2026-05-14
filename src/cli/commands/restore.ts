import { Command } from 'commander';
import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { listBackups, restoreFromBackup } from '../../core/upgrader/config-backup.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const restoreCommand = new Command('restore')
  .description('从备份恢复配置（.ak47/.qoder/AGENTS.md）')
  .option('-f, --force', '强制覆盖现有配置（默认跳过已存在的配置）')
  .option('-b, --backup <name>', '指定要恢复的备份名称')
  .action(async (options) => {
    console.log(chalk.blue('🔄 AK47 配置恢复\n'));

    // 1. 定位项目根目录（当前目录或向上查找包含 .ak47 的目录）
    let projectDir = process.cwd();
    let found = false;
    let current = projectDir;

    while (current !== '/') {
      if (existsSync(join(current, '.ak47'))) {
        projectDir = current;
        found = true;
        break;
      }
      current = join(current, '..');
    }

    if (!found) {
      console.log(chalk.red('❌ 未找到 AK47 项目（需要包含 .ak47 目录）'));
      process.exit(1);
    }

    console.log(chalk.gray(`项目目录: ${projectDir}\n`));

    // 2. 列出所有可用备份
    const backups = await listBackups(projectDir);

    if (backups.length === 0) {
      console.log(chalk.yellow('⚠️  没有找到任何备份'));
      console.log(chalk.gray('提示：执行 ak47 upgrade 时会自动创建备份'));
      process.exit(0);
    }

    console.log(chalk.blue('📦 可用备份:'));
    console.log('');

    backups.forEach((backup, index) => {
      const label = index === 0 ? chalk.green(' (最新)') : '';
      console.log(`  ${index + 1}. ${backup.name}${label}`);
      console.log(`     时间: ${backup.timestamp} | 备份项: ${backup.itemCount} 个`);
    });

    console.log('');

    // 3. 确定要恢复的备份
    let targetBackup = backups[0]; // 默认选择最新备份

    if (options.backup) {
      // 用户指定了备份名称
      const found = backups.find((b) => b.name === options.backup);
      if (!found) {
        console.log(chalk.red(`❌ 未找到备份: ${options.backup}`));
        console.log(chalk.gray('可用备份:'));
        backups.forEach((b) => console.log(`  - ${b.name}`));
        process.exit(1);
      }
      targetBackup = found;
    } else if (backups.length > 1) {
      // 有多个备份，让用户选择
      const choice = await select({
        message: '选择要恢复的备份:',
        choices: backups.map((b, index) => ({
          name: `${b.name} (${b.timestamp}, ${b.itemCount} 项)${index === 0 ? ' [最新]' : ''}`,
          value: index,
        })),
      });
      targetBackup = backups[choice];
    } else {
      console.log(chalk.green(`✓ 自动选择最新备份: ${targetBackup.name}`));
      console.log('');
    }

    // 4. 确认恢复操作
    const forceMode = options.force;
    const warning = forceMode
      ? chalk.yellow('⚠️  警告：将覆盖现有配置！')
      : chalk.gray('提示：已存在的配置将被跳过（使用 --force 强制覆盖）');

    console.log(warning);
    console.log('');

    const shouldRestore = await confirm({
      message: `确认从备份 ${targetBackup.name} 恢复配置？`,
      default: false,
    });

    if (!shouldRestore) {
      console.log(chalk.yellow('取消恢复'));
      process.exit(0);
    }

    // 5. 执行恢复
    console.log('');
    console.log(chalk.blue('🔄 正在恢复配置...'));

    try {
      const result = await restoreFromBackup(projectDir, targetBackup.name, {
        force: forceMode,
      });

      console.log('');
      console.log(chalk.green('✓ 恢复完成\n'));

      if (result.restored.length > 0) {
        console.log(chalk.green('已恢复:'));
        result.restored.forEach((item) => {
          console.log(chalk.green(`  ✓ ${item}`));
        });
        console.log('');
      }

      if (result.skipped.length > 0) {
        console.log(chalk.yellow('已跳过:'));
        result.skipped.forEach((item) => {
          console.log(chalk.yellow(`  ⏭ ${item}（已存在，使用 --force 覆盖）`));
        });
        console.log('');
      }

      console.log(chalk.gray(`备份来源: ${targetBackup.name}`));
    } catch (err) {
      console.log(chalk.red(`\n❌ 恢复失败: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }
  });
