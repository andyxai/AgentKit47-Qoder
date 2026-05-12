/**
 * 规则执行器
 * 
 * 检查 AI 行为是否遵守项目规则，并在偏离时给出建议
 */

import * as fs from 'fs';
import * as path from 'path';
import { DeviationLogger } from './deviation-logger.js';

export type RuleLevel = 'hard' | 'strong' | 'suggestion';

export interface Rule {
  /** 规则 ID */
  id: string;
  /** 规则描述 */
  description: string;
  /** 规则级别 */
  level: RuleLevel;
  /** 检查函数 */
  check: (context: RuleCheckContext) => boolean | Promise<boolean>;
  /** 偏离时的建议 */
  suggestion?: string;
}

export interface RuleCheckContext {
  /** 项目根目录 */
  projectRoot: string;
  /** 当前会话 ID */
  sessionId?: string;
  /** 附加上下文（可选） */
  [key: string]: unknown;
}

export interface RuleViolation {
  /** 违反的规则 */
  rule: Rule;
  /** 偏离描述 */
  deviation: string;
  /** 建议的操作 */
  suggestion?: string;
}

export class RulesEnforcer {
  private rules: Rule[];
  private deviationLogger: DeviationLogger;

  constructor(projectRoot: string) {
    this.rules = [];
    this.deviationLogger = new DeviationLogger(projectRoot);
  }

  /**
   * 注册规则
   */
  registerRule(rule: Rule): void {
    this.rules.push(rule);
  }

  /**
   * 注册默认规则
   */
  registerDefaultRules(): void {
    // 硬规则：没有 Spec 不得编写代码
    this.registerRule({
      id: 'no-spec-no-code',
      description: '没有 Spec 不得编写代码',
      level: 'hard',
      check: async (context: RuleCheckContext) => {
        // 检查 openspec 目录是否存在 Spec
        const openspecDir = path.join(context.projectRoot, 'openspec');
        if (!fs.existsSync(openspecDir)) {
          return false;
        }

        const changesDir = path.join(openspecDir, 'changes');
        if (!fs.existsSync(changesDir)) {
          return false;
        }

        // 检查是否有进行中的变更
        const changes = fs.readdirSync(changesDir);
        return changes.length > 0;
      },
      suggestion: '使用 /opsx:propose 或 openspec propose 创建 Spec',
    });

    // 强建议：使用 brainstorming 开始创造性工作
    this.registerRule({
      id: 'use-brainstorming',
      description: '使用 brainstorming 开始创造性工作',
      level: 'strong',
      check: () => {
        // 这个规则需要 AI Agent 在会话中自行检查
        // 这里只作为占位
        return true;
      },
      suggestion: '在实施前使用 /brainstorm 进行构思',
    });

    // 强建议：使用 TDD 流程
    this.registerRule({
      id: 'use-tdd',
      description: '使用 TDD 流程',
      level: 'strong',
      check: () => {
        // 这个规则需要 AI Agent 在写代码前检查是否有测试
        return true;
      },
      suggestion: '遵循 RED → GREEN → REFACTOR 循环',
    });

    // 硬规则：文档必须标注引用来源
    this.registerRule({
      id: 'doc-must-cite-sources',
      description: '文档和配置必须标注官方引用来源',
      level: 'hard',
      check: async (context: RuleCheckContext) => {
        // 检查 docs/research/ 目录是否有研究文档
        const researchDir = path.join(context.projectRoot, 'docs', 'research');
        if (!fs.existsSync(researchDir)) {
          return true; // 没有研究文档目录，不检查
        }

        // 检查是否有研究文档（.md 或 .txt）
        const files = fs.readdirSync(researchDir);
        const hasResearchDocs = files.some(f => 
          f.endsWith('.md') || f.endsWith('.txt')
        );
        
        // 检查研究文档是否包含 URL 和原文
        if (hasResearchDocs) {
          for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.txt')) {
              const filePath = path.join(researchDir, file);
              const content = fs.readFileSync(filePath, 'utf-8');
              
              // 检查是否包含 URL
              const hasUrl = /https?:\/\//.test(content);
              // 检查是否包含原文标记
              const hasOriginalText = /原文|official|from docs|copy/i.test(content);
              
              if (hasUrl && hasOriginalText) {
                return true; // 找到合格的研究文档
              }
            }
          }
        }
        
        return false; // 没有合格的研究文档
      },
      suggestion: '使用任何可用工具查阅官方文档，保存关键内容到 docs/research/',
    });
  }

  /**
   * 检查所有规则
   */
  async checkAllRules(context: RuleCheckContext): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];

    for (const rule of this.rules) {
      try {
        const passed = await rule.check(context);
        if (!passed) {
          violations.push({
            rule,
            deviation: `违反规则: ${rule.description}`,
            suggestion: rule.suggestion,
          });
        }
      } catch (error) {
        console.warn(`规则检查失败 [${rule.id}]: ${error}`);
      }
    }

    return violations;
  }

  /**
   * 处理规则违反
   */
  async handleViolation(
    violation: RuleViolation,
    context: RuleCheckContext,
    forceProceed: boolean = false
  ): Promise<void> {
    const { rule, deviation, suggestion } = violation;

    if (rule.level === 'hard') {
      if (!forceProceed) {
        // 硬规则：阻止执行
        console.error(`❌ [硬规则违反] ${deviation}`);
        if (suggestion) {
          console.error(`   建议: ${suggestion}`);
        }
        throw new Error(`违反硬规则: ${rule.description}`);
      } else {
        // 用户强制继续，记录偏离
        console.warn(`⚠️  [硬规则违反-用户强制继续] ${deviation}`);
        this.deviationLogger.log({
          session: context.sessionId,
          deviation,
          ruleViolated: rule.description,
          reason: '用户强制继续',
          impact: 'high',
          userApproval: true,
          mitigation: suggestion,
        });
      }
    }

    if (rule.level === 'strong') {
      // 强建议：警告并记录
      console.warn(`⚠️  [偏离强建议] ${deviation}`);
      if (suggestion) {
        console.warn(`   建议: ${suggestion}`);
      }

      // 记录偏离
      this.deviationLogger.log({
        session: context.sessionId,
        deviation,
        ruleViolated: rule.description,
        reason: forceProceed ? '用户强制继续' : '未明确说明',
        impact: 'medium',
        userApproval: forceProceed,
        mitigation: suggestion,
      });
    }

    if (rule.level === 'suggestion') {
      // 建议：提示但不阻止
      console.log(`💡 [建议] ${deviation}`);
      if (suggestion) {
        console.log(`   建议: ${suggestion}`);
      }
    }
  }

  /**
   * 获取偏离统计
   */
  getDeviationStats() {
    return {
      impact: this.deviationLogger.getImpactStats(),
      topReasons: this.deviationLogger.getTopReasons(5),
      recent: this.deviationLogger.getRecent(5),
    };
  }
}
