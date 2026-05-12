/**
 * config-manager 命令
 *
 * 管理用户自定义配置（验证类型、Agent、Skill）
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { ConfigManager } from '../../core/config-manager/config-manager.js';

/**
 * 获取项目根路径
 */
function getProjectRoot(): string {
  // 从环境变量或默认值获取路径
  const projectPath = process.env.AK47_PROJECT_PATH || '.';
  return path.resolve(projectPath);
}

export const configManagerCommand = new Command('config-manager')
  .description('管理用户自定义配置')
  .option('--path <path>', '项目路径（默认为当前目录）', '.')
  .action((options: { path: string }) => {
    // 设置环境变量，供子命令使用
    process.env.AK47_PROJECT_PATH = options.path;
  });

// 添加自定义验证类型
configManagerCommand
  .command('add-validation')
  .description('添加自定义验证类型')
  .requiredOption('--id <id>', '验证类型唯一标识')
  .requiredOption('--name <name>', '显示名称')
  .option('--description <desc>', '描述')
  .option('--agent <agent>', '执行的 Agent 名称')
  .option('--skill <skill>', '执行的 Skill 名称')
  .option('--script <script>', '执行的脚本路径')
  .requiredOption('--trigger <trigger>', '触发方式（auto/manual）')
  .option('--required', '是否必须通过', false)
  .option('--timeout <seconds>', '超时时间（秒）')
  .option('--reason <reason>', '添加原因')
  .option('--author <author>', '作者')
  .action(
    async (options: {
      id: string;
      name: string;
      description?: string;
      agent?: string;
      skill?: string;
      script?: string;
      trigger: 'auto' | 'manual';
      required: boolean;
      timeout?: string;
      reason?: string;
      author?: string;
    }) => {
      const projectRoot = getProjectRoot();

      console.log(chalk.blue('➕ 添加自定义验证类型'));
      console.log('');

      try {
        const manager = new ConfigManager(projectRoot);

        const validation = await manager.addValidation({
          id: options.id,
          name: options.name,
          description: options.description,
          agent: options.agent,
          skill: options.skill,
          script: options.script,
          trigger: options.trigger,
          required: options.required,
          timeout: options.timeout ? parseInt(options.timeout, 10) : undefined,
          reason: options.reason,
          author: options.author,
        });

        console.log(chalk.green(`✓ 验证类型已添加: ${validation.id}`));
        console.log(chalk.gray(`  名称: ${validation.name}`));
        console.log(chalk.gray(`  触发方式: ${validation.trigger}`));
        console.log(chalk.gray(`  必需: ${validation.required ? '是' : '否'}`));
        console.log('');
        console.log(chalk.gray('配置文件: .ak47/custom-configs.yaml'));
      } catch (error) {
        console.error(chalk.red(`✗ 添加失败: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }
  );

// 添加自定义 Agent
configManagerCommand
  .command('add-agent')
  .description('添加自定义 Agent')
  .requiredOption('--id <id>', 'Agent 唯一标识')
  .requiredOption('--name <name>', 'Agent 显示名称')
  .requiredOption('--file <file>', 'Agent 定义文件路径')
  .option('--template <template>', '使用的模板名称')
  .option('--reason <reason>', '添加原因')
  .option('--author <author>', '作者')
  .action(
    async (options: {
      id: string;
      name: string;
      file: string;
      template?: string;
      reason?: string;
      author?: string;
    }) => {
      const projectRoot = getProjectRoot();

      console.log(chalk.blue('➕ 添加自定义 Agent'));
      console.log('');

      try {
        const manager = new ConfigManager(projectRoot);

        const agent = await manager.addAgent({
          id: options.id,
          name: options.name,
          file: options.file,
          template: options.template,
          reason: options.reason,
          author: options.author,
        });

        console.log(chalk.green(`✓ Agent 已添加: ${agent.id}`));
        console.log(chalk.gray(`  名称: ${agent.name}`));
        console.log(chalk.gray(`  文件: ${agent.file}`));
        console.log('');
        console.log(chalk.gray('配置文件: .ak47/custom-configs.yaml'));
      } catch (error) {
        console.error(chalk.red(`✗ 添加失败: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }
  );

// 添加自定义 Skill
configManagerCommand
  .command('add-skill')
  .description('添加自定义 Skill')
  .requiredOption('--id <id>', 'Skill 唯一标识')
  .requiredOption('--name <name>', 'Skill 显示名称')
  .requiredOption('--directory <dir>', 'Skill 目录路径')
  .option('--template <template>', '使用的模板名称')
  .option('--reason <reason>', '添加原因')
  .option('--author <author>', '作者')
  .action(
    async (options: {
      id: string;
      name: string;
      directory: string;
      template?: string;
      reason?: string;
      author?: string;
    }) => {
      const projectRoot = getProjectRoot();

      console.log(chalk.blue('➕ 添加自定义 Skill'));
      console.log('');

      try {
        const manager = new ConfigManager(projectRoot);

        const skill = await manager.addSkill({
          id: options.id,
          name: options.name,
          directory: options.directory,
          template: options.template,
          reason: options.reason,
          author: options.author,
        });

        console.log(chalk.green(`✓ Skill 已添加: ${skill.id}`));
        console.log(chalk.gray(`  名称: ${skill.name}`));
        console.log(chalk.gray(`  目录: ${skill.directory}`));
        console.log('');
        console.log(chalk.gray('配置文件: .ak47/custom-configs.yaml'));
      } catch (error) {
        console.error(chalk.red(`✗ 添加失败: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }
  );

// 列出所有自定义配置
configManagerCommand
  .command('list')
  .description('列出所有自定义配置')
  .option('--type <type>', '配置类型（validation/agent/skill）')
  .action(async (options: { type?: string }) => {
    const projectRoot = getProjectRoot();

    console.log(chalk.blue('📋 自定义配置列表'));
    console.log('');

    try {
      const manager = new ConfigManager(projectRoot);
      const configs = await manager.listConfigs();

      // 显示验证类型
      if (!options.type || options.type === 'validation') {
        console.log(chalk.yellow('验证类型:'));
        if (configs.validation?.types && configs.validation.types.length > 0) {
          for (const v of configs.validation.types) {
            console.log(chalk.green(`  ✓ ${v.id}`));
            console.log(chalk.gray(`    名称: ${v.name}`));
            console.log(chalk.gray(`    触发: ${v.trigger}`));
            console.log(chalk.gray(`    必需: ${v.required ? '是' : '否'}`));
            if (v._reason) {
              console.log(chalk.gray(`    原因: ${v._reason}`));
            }
            console.log('');
          }
        } else {
          console.log(chalk.gray('  (无)'));
          console.log('');
        }
      }

      // 显示自定义 Agent
      if (!options.type || options.type === 'agent') {
        console.log(chalk.yellow('自定义 Agent:'));
        if (configs.custom_agents && configs.custom_agents.length > 0) {
          for (const a of configs.custom_agents) {
            console.log(chalk.green(`  ✓ ${a.id}`));
            console.log(chalk.gray(`    名称: ${a.name}`));
            console.log(chalk.gray(`    文件: ${a.file}`));
            if (a._reason) {
              console.log(chalk.gray(`    原因: ${a._reason}`));
            }
            console.log('');
          }
        } else {
          console.log(chalk.gray('  (无)'));
          console.log('');
        }
      }

      // 显示自定义 Skill
      if (!options.type || options.type === 'skill') {
        console.log(chalk.yellow('自定义 Skill:'));
        if (configs.custom_skills && configs.custom_skills.length > 0) {
          for (const s of configs.custom_skills) {
            console.log(chalk.green(`  ✓ ${s.id}`));
            console.log(chalk.gray(`    名称: ${s.name}`));
            console.log(chalk.gray(`    目录: ${s.directory}`));
            if (s._reason) {
              console.log(chalk.gray(`    原因: ${s._reason}`));
            }
            console.log('');
          }
        } else {
          console.log(chalk.gray('  (无)'));
          console.log('');
        }
      }

      // 显示元数据
      console.log(chalk.yellow('配置信息:'));
      console.log(chalk.gray(`  版本: ${configs.metadata.version}`));
      console.log(chalk.gray(`  创建时间: ${configs.metadata.created_at}`));
      console.log(chalk.gray(`  更新时间: ${configs.metadata.updated_at}`));
      if (configs.metadata.created_by) {
        console.log(chalk.gray(`  创建者: ${configs.metadata.created_by}`));
      }
      if (configs.metadata.description) {
        console.log(chalk.gray(`  描述: ${configs.metadata.description}`));
      }
    } catch (error) {
      console.error(chalk.red(`✗ 列出失败: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// 显示配置详情
configManagerCommand
  .command('show')
  .description('显示配置详情')
  .argument('<id>', '配置 ID')
  .action(async (id: string, projectPath: string) => {
    const projectRoot = path.resolve(projectPath);

    console.log(chalk.blue('🔍 配置详情'));
    console.log('');

    try {
      const manager = new ConfigManager(projectRoot);

      // 尝试查找验证类型
      const validation = await manager.getValidation(id);
      if (validation) {
        console.log(chalk.yellow('验证类型:'));
        console.log(chalk.green(`  ID: ${validation.id}`));
        console.log(chalk.gray(`  名称: ${validation.name}`));
        console.log(chalk.gray(`  描述: ${validation.description || '(无)'}`));
        console.log(chalk.gray(`  Agent: ${validation.agent || '(无)'}`));
        console.log(chalk.gray(`  Skill: ${validation.skill || '(无)'}`));
        console.log(chalk.gray(`  Script: ${validation.script || '(无)'}`));
        console.log(chalk.gray(`  触发方式: ${validation.trigger}`));
        console.log(chalk.gray(`  必需: ${validation.required ? '是' : '否'}`));
        if (validation.timeout) {
          console.log(chalk.gray(`  超时: ${validation.timeout}秒`));
        }
        if (validation.config) {
          console.log(chalk.gray(`  配置: ${JSON.stringify(validation.config, null, 2)}`));
        }
        console.log(chalk.gray(`  创建时间: ${validation._created_at}`));
        if (validation._reason) {
          console.log(chalk.gray(`  原因: ${validation._reason}`));
        }
        if (validation._author) {
          console.log(chalk.gray(`  作者: ${validation._author}`));
        }
        return;
      }

      // 尝试查找 Agent
      const agent = await manager.getAgent(id);
      if (agent) {
        console.log(chalk.yellow('自定义 Agent:'));
        console.log(chalk.green(`  ID: ${agent.id}`));
        console.log(chalk.gray(`  名称: ${agent.name}`));
        console.log(chalk.gray(`  文件: ${agent.file}`));
        if (agent.template) {
          console.log(chalk.gray(`  模板: ${agent.template}`));
        }
        console.log(chalk.gray(`  创建时间: ${agent._created_at}`));
        if (agent._reason) {
          console.log(chalk.gray(`  原因: ${agent._reason}`));
        }
        if (agent._author) {
          console.log(chalk.gray(`  作者: ${agent._author}`));
        }
        return;
      }

      // 尝试查找 Skill
      const skill = await manager.getSkill(id);
      if (skill) {
        console.log(chalk.yellow('自定义 Skill:'));
        console.log(chalk.green(`  ID: ${skill.id}`));
        console.log(chalk.gray(`  名称: ${skill.name}`));
        console.log(chalk.gray(`  目录: ${skill.directory}`));
        if (skill.template) {
          console.log(chalk.gray(`  模板: ${skill.template}`));
        }
        console.log(chalk.gray(`  创建时间: ${skill._created_at}`));
        if (skill._reason) {
          console.log(chalk.gray(`  原因: ${skill._reason}`));
        }
        if (skill._author) {
          console.log(chalk.gray(`  作者: ${skill._author}`));
        }
        return;
      }

      console.log(chalk.yellow(`⚠️  未找到配置: ${id}`));
    } catch (error) {
      console.error(chalk.red(`✗ 显示失败: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
