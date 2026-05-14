import { Command } from 'commander';
import chalk from 'chalk';
import { homedir } from 'node:os';
import { runDoctor, type DoctorSeverity, type DoctorCheck } from '../../core/doctor/index.js';

function severityIcon(s: DoctorSeverity): string {
  switch (s) {
    case 'pass':
      return '✓';
    case 'warn':
      return '⚠';
    case 'fail':
      return '✗';
  }
}

function severityColor(s: DoctorSeverity, text: string): string {
  switch (s) {
    case 'pass':
      return chalk.green(text);
    case 'warn':
      return chalk.yellow(text);
    case 'fail':
      return chalk.red(text);
  }
}

function renderCheck(check: DoctorCheck): string {
  const icon = severityIcon(check.severity);
  const line = `  ${severityColor(check.severity, icon)} [${check.title}] ${check.message}`;
  const hint = check.hint ? `\n      ${chalk.gray('→ ' + check.hint)}` : '';
  return line + hint;
}

export const doctorCommand = new Command('doctor')
  .description('项目健康体检 - 汇总环境/结构/快照/升级待办等确定性证据')
  .option('--json', '以 JSON 格式输出，便于 Skill/CI 消费')
  .action(async (options: { json?: boolean }) => {
    let projectDir: string;
    try {
      projectDir = process.cwd();
    } catch {
      projectDir = homedir();
      console.log(chalk.yellow(`⚠ 当前工作目录已失效，回退到: ${projectDir}`));
    }
    const report = await runDoctor(projectDir);

    if (options.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      if (report.overall === 'fail') process.exit(1);
      return;
    }

    console.log(chalk.blue('🩺 ak47 doctor'));
    console.log(chalk.gray(`  项目: ${report.meta.projectDir}`));
    console.log(
      chalk.gray(
        `  CLI: ${report.meta.cliVersion}  Node: ${report.meta.nodeVersion}  生成: ${report.meta.generatedAt}`
      )
    );
    console.log('');

    for (const section of report.sections) {
      console.log(chalk.bold(`▸ ${section.name}`));
      for (const check of section.checks) {
        console.log(renderCheck(check));
      }
      console.log('');
    }

    const { pass, warn, fail } = report.summary;
    const overallLabel = severityColor(
      report.overall,
      report.overall === 'pass' ? '健康' : report.overall === 'warn' ? '有警告' : '不健康'
    );
    console.log(`整体: ${overallLabel}  (pass=${pass}, warn=${warn}, fail=${fail})`);
    console.log('');
    console.log(chalk.gray('💡 需要 AI 结合 git diff 给出改进建议？'));
    console.log(chalk.gray('   在 Qoder 里直接说「体检」，由 ak47-skill-doctor-analysis 接管。'));

    if (report.overall === 'fail') process.exit(1);
  });
