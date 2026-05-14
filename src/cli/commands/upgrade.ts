import { Command } from 'commander';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { executeUpgrade, type UpgradeOptions } from '../../core/upgrader/index.js';
import { validateProject } from '../../core/validator/index.js';
import { getConfigPath } from '../../utils/paths.js';
import { scanCustomFiles, backupCustomFiles } from '../../core/upgrader/custom-file-scanner.js';
import { loadSnapshot } from '../../core/upgrader/snapshot-manager.js';
import { resolveConflict, executeConflictResolution, type ConflictFile, type ConflictResolution } from '../../core/upgrader/conflict-resolver.js';
import { backupProjectConfig } from '../../core/upgrader/config-backup.js';



function formatStrategyLabel(strategy: string): string {
  switch (strategy) {
    case 'add':
      return 'add';
    case 'update':
      return 'update';
    case 'update-with-conflict':
      return 'conflict';
    case 'deprecate':
      return 'deprecate';
    case 'skip':
      return 'skip';
    default:
      return strategy;
  }
}

function formatStrategyIcon(strategy: string): string {
  switch (strategy) {
    case 'add':
      return '✅';
    case 'update':
      return '✅';
    case 'update-with-conflict':
      return '⚠️';
    case 'deprecate':
      return 'ℹ️';
    case 'skip':
      return '⏭️';
    default:
      return '•';
  }
}

function formatStrategyDescription(strategy: string): string {
  switch (strategy) {
    case 'add':
      return '新增能力单元';
    case 'update':
      return '模板已更新（用户未修改）';
    case 'update-with-conflict':
      return '模板已更新（用户已修改，将生成 .new）';
    case 'deprecate':
      return '单元已废弃';
    case 'skip':
      return '无变化';
    default:
      return '';
  }
}

function formatExecutionDescription(entry: { strategy: string; files: string[] }): string {
  switch (entry.strategy) {
    case 'add':
    case 'update':
      return entry.files[0] ?? '';
    case 'update-with-conflict':
      return entry.files[0] ? `${entry.files[0]}.new` : '';
    case 'deprecate':
      return '已从配置中移除';
    case 'skip':
      return '无变化';
    default:
      return '';
  }
}

function showPlan(entries: Array<{ unitId: string; strategy: string }>): void {
  for (const entry of entries) {
    const label = formatStrategyLabel(entry.strategy);
    const desc = formatStrategyDescription(entry.strategy);
    console.log(`  [${label.padEnd(8)}] ${entry.unitId.padEnd(30)} ${desc}`);
  }

  const counts = {
    add: entries.filter((e) => e.strategy === 'add').length,
    update: entries.filter((e) => e.strategy === 'update').length,
    conflict: entries.filter((e) => e.strategy === 'update-with-conflict').length,
    deprecate: entries.filter((e) => e.strategy === 'deprecate').length,
    skip: entries.filter((e) => e.strategy === 'skip').length,
  };

  console.log('');
  console.log(
    `共 ${entries.length} 个单元：${counts.add} 新增, ${counts.update} 更新, ${counts.conflict} 冲突, ${counts.deprecate} 废弃, ${counts.skip} 跳过`
  );
}

export const upgradeCommand = new Command('upgrade')
  .description('项目配置升级 - 同步项目模板到 CLI 当前版本')
  .option('--dry-run', '预览变更，不执行')
  .option('--yes', '跳过确认直接升级')
  .option('--only <units>', '仅升级指定能力单元（逗号分隔）')
  .action(async (options: { dryRun?: boolean; yes?: boolean; only?: string }) => {
    let projectDir: string;
    try {
      projectDir = process.cwd();
    } catch {
      projectDir = homedir();
      console.log(chalk.yellow(`⚠ 当前工作目录已失效，回退到: ${projectDir}`));
    }

    if (!existsSync(getConfigPath(projectDir))) {
      console.error(chalk.red('✗ 未找到 .ak47/config.yaml'));
      console.error(chalk.gray('  请先运行 ak47 init 初始化项目'));
      process.exit(1);
    }

    console.log(chalk.blue('🔍 分析项目状态...\n'));

    // 0. 升级前自动备份关键配置
    console.log(chalk.blue('📦 备份关键配置...'));
    try {
      const backup = await backupProjectConfig(projectDir);
      console.log(chalk.green(`✓ 备份 ${backup.itemCount} 项 → ${backup.backupPath}`));
      if (backup.cleanedCount > 0) {
        console.log(chalk.gray(`  清理 ${backup.cleanedCount} 个旧备份（保留最近 ${2} 次）`));
      }
      console.log('');
    } catch (err) {
      console.log(chalk.yellow(`⚠ 备份失败（不影响升级继续）: ${err instanceof Error ? err.message : String(err)}`));
      console.log('');
    }

    // 1. 加载快照
    const snapshot = await loadSnapshot(projectDir);
    const snapshotFiles = snapshot ? Object.keys(snapshot.files) : [];

    // 2. 扫描自定义文件
    const customFiles = await scanCustomFiles(projectDir, snapshotFiles);
    if (customFiles.length > 0) {
      console.log(chalk.yellow(`⚠️  检测到 ${customFiles.length} 个自定义文件:`));
      for (const file of customFiles) {
        const icon = file.possiblyAffected ? '⚠️ ' : '📄';
        console.log(chalk.gray(`  ${icon} ${file.relativePath}`));
        if (file.possiblyAffected && file.affectedReason) {
          console.log(chalk.gray(`     → ${file.affectedReason}`));
        }
      }
      console.log('');

      // 提醒用户这些文件不会被升级
      console.log(chalk.cyan('💡 提示:'));
      console.log(chalk.gray('  • 这些文件是您的自定义内容，升级不会修改它们'));
      console.log(chalk.gray('  • 如果与新版 ak47 不兼容，可能需要手动适配'));
      console.log('');

      // 询问是否备份
      if (!options.yes) {
        const shouldBackup = await confirm({
          message: '是否在升级前备份这些自定义文件?',
          default: true,
        });

        if (shouldBackup) {
          const backupDir = await backupCustomFiles(projectDir, customFiles);
          console.log(chalk.green(`✓ 备份已保存至: ${backupDir}\n`));
        }
      }
    }

    // 3. 获取升级计划
    const upgradeOptions: UpgradeOptions = {
      dryRun: options.dryRun,
      yes: options.yes,
      only: options.only ? options.only.split(',').map((s) => s.trim()) : undefined,
    };

    let planResult;
    try {
      planResult = await executeUpgrade(projectDir, { ...upgradeOptions, dryRun: true });
    } catch (err) {
      console.error(chalk.red('✗ 升级分析失败:'));
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }

    // 4. 显示完整预览
    if (options.dryRun || !options.yes) {
      console.log('📋 升级计划');
      console.log('');
      showPlan(planResult.entries);
      console.log('');

      if (customFiles.length > 0) {
        console.log(chalk.yellow('📝 自定义文件 (不会被修改):'));
        for (const file of customFiles.slice(0, 5)) {
          console.log(chalk.gray(`  • ${file.relativePath}`));
        }
        if (customFiles.length > 5) {
          console.log(chalk.gray(`  ... 还有 ${customFiles.length - 5} 个文件`));
        }
        console.log('');
      }
    }

    if (options.dryRun) {
      console.log('使用 ak47 upgrade --yes 执行升级');
      return;
    }

    // 5. 确认升级
    if (!options.yes) {
      const shouldProceed = await confirm({
        message: '确认执行升级？',
        default: false,
      });

      if (!shouldProceed) {
        console.log(chalk.yellow('升级已取消'));
        return;
      }
    }

    // 6. 执行升级
    console.log('🔄 正在升级项目配置...\n');
    let result;
    try {
      result = await executeUpgrade(projectDir, { ...upgradeOptions, dryRun: false });
    } catch (err) {
      console.error(chalk.red('✗ 升级失败:'));
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }

    // 7. 显示执行结果
    for (const entry of result.entries) {
      const icon = formatStrategyIcon(entry.strategy);
      const label = formatStrategyLabel(entry.strategy);
      const desc = formatExecutionDescription(entry);
      const arrow = desc ? `→ ${desc}` : '';
      console.log(`  ${icon} [${label.padEnd(8)}] ${entry.unitId.padEnd(30)} ${arrow}`);
    }

    // 8. 处理冲突文件 (交互式)
    const conflictEntries = result.entries.filter(e => e.strategy === 'update-with-conflict');
    if (conflictEntries.length > 0 && !options.yes) {
      console.log(chalk.yellow('\n⚠️  发现冲突文件，需要您决定如何处理:\n'));

      // 将所有冲突文件展开为扁平列表
      const allConflicts: ConflictFile[] = [];
      for (const entry of conflictEntries) {
        for (const file of entry.files) {
          allConflicts.push({
            relativePath: file,
            userPath: `${projectDir}/${file}`,
            templatePath: `${projectDir}/${file}.new`,
          });
        }
      }

      let bulkResolution: 'keep-user' | 'use-template' | null = null;

      for (const conflict of allConflicts) {
        let resolution: ConflictResolution;

        if (bulkResolution) {
          resolution = bulkResolution;
        } else {
          resolution = await resolveConflict(conflict);
          if (resolution === 'keep-all-user') {
            bulkResolution = 'keep-user';
            resolution = 'keep-user';
          } else if (resolution === 'use-all-template') {
            bulkResolution = 'use-template';
            resolution = 'use-template';
          }
        }

        await executeConflictResolution(conflict, resolution);
      }
    }

    // 9. 验证结果
    let validationResult;
    try {
      validationResult = await validateProject(projectDir);
    } catch {
      validationResult = {
        passed: false,
        errors: ['验证执行失败'],
        warnings: [],
        checks: [],
      };
    }

    console.log('');
    if (validationResult.passed) {
      console.log(
        `验证结果: ${chalk.green('通过')} (${validationResult.errors.length} 错误, ${validationResult.warnings.length} 警告)`
      );
    } else {
      console.log(
        `验证结果: ${chalk.red('未通过')} (${validationResult.errors.length} 错误, ${validationResult.warnings.length} 警告)`
      );
    }

    const relativeBackupPath = result.backupPath.replace(projectDir, '').replace(/^\/+/, '');
    console.log('');
    console.log(chalk.gray(`配置备份已保存至: ${relativeBackupPath || result.backupPath}`));

    // 10. 升级后提示
    console.log('');
    console.log(chalk.blue('========================================='));
    console.log(chalk.blue('✓ 升级完成！'));
    console.log(chalk.blue('=========================================\n'));

    if (customFiles.length > 0) {
      console.log(chalk.yellow('📝 后续建议:'));
      console.log(chalk.gray('  1. 检查自定义文件是否与新版 ak47 兼容'));
      console.log(chalk.gray('  2. 如有冲突文件 (.new)，请手动合并后删除'));
      console.log(chalk.gray('  3. 运行 ak47 validate 验证项目配置\n'));
    }

    if (conflictEntries.length > 0) {
      console.log(chalk.yellow('⚠️  待处理:'));
      console.log(chalk.gray(`  • ${conflictEntries.length} 个冲突文件需要处理`));
      console.log(chalk.gray('  • 检查 .new 文件并决定保留哪个版本\n'));
    }

    // 检查 AGENTS.md.new
    const agentsNewPath = join(projectDir, 'AGENTS.md.new');
    if (existsSync(agentsNewPath)) {
      console.log(chalk.yellow('📄 模板 AGENTS.md 已更新:'));
      console.log(chalk.gray('  • AGENTS.md.new 包含最新模板内容'));
      console.log(chalk.gray('  • 对比项目 AGENTS.md 与 AGENTS.md.new，手动合并门控纪律等新增章节\n'));
    }
  });
