/**
 * 平台适配器接口
 * 
 * 定义将标准格式（Claude Code 格式）转换为各平台特定格式的契约
 */

export interface SkillStandard {
  /** 技能名称 */
  name: string;
  /** 技能描述 */
  description: string;
  /** 版本号 */
  version?: string;
  /** 完整内容（Markdown） */
  content: string;
  /** 前端元数据（YAML frontmatter 解析后） */
  frontmatter: Record<string, unknown>;
  /** Markdown 正文 */
  body: string;
}

export interface PlatformOutput {
  /** 平台名称 */
  platform: string;
  /** 输出内容 */
  content: string;
  /** 目标文件路径 */
  targetPath: string;
}

/**
 * 平台适配器接口
 */
export interface PlatformAdapter {
  /** 平台名称 */
  readonly platform: string;
  
  /**
   * 将标准格式转换为平台特定格式
   * @param standard 标准格式技能
   * @returns 平台特定格式输出
   */
  convert(standard: SkillStandard): PlatformOutput;
  
  /**
   * 生成平台特定的文件结构
   * @param outputs 转换后的输出列表
   * @returns 文件计划
   */
  generateFiles(outputs: PlatformOutput[]): FilePlan[];
}

/**
 * 文件计划
 */
export interface FilePlan {
  /** 文件路径 */
  path: string;
  /** 文件内容 */
  content: string;
  /** 文件类型 */
  type: 'skill' | 'agent' | 'hook' | 'config';
}
