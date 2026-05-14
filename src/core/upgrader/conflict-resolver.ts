import { readFile } from 'node:fs/promises';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';

/**
 * 冲突解决选项
 */
export type ConflictResolution =
  | 'keep-user'
  | 'use-template'
  | 'merge-later'
  | 'keep-all-user'
  | 'use-all-template';

/**
 * 冲突文件信息
 */
export interface ConflictFile {
  /** 文件相对路径 */
  relativePath: string;
  /** 当前用户版本路径 */
  userPath: string;
  /** 新模板版本路径 (.new 文件) */
  templatePath: string;
}

/**
 * 交互式解决冲突文件
 *
 * @param conflict - 冲突文件信息
 * @returns 用户选择的解决方案
 */
export async function resolveConflict(
  conflict: ConflictFile
): Promise<ConflictResolution> {
  console.log(chalk.yellow(`\n⚠️  检测到冲突文件: ${conflict.relativePath}`));
  console.log(chalk.gray('   模板已更新,且您也修改了此文件\n'));

  // 显示差异摘要
  await showConflictSummary(conflict);

  const choice = await select({
    message: '请选择如何处理此冲突:',
    choices: [
      {
        name: '🔒 保留我的版本 (忽略模板更新)',
        value: 'keep-user' as ConflictResolution,
        description: '保留您的修改,删除 .new 文件',
      },
      {
        name: '📥 使用模板新版本 (覆盖我的修改)',
        value: 'use-template' as ConflictResolution,
        description: '使用模板的新版本,您的修改将丢失',
      },
      {
        name: '🔧 稍后手动合并',
        value: 'merge-later' as ConflictResolution,
        description: '保留两个版本,稍后自行合并',
      },
      {
        name: '🔒 全部使用我的版本 (剩余冲突不再询问)',
        value: 'keep-all-user' as ConflictResolution,
        description: '当前及之后所有冲突文件均保留您的修改',
      },
      {
        name: '📥 全部使用模板新版本 (剩余冲突不再询问)',
        value: 'use-all-template' as ConflictResolution,
        description: '当前及之后所有冲突文件均使用模板版本',
      },
    ],
    default: 'merge-later',
  });

  return choice;
}

/**
 * 显示冲突摘要信息
 */
async function showConflictSummary(conflict: ConflictFile): Promise<void> {
  try {
    // 读取两个版本的前几行作为示例
    const userContent = await readFile(conflict.userPath, 'utf-8');
    const templateContent = await readFile(conflict.templatePath, 'utf-8');

    const userLines = userContent.split('\n').length;
    const templateLines = templateContent.split('\n').length;

    console.log(chalk.cyan('   版本对比:'));
    console.log(chalk.gray(`   • 您的版本: ${userLines} 行`));
    console.log(chalk.gray(`   • 模板版本: ${templateLines} 行`));
    console.log('');

    // 显示前 5 行差异示例
    const userPreview = userContent.split('\n').slice(0, 3).join('\n');
    const templatePreview = templateContent.split('\n').slice(0, 3).join('\n');

    console.log(chalk.gray('   您的版本 (前3行):'));
    console.log(chalk.gray(`   ${userPreview.split('\n').join('\n   ')}\n`));
    
    console.log(chalk.gray('   模板版本 (前3行):'));
    console.log(chalk.gray(`   ${templatePreview.split('\n').join('\n   ')}\n`));
  } catch {
    console.log(chalk.gray('   (无法读取文件内容进行对比)\n'));
  }
}

/**
 * 根据用户选择执行冲突解决
 *
 * @param conflict - 冲突文件信息
 * @param resolution - 用户选择的解决方案
 */
export async function executeConflictResolution(
  conflict: ConflictFile,
  resolution: ConflictResolution
): Promise<void> {
  const { rm, cp } = await import('node:fs/promises');

  switch (resolution) {
    case 'keep-user':
      // 保留用户版本,删除 .new 文件
      await rm(conflict.templatePath, { force: true });
      console.log(chalk.green(`   ✓ 已保留您的版本,删除 .new 文件`));
      break;

    case 'use-template':
      // 使用模板版本,覆盖用户文件
      await cp(conflict.templatePath, conflict.userPath, { force: true });
      await rm(conflict.templatePath, { force: true });
      console.log(chalk.green(`   ✓ 已使用模板新版本覆盖`));
      break;

    case 'merge-later':
      // 保留两个文件,让用户稍后手动合并
      console.log(chalk.yellow(`   ⏸  已保留两个版本:`));
      console.log(chalk.gray(`      • 您的版本: ${conflict.userPath}`));
      console.log(chalk.gray(`      • 模板版本: ${conflict.templatePath}`));
      console.log(chalk.gray(`      请手动合并后删除 .new 文件`));
      break;

    case 'keep-all-user':
      // 全部保留用户版本 (与 keep-user 相同,但由调用方控制批量逻辑)
      await rm(conflict.templatePath, { force: true });
      console.log(chalk.green(`   ✓ 已保留您的版本 (全部应用)`));
      break;

    case 'use-all-template':
      // 全部使用模板版本 (与 use-template 相同,但由调用方控制批量逻辑)
      await cp(conflict.templatePath, conflict.userPath, { force: true });
      await rm(conflict.templatePath, { force: true });
      console.log(chalk.green(`   ✓ 已使用模板新版本覆盖 (全部应用)`));
      break;
  }
}

/**
 * 批量解决冲突 (非交互模式)
 *
 * @param conflicts - 冲突文件列表
 * @param defaultStrategy - 默认策略
 * @returns 每个冲突的解决方案
 */
export async function batchResolveConflicts(
  conflicts: ConflictFile[],
  defaultStrategy: ConflictResolution = 'merge-later'
): Promise<Map<string, ConflictResolution>> {
  const resolutions = new Map<string, ConflictResolution>();

  for (const conflict of conflicts) {
    resolutions.set(conflict.relativePath, defaultStrategy);
  }

  return resolutions;
}
