import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { select, confirm } from '@inquirer/prompts';
import { parse } from 'yaml';
import { getFlowDefinition, type FlowStep } from '../../core/flows/index.js';
import { loadConfig } from '../../utils/config.js';
import { loadProgress, saveProgress } from '../../utils/progress.js';
import { getAk47Dir, getProgressPath } from '../../utils/paths.js';
import { markStepGuided } from '../../core/orchestrator/progress-tracker.js';
import type { ParadigmLevel } from '../../types/units.js';
import type { GuidedStep, ProgressState } from '../../types/progress.js';

const VALID_PARADIGMS = ['L1', 'L2', 'L3'] as const;

function isValidParadigm(value: string | undefined): value is ParadigmLevel {
  return !!value && (VALID_PARADIGMS as readonly string[]).includes(value);
}

/**
 * 从 progress.yaml 的 guidedSteps 扩展字段中读取已完成的步骤 ID
 */
async function getCompletedStepIds(progressPath: string): Promise<Set<string>> {
  if (!existsSync(progressPath)) return new Set();
  try {
    const raw = await readFile(progressPath, 'utf-8');
    const data = parse(raw) as Record<string, unknown>;
    const guidedSteps = data.guidedSteps as Array<{ stepId: string; status: string }> | undefined;
    if (!Array.isArray(guidedSteps)) return new Set();
    return new Set(guidedSteps.filter((s) => s.status === 'completed').map((s) => s.stepId));
  } catch {
    return new Set();
  }
}

function createInitialProgress(flowSteps: FlowStep[], paradigm: ParadigmLevel): ProgressState {
  const steps: GuidedStep[] = flowSteps.map((s) => ({
    id: `${paradigm}-${s.id}`,
    title: s.name,
    description: s.description,
    status: 'pending',
  }));
  return {
    currentStep: `${paradigm}-${flowSteps[0].id}`,
    steps,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const changeCommand = new Command('change')
  .description('日常变更 - 选择范式流程并执行（L1/L2/L3）')
  .argument('[paradigm]', '变更范式（L1/L2/L3）')
  .option('-c, --continue', '继续上次未完成的变更')
  .option('-y, --yes', '跳过确认，自动执行')
  .option('--dry-run', '预览步骤不执行')
  .action(
    async (
      paradigmArg: string | undefined,
      options: { continue?: boolean; yes?: boolean; dryRun?: boolean }
    ) => {
      console.log(chalk.blue('ak47 change - 日常变更流程'));
      console.log('');

      try {
        // 1. 初始化检查
        const ak47Dir = getAk47Dir();
        if (!existsSync(ak47Dir)) {
          console.log(chalk.yellow('⚠ 未找到 .ak47/ 目录，请先运行 ak47 init'));
          process.exit(1);
        }

        // 2. 加载配置
        const config = await loadConfig();
        if (!config) {
          console.log(chalk.yellow('⚠ 未找到 .ak47/config.yaml，请先运行 ak47 init'));
          process.exit(1);
        }

        // 3. 恢复检查
        const progressPath = getProgressPath();
        const existingProgress = await loadProgress();
        let completedStepIds = new Set<string>();

        if (options.continue) {
          if (!existingProgress) {
            console.log(chalk.yellow('⚠ 没有找到可恢复的进度，开始新流程'));
          } else {
            completedStepIds = await getCompletedStepIds(progressPath);
            console.log(chalk.gray(`→ 恢复上次的变更进度 (${completedStepIds.size} 步已完成)`));
          }
        }

        // 4. 范式选择
        let paradigm: ParadigmLevel;

        if (isValidParadigm(paradigmArg)) {
          paradigm = paradigmArg;
          console.log(chalk.gray(`→ 使用命令行指定的范式: ${paradigm}`));
        } else if (options.yes) {
          paradigm = 'L2';
          console.log(chalk.gray('→ --yes 默认选择范式: L2（技术实现）'));
        } else if (options.continue && existingProgress) {
          paradigm = 'L2';
          console.log(chalk.gray('→ 继续模式默认选择范式: L2（技术实现）'));
        } else {
          paradigm = await select({
            message: '请选择变更范式:',
            choices: [
              { name: 'L1 - 需求变更（最完整流程，14 步）', value: 'L1' },
              { name: 'L2 - 技术实现（中等复杂度，11 步）', value: 'L2' },
              { name: 'L3 - 缺陷修复（最精简流程，11 步）', value: 'L3' },
            ],
          });
        }
        console.log('');

        // 5. 获取流程定义
        const flowSteps = getFlowDefinition(paradigm);

        // 6. 流程总览
        if (options.dryRun) {
          console.log(chalk.cyan.bold(`📋 ${paradigm} 流程预览（共 ${flowSteps.length} 步）`));
        } else {
          console.log(chalk.cyan.bold(`📋 启动 ${paradigm} 流程（共 ${flowSteps.length} 步）`));
        }

        const phases = [...new Set(flowSteps.map((s) => s.phase))];
        phases.forEach((phase) => {
          const phaseSteps = flowSteps.filter((s) => s.phase === phase);
          console.log('');
          console.log(chalk.yellow(`▸ ${phase}`));
          phaseSteps.forEach((step) => {
            const marker = step.milestone ? chalk.magenta(' ★') : '';
            const agent = step.agent ? chalk.gray(` (${step.agent})`) : '';
            console.log(`  ${String(step.id).padStart(2)}. ${step.name}${agent}${marker}`);
          });
        });
        console.log('');

        if (options.dryRun) {
          console.log(chalk.gray('(--dry-run 模式，仅预览，不执行引导)'));
          return;
        }

        // 7. 初始化/更新进度
        let currentProgress: ProgressState;
        if (existingProgress) {
          currentProgress = existingProgress;
          const isSameFlow =
            currentProgress.steps.length === flowSteps.length &&
            currentProgress.steps.every((s) =>
              flowSteps.some((fs) => `${paradigm}-${fs.id}` === s.id)
            );
          if (!isSameFlow) {
            currentProgress = createInitialProgress(flowSteps, paradigm);
            await saveProgress(currentProgress);
          }
        } else {
          currentProgress = createInitialProgress(flowSteps, paradigm);
          await saveProgress(currentProgress);
        }

        // 8. 逐步引导循环
        for (const step of flowSteps) {
          const stepId = `${paradigm}-${step.id}`;

          // --continue 模式下跳过已完成的步骤
          if (options.continue && completedStepIds.has(stepId)) {
            console.log(chalk.gray(`  ✓ 步骤 ${step.id}. ${step.name} 已完成，跳过`));
            continue;
          }

          console.log('');
          console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
          console.log(chalk.cyan.bold(`  📍 当前步骤: ${step.name}`));
          console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
          console.log(`  阶段: ${step.phase}`);
          console.log(`  说明: ${step.description}`);
          if (step.agent) {
            console.log(`  负责 Agent: ${step.agent}`);
          }
          if (step.milestone) {
            console.log(chalk.magenta('  ★ 里程碑步骤'));
          }
          console.log('');

          // 等待用户确认
          if (!options.yes) {
            const confirmed = await confirm({
              message: `步骤 ${step.id}/${flowSteps.length} 已完成？`,
              default: true,
            });
            if (!confirmed) {
              console.log(chalk.yellow('⏸ 流程已暂停'));
              console.log(chalk.gray(`运行 ak47 change --continue 可恢复流程`));
              process.exit(0);
            }
          } else {
            console.log(chalk.gray(`  → --yes 模式，自动确认步骤 ${step.id}`));
          }

          // 记录进度（progress-tracker 模块）
          await markStepGuided(progressPath, stepId);

          // 同时更新 ProgressState 的 steps 状态
          const stepIndex = currentProgress.steps.findIndex((s) => s.id === stepId);
          if (stepIndex >= 0) {
            currentProgress.steps[stepIndex] = {
              ...currentProgress.steps[stepIndex],
              status: 'completed',
            };
          }
          currentProgress.currentStep = stepId;
          currentProgress.updatedAt = new Date().toISOString();
          await saveProgress(currentProgress);

          // 里程碑提示 git commit
          if (step.milestone) {
            console.log('');
            console.log(chalk.magenta.bold('★ 里程碑到达'));
            console.log(chalk.gray('  建议执行 git commit 保存当前阶段成果'));
            console.log(
              chalk.gray(
                `  例如: git commit -m "docs(${step.phase}): ${step.name}通过 - <变更摘要>"`
              )
            );
          }

          console.log(chalk.green(`  ✓ 步骤 ${step.id} 已记录`));
        }

        // 9. 流程完成
        console.log('');
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green.bold('  ✓ 所有流程步骤已完成！'));
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log('');
        console.log(`  范式: ${paradigm}`);
        console.log(`  总步骤: ${flowSteps.length}`);
        console.log(`  完成时间: ${new Date().toISOString()}`);
        console.log('');
        console.log(chalk.gray('  下一步: 根据流程产出继续开发，或运行 ak47 validate 验证产出'));
      } catch (err) {
        console.error('');
        console.error(chalk.red('变更流程失败:'));
        console.error(chalk.red(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    }
  );
