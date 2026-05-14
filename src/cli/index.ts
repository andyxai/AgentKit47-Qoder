#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { changeCommand } from './commands/change.js';
import { configCommand } from './commands/config.js';
import { validateCommand } from './commands/validate.js';
import { updateCommand } from './commands/update.js';
import { upgradeCommand } from './commands/upgrade.js';
import { configManagerCommand } from './commands/config-manager.js';
import { doctorCommand } from './commands/doctor.js';
import { restoreCommand } from './commands/restore.js';

// 动态读取 package.json 版本号
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

const program = new Command();

program.name('ak47').description('AI 工程化脚手架 - 集成 OpenSpec 与 27 个工程 Skills').version(version);

// 注册命令
program.addCommand(initCommand);
program.addCommand(changeCommand);
program.addCommand(configCommand);
program.addCommand(validateCommand);
program.addCommand(updateCommand);
program.addCommand(upgradeCommand);
program.addCommand(restoreCommand);
program.addCommand(configManagerCommand);
program.addCommand(doctorCommand);

// 处理未知命令
program.on('command:*', () => {
  console.error(chalk.red(`错误: 未知命令 '${program.args.join(' ')}'`));
  console.error('');
  console.error('可用命令:');
  console.error('  ak47 init             项目初始化');
  console.error('  ak47 change           日常变更流程');
  console.error('  ak47 config           项目配置管理');
  console.error('  ak47 validate         验证项目配置');
  console.error('  ak47 update           CLI 工具更新');
  console.error('  ak47 upgrade          项目配置升级');
  console.error('  ak47 restore          配置恢复');
  console.error('  ak47 config-manager   自定义配置管理');
  console.error('  ak47 doctor           项目健康体检');
  console.error('');
  console.error('使用 ak47 --help 查看完整帮助');
  process.exit(1);
});

program.parse(process.argv);
