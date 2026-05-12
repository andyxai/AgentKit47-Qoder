/**
 * Claude Code / Qoder 平台适配器
 * 
 * Claude Code 和 Qoder 使用相同的 Skill 格式（YAML frontmatter + Markdown）
 * 因此这个适配器几乎零转换，只需添加可选的 version 字段
 */

import { PlatformAdapter, SkillStandard, PlatformOutput, FilePlan } from './types.js';

export class ClaudeQoderAdapter implements PlatformAdapter {
  readonly platform = 'claude-qoder';
  
  /**
   * 转换为 Claude Code / Qoder 格式
   * 
   * 由于标准格式就是基于 Claude Code 格式，这里几乎零转换
   * 只需要确保 frontmatter 包含必要的字段
   */
  convert(standard: SkillStandard): PlatformOutput {
    // 构建 frontmatter
    const frontmatter: Record<string, unknown> = {
      name: standard.name,
      description: standard.description,
    };
    
    // 如果有版本号，添加（Qoder 支持）
    if (standard.version) {
      frontmatter.version = standard.version;
    }
    
    // 如果有额外的 frontmatter 字段，合并
    if (standard.frontmatter) {
      Object.assign(frontmatter, standard.frontmatter);
    }
    
    // 生成完整的 Markdown 内容
    const content = `---
${this.dumpYaml(frontmatter)}---

${standard.body}`;
    
    // 目标路径
    const targetPath = `skills/${standard.name}.md`;
    
    return {
      platform: this.platform,
      content,
      targetPath,
    };
  }
  
  /**
   * 生成文件计划
   */
  generateFiles(outputs: PlatformOutput[]): FilePlan[] {
    return outputs.map(output => ({
      path: output.targetPath,
      content: output.content,
      type: 'skill',
    }));
  }
  
  /**
   * 简单的 YAML dump（仅支持一层对象）
   * 
   * 实际项目中建议使用 js-yaml 库
   */
  private dumpYaml(obj: Record<string, unknown>): string {
    return Object.entries(obj)
      .map(([key, value]) => {
        // 字符串值需要引号（如果包含特殊字符）
        if (typeof value === 'string') {
          if (value.includes(':') || value.includes('#') || value.includes('"')) {
            return `${key}: "${value.replace(/"/g, '\\"')}"`;
          }
          return `${key}: ${value}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n') + '\n';
  }
}
