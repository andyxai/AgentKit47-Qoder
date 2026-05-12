/**
 * 验证编排器
 *
 * 负责：
 * - 加载验证配置
 * - 触发验证执行（Agent/Skill/Script）
 * - 收集验证结果
 * - 结构化归档到 .ak47/changes/<change-id>/validation/
 *
 * 核心原则：ak47 不执行验证逻辑，只负责触发委托 → 收集结果 → 结构化归档
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { stringify, parse } from 'yaml';
import chalk from 'chalk';
import type {
  ValidationConfig,
  ValidationTypeConfig,
  ValidationResult,
  ValidationSummary,
} from './types.js';
import { getAk47Dir, getConfigPath } from '../../utils/paths.js';

export class ValidationOrchestrator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * 在流程中触发验证环节
   *
   * @param changeId - 变更 ID
   * @param options - 选项
   * @returns 验证摘要
   */
  async triggerValidation(
    changeId: string,
    options?: {
      skipManual?: boolean; // 跳过 manual 类型
    }
  ): Promise<ValidationSummary> {
    const config = await this.loadValidationConfig();

    if (!config.enabled) {
      console.log(chalk.gray('  ⊘ 验证功能未启用，跳过'));
      return {
        status: 'skipped',
        reason: 'validation disabled',
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        requiredFailed: 0,
        results: [],
      };
    }

    if (config.types.length === 0) {
      console.log(chalk.gray('  ⊘ 未配置验证类型，跳过'));
      return {
        status: 'skipped',
        reason: 'no validation types configured',
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        requiredFailed: 0,
        results: [],
      };
    }

    console.log(chalk.blue('\n  📋 开始验证数据补充环节...'));

    const results: ValidationResult[] = [];

    for (const type of config.types) {
      // 根据 trigger 类型处理
      if (type.trigger === 'auto') {
        console.log(chalk.gray(`  → 自动执行验证: ${type.name}`));
        const result = await this.executeValidation(changeId, type);
        results.push(result);
        this.printResult(result);
      } else if (type.trigger === 'manual' && !options?.skipManual) {
        // 询问用户是否执行
        const shouldRun = await this.askUserToRunValidation(type);
        if (shouldRun) {
          console.log(chalk.gray(`  → 手动执行验证: ${type.name}`));
          const result = await this.executeValidation(changeId, type);
          results.push(result);
          this.printResult(result);
        } else {
          const skippedResult: ValidationResult = {
            validationType: type.id,
            status: 'skipped',
            timestamp: new Date().toISOString(),
            execution: {
              platform: 'local',
              environment: 'local',
              runner: 'manual',
              duration: 0,
            },
            conclusion: '用户跳过验证',
          };
          results.push(skippedResult);
          console.log(chalk.yellow(`  ⊘ 已跳过: ${type.name}`));
        }
      } else if (type.trigger === 'manual' && options?.skipManual) {
        const skippedResult: ValidationResult = {
          validationType: type.id,
          status: 'skipped',
          timestamp: new Date().toISOString(),
          execution: {
            platform: 'local',
            environment: 'local',
            runner: 'manual',
            duration: 0,
          },
          conclusion: '流程跳过 manual 验证',
        };
        results.push(skippedResult);
      }
    }

    // 归档验证结果
    await this.archiveResults(changeId, results);

    // 检查 required 验证是否通过
    const summary = this.buildSummary(results, config);

    console.log(chalk.blue('\n  ✓ 验证环节完成'));
    console.log(
      chalk.gray(
        `  总计: ${summary.total} | 通过: ${summary.passed} | 失败: ${summary.failed} | 跳过: ${summary.skipped}`
      )
    );

    return summary;
  }

  /**
   * 加载验证配置
   *
   * @returns 验证配置
   */
  private async loadValidationConfig(): Promise<ValidationConfig> {
    try {
      const configPath = getConfigPath(this.projectRoot);

      if (!existsSync(configPath)) {
        return {
          enabled: false,
          types: [],
          on_failure: {
            action: 'warn-and-continue',
            message: '验证未通过，建议修复后重新验证',
          },
        };
      }

      const raw = await readFile(configPath, 'utf-8');
      const config = parse(raw) as Record<string, unknown>;

      // 如果配置中没有 validation 字段，返回默认配置
      if (!config || !config.validation) {
        return {
          enabled: false,
          types: [],
          on_failure: {
            action: 'warn-and-continue',
            message: '验证未通过，建议修复后重新验证',
          },
        };
      }

      return config.validation as ValidationConfig;
    } catch {
      console.warn(chalk.yellow('  ⚠ 加载验证配置失败，使用默认配置'));
      return {
        enabled: false,
        types: [],
        on_failure: {
          action: 'warn-and-continue',
          message: '验证未通过，建议修复后重新验证',
        },
      };
    }
  }

  /**
   * 执行单个验证类型
   *
   * @param changeId - 变更 ID
   * @param type - 验证类型配置
   * @returns 验证结果
   */
  private async executeValidation(
    changeId: string,
    type: ValidationTypeConfig
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // 1. 检查是否有执行器（Agent/Skill/Script）
      if (!type.agent && !type.skill && !type.script) {
        return {
          validationType: type.id,
          status: 'skipped',
          timestamp: new Date().toISOString(),
          execution: {
            platform: 'local',
            environment: 'local',
            runner: 'manual',
            duration: 0,
          },
          conclusion: '未配置执行器，需要用户手动执行',
        };
      }

      // 2. 根据执行器类型分发
      let result: ValidationResult;
      if (type.agent) {
        result = await this.executeViaAgent(changeId, type);
      } else if (type.skill) {
        result = await this.executeViaSkill(changeId, type);
      } else if (type.script) {
        result = await this.executeViaScript(changeId, type);
      } else {
        throw new Error('未找到验证执行器');
      }

      // 更新执行耗时
      result.execution.duration = Math.round((Date.now() - startTime) / 1000);

      return result;
    } catch (_error) {
      return {
        validationType: type.id,
        status: 'error',
        timestamp: new Date().toISOString(),
        execution: {
          platform: 'local',
          environment: 'local',
          runner: type.agent ? 'agent' : type.skill ? 'skill' : 'script',
          duration: Math.round((Date.now() - startTime) / 1000),
        },
        conclusion: '验证执行出错',
        error: _error instanceof Error ? _error.message : String(_error),
      };
    }
  }

  /**
   * 通过 Agent 执行验证
   *
   * @param changeId - 变更 ID
   * @param type - 验证类型配置
   * @returns 验证结果
   */
  private async executeViaAgent(
    changeId: string,
    type: ValidationTypeConfig
  ): Promise<ValidationResult> {
    console.log(chalk.gray(`    启动 Agent [${type.agent}] 执行验证...`));

    // TODO: 实现 Agent 调用逻辑
    // 示例：使用 Agent 工具，传递验证配置
    // const result = await callAgent(type.agent!, {
    //   changeId,
    //   validationType: type.id,
    //   config: type.config
    // });

    // 目前返回占位结果
    return {
      validationType: type.id,
      status: 'skipped',
      timestamp: new Date().toISOString(),
      execution: {
        platform: 'external',
        environment: 'test',
        runner: 'agent',
        agent: type.agent!,
        duration: 0,
      },
      conclusion: 'Agent 执行器待实现',
    };
  }

  /**
   * 通过 Skill 执行验证
   *
   * @param changeId - 变更 ID
   * @param type - 验证类型配置
   * @returns 验证结果
   */
  private async executeViaSkill(
    changeId: string,
    type: ValidationTypeConfig
  ): Promise<ValidationResult> {
    console.log(chalk.gray(`    启动 Skill [${type.skill}] 执行验证...`));

    // TODO: 实现 Skill 调用逻辑

    // 目前返回占位结果
    return {
      validationType: type.id,
      status: 'skipped',
      timestamp: new Date().toISOString(),
      execution: {
        platform: 'local',
        environment: 'local',
        runner: 'skill',
        skill: type.skill!,
        duration: 0,
      },
      conclusion: 'Skill 执行器待实现',
    };
  }

  /**
   * 通过脚本执行验证
   *
   * @param changeId - 变更 ID
   * @param type - 验证类型配置
   * @returns 验证结果
   */
  private async executeViaScript(
    changeId: string,
    type: ValidationTypeConfig
  ): Promise<ValidationResult> {
    console.log(chalk.gray(`    执行脚本 [${type.script}] 验证...`));

    // TODO: 实现脚本执行逻辑
    // 示例：使用 child_process.exec 执行脚本

    // 目前返回占位结果
    return {
      validationType: type.id,
      status: 'skipped',
      timestamp: new Date().toISOString(),
      execution: {
        platform: 'local',
        environment: 'local',
        runner: 'script',
        script: type.script!,
        duration: 0,
      },
      conclusion: '脚本执行器待实现',
    };
  }

  /**
   * 询问用户是否执行验证
   *
   * @param type - 验证类型配置
   * @returns 是否执行
   */
  private async askUserToRunValidation(type: ValidationTypeConfig): Promise<boolean> {
    // TODO: 使用 @inquirer/prompts 实现交互式提示
    // 目前默认返回 true（执行验证）

    console.log(
      chalk.yellow(`  ? 是否需要执行 [${type.name}] 验证？${type.description ? ` (${type.description})` : ''}`)
    );
    console.log(chalk.gray('    (默认执行，交互式提示待实现)'));

    return true;
  }

  /**
   * 归档验证结果
   *
   * @param changeId - 变更 ID
   * @param results - 验证结果列表
   */
  private async archiveResults(
    changeId: string,
    results: ValidationResult[]
  ): Promise<void> {
    const ak47Dir = getAk47Dir(this.projectRoot);
    const validationDir = join(ak47Dir, 'changes', changeId, 'validation');

    // 创建目录
    await mkdir(validationDir, { recursive: true });
    await mkdir(join(validationDir, 'raw-data'), { recursive: true });
    await mkdir(join(validationDir, 'screenshots'), { recursive: true });

    // 构建归档数据结构
    const archiveData = {
      change_id: changeId,
      timestamp: new Date().toISOString(),
      validations: results.map((r) => this.resultToArchiveFormat(r)),
    };

    // 写入 results.yaml
    const resultsYaml = stringify(archiveData);
    await writeFile(join(validationDir, 'results.yaml'), resultsYaml, 'utf-8');

    console.log(chalk.gray(`  ✓ 验证结果已归档到: ${validationDir}`));
  }

  /**
   * 将验证结果转换为归档格式
   *
   * @param result - 验证结果
   * @returns 归档格式数据
   */
  private resultToArchiveFormat(result: ValidationResult): Record<string, unknown> {
    const execArchive: Record<string, unknown> = {
      platform: result.execution.platform,
      environment: result.execution.environment,
      runner: result.execution.runner,
      duration: result.execution.duration,
    };

    const archive: Record<string, unknown> = {
      validation_type: result.validationType,
      status: result.status,
      execution: execArchive,
      conclusion: result.conclusion,
    };

    // 添加可选字段
    if (result.execution.agent) {
      execArchive.agent = result.execution.agent;
    }
    if (result.execution.skill) {
      execArchive.skill = result.execution.skill;
    }
    if (result.execution.script) {
      execArchive.script = result.execution.script;
    }
    if (result.metrics) {
      archive.metrics = result.metrics;
    }
    if (result.functionality) {
      archive.functionality = {
        total_cases: result.functionality.totalCases,
        passed: result.functionality.passed,
        failed: result.functionality.failed,
        skipped: result.functionality.skipped,
        details: result.functionality.details.map((d) => ({
          case: d.case,
          status: d.status,
          platform: d.platform,
          error: d.error,
          screenshot: d.screenshot,
        })),
      };
    }
    if (result.rawData) {
      archive.raw_data = result.rawData;
    }
    if (result.screenshots) {
      archive.screenshots = result.screenshots;
    }
    if (result.logs) {
      archive.logs = result.logs;
    }
    if (result.error) {
      archive.error = result.error;
    }

    return archive;
  }

  /**
   * 构建验证摘要
   *
   * @param results - 验证结果列表
   * @param config - 验证配置
   * @returns 验证摘要
   */
  private buildSummary(
    results: ValidationResult[],
    config: ValidationConfig
  ): ValidationSummary {
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;

    // 检查 required 验证是否通过
    const requiredFailed = results.filter(
      (r) =>
        r.status === 'failed' &&
        config.types.find((t) => t.id === r.validationType)?.required
    ).length;

    return {
      total: results.length,
      passed,
      failed,
      skipped,
      requiredFailed,
      status: requiredFailed > 0 ? 'failed' : 'passed',
      results,
    };
  }

  /**
   * 打印单个验证结果
   *
   * @param result - 验证结果
   */
  private printResult(result: ValidationResult): void {
    const icon =
      result.status === 'passed'
        ? chalk.green('✓')
        : result.status === 'failed'
          ? chalk.red('✗')
          : result.status === 'error'
            ? chalk.red('⚠')
            : chalk.yellow('⊘');

    console.log(`    ${icon} ${result.validationType}: ${result.conclusion}`);
  }
}
