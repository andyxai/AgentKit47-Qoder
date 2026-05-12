/**
 * 偏离记录器
 * 
 * 记录 AI 偏离标准流程的行为，便于追溯和分析
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DeviationRecord {
  /** ISO 8601 时间戳 */
  timestamp: string;
  /** 会话 ID */
  session?: string;
  /** 偏离行为描述 */
  deviation: string;
  /** 违反的规则 */
  ruleViolated?: string;
  /** 偏离原因 */
  reason: string;
  /** 影响级别 */
  impact: 'low' | 'medium' | 'high';
  /** 用户是否批准 */
  userApproval: boolean;
  /** 考虑过的替代方案 */
  alternativesConsidered?: string;
  /** 缓解措施 */
  mitigation?: string;
}

export class DeviationLogger {
  private logPath: string;
  private records: DeviationRecord[];

  constructor(projectRoot: string) {
    const ak47Dir = path.join(projectRoot, '.ak47');
    this.logPath = path.join(ak47Dir, 'deviations.log');
    this.records = [];

    // 确保 .ak47 目录存在
    if (!fs.existsSync(ak47Dir)) {
      fs.mkdirSync(ak47Dir, { recursive: true });
    }

    // 加载现有记录
    this.loadRecords();
  }

  /**
   * 记录偏离
   */
  log(record: Omit<DeviationRecord, 'timestamp'>): void {
    const fullRecord: DeviationRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    };

    this.records.push(fullRecord);
    this.saveRecords();

    // 高影响偏离给出警告
    if (record.impact === 'high') {
      console.warn(
        `⚠️  [高影响偏离] ${record.deviation}\n` +
        `   原因: ${record.reason}\n` +
        `   已记录到: ${this.logPath}`
      );
    }
  }

  /**
   * 获取最近的偏离记录
   */
  getRecent(count: number = 10): DeviationRecord[] {
    return this.records.slice(-count);
  }

  /**
   * 统计偏离影响级别分布
   */
  getImpactStats(): Record<string, number> {
    const stats: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    for (const record of this.records) {
      stats[record.impact]++;
    }

    return stats;
  }

  /**
   * 获取高频偏离原因
   */
  getTopReasons(count: number = 10): Array<{ reason: string; count: number }> {
    const reasonMap = new Map<string, number>();

    for (const record of this.records) {
      reasonMap.set(record.reason, (reasonMap.get(record.reason) || 0) + 1);
    }

    return Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
  }

  /**
   * 加载现有记录
   */
  private loadRecords(): void {
    if (!fs.existsSync(this.logPath)) {
      this.records = [];
      return;
    }

    try {
      const content = fs.readFileSync(this.logPath, 'utf-8');
      // 简单的 YAML 解析（实际项目应使用 js-yaml）
      // 这里只做基础解析
      this.records = this.parseYamlArray(content);
    } catch {
      console.warn(`警告: 无法加载偏离记录文件: ${this.logPath}`);
      this.records = [];
    }
  }

  /**
   * 保存记录
   */
  private saveRecords(): void {
    try {
      const content = this.recordsToYaml();
      fs.writeFileSync(this.logPath, content, 'utf-8');
    } catch (_error) {
      console.error(`错误: 无法保存偏离记录: ${this.logPath}`);
      throw _error;
    }
  }

  /**
   * 将记录转换为 YAML 格式
   */
  private recordsToYaml(): string {
    if (this.records.length === 0) {
      return '# 偏离记录\n# 暂无记录\n';
    }

    return this.records.map(record => {
      const lines = [
        `- timestamp: "${record.timestamp}"`,
        `  deviation: "${this.escapeYaml(record.deviation)}"`,
        `  reason: "${this.escapeYaml(record.reason)}"`,
        `  impact: ${record.impact}`,
        `  user_approval: ${record.userApproval}`,
      ];

      if (record.session) {
        lines.splice(1, 0, `  session: "${record.session}"`);
      }
      if (record.ruleViolated) {
        lines.push(`  rule_violated: "${this.escapeYaml(record.ruleViolated)}"`);
      }
      if (record.alternativesConsidered) {
        lines.push(`  alternatives_considered: "${this.escapeYaml(record.alternativesConsidered)}"`);
      }
      if (record.mitigation) {
        lines.push(`  mitigation: "${this.escapeYaml(record.mitigation)}"`);
      }

      return lines.join('\n');
    }).join('\n\n') + '\n';
  }

  /**
   * 简单的 YAML 数组解析
   */
  private parseYamlArray(content: string): DeviationRecord[] {
    // 简化的解析逻辑，实际项目应使用 js-yaml
    const records: DeviationRecord[] = [];
    const blocks = content.split(/^- /).filter(Boolean);

    for (const block of blocks) {
      const record: Record<string, string> = {};
      const lines = block.split('\n');

      for (const line of lines) {
        const match = line.match(/^\s*(\w+):\s*"?(.*?)"?\s*$/);
        if (match) {
          const [, key, value] = match;
          const normalizedKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          record[normalizedKey] = value;
        }
      }

      if (record.timestamp && record.deviation) {
        records.push(record as unknown as DeviationRecord);
      }
    }

    return records;
  }

  /**
   * 转义 YAML 字符串
   */
  private escapeYaml(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}
