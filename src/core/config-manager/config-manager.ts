/**
 * Config Manager 核心逻辑
 *
 * 提供用户自定义配置的增删改查能力
 */

import { loadCustomConfigs, saveCustomConfigs, initCustomConfigs } from './custom-config-loader.js';
import type {
  CustomConfigs,
  CustomValidationType,
  CustomAgentDef,
  CustomSkillDef,
} from './types.js';

/** 添加验证类型选项 */
export interface AddValidationOptions {
  /** 验证类型 ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** Agent 名称 */
  agent?: string;
  /** Skill 名称 */
  skill?: string;
  /** 脚本路径 */
  script?: string;
  /** 触发方式 */
  trigger: 'auto' | 'manual';
  /** 是否必需 */
  required: boolean;
  /** 超时时间 */
  timeout?: number;
  /** 配置参数 */
  config?: Record<string, unknown>;
  /** 修改原因 */
  reason?: string;
  /** 作者 */
  author?: string;
}

/** 添加 Agent 选项 */
export interface AddAgentOptions {
  /** Agent ID */
  id: string;
  /** Agent 名称 */
  name: string;
  /** 文件路径 */
  file: string;
  /** 模板名称 */
  template?: string;
  /** 修改原因 */
  reason?: string;
  /** 作者 */
  author?: string;
}

/** 添加 Skill 选项 */
export interface AddSkillOptions {
  /** Skill ID */
  id: string;
  /** Skill 名称 */
  name: string;
  /** 目录路径 */
  directory: string;
  /** 模板名称 */
  template?: string;
  /** 修改原因 */
  reason?: string;
  /** 作者 */
  author?: string;
}

export class ConfigManager {
  private projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
  }

  /**
   * 添加自定义验证类型
   */
  async addValidation(options: AddValidationOptions): Promise<CustomValidationType> {
    const configs = await this.ensureConfigs();

    // 检查是否已存在
    const existing = configs.validation?.types.find((t) => t.id === options.id);
    if (existing) {
      throw new Error(`验证类型已存在: ${options.id}`);
    }

    const now = new Date().toISOString();
    const validationType: CustomValidationType = {
      id: options.id,
      name: options.name,
      description: options.description,
      agent: options.agent,
      skill: options.skill,
      script: options.script,
      trigger: options.trigger,
      required: options.required,
      timeout: options.timeout,
      config: options.config,
      // 自定义标记
      _custom: true,
      _created_at: now,
      _reason: options.reason,
      _author: options.author,
    };

    if (!configs.validation) {
      configs.validation = { enabled: true, types: [] };
    }
    configs.validation.types.push(validationType);
    configs.validation.enabled = true;

    await saveCustomConfigs(this.projectDir, configs);

    return validationType;
  }

  /**
   * 添加自定义 Agent
   */
  async addAgent(options: AddAgentOptions): Promise<CustomAgentDef> {
    const configs = await this.ensureConfigs();

    // 检查是否已存在
    const existing = configs.custom_agents?.find((a) => a.id === options.id);
    if (existing) {
      throw new Error(`Agent 已存在: ${options.id}`);
    }

    const now = new Date().toISOString();
    const agent: CustomAgentDef = {
      id: options.id,
      name: options.name,
      file: options.file,
      template: options.template,
      // 自定义标记
      _custom: true,
      _created_at: now,
      _reason: options.reason,
      _author: options.author,
    };

    if (!configs.custom_agents) {
      configs.custom_agents = [];
    }
    configs.custom_agents.push(agent);

    await saveCustomConfigs(this.projectDir, configs);

    return agent;
  }

  /**
   * 添加自定义 Skill
   */
  async addSkill(options: AddSkillOptions): Promise<CustomSkillDef> {
    const configs = await this.ensureConfigs();

    // 检查是否已存在
    const existing = configs.custom_skills?.find((s) => s.id === options.id);
    if (existing) {
      throw new Error(`Skill 已存在: ${options.id}`);
    }

    const now = new Date().toISOString();
    const skill: CustomSkillDef = {
      id: options.id,
      name: options.name,
      directory: options.directory,
      template: options.template,
      // 自定义标记
      _custom: true,
      _created_at: now,
      _reason: options.reason,
      _author: options.author,
    };

    if (!configs.custom_skills) {
      configs.custom_skills = [];
    }
    configs.custom_skills.push(skill);

    await saveCustomConfigs(this.projectDir, configs);

    return skill;
  }

  /**
   * 列出所有自定义配置
   */
  async listConfigs(): Promise<CustomConfigs> {
    const configs = await loadCustomConfigs(this.projectDir);
    if (!configs) {
      return {
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        validation: { enabled: false, types: [] },
        custom_agents: [],
        custom_skills: [],
      };
    }
    return configs;
  }

  /**
   * 获取指定验证类型详情
   */
  async getValidation(id: string): Promise<CustomValidationType | null> {
    const configs = await loadCustomConfigs(this.projectDir);
    if (!configs || !configs.validation) {
      return null;
    }

    return configs.validation.types.find((t) => t.id === id) || null;
  }

  /**
   * 获取指定 Agent 详情
   */
  async getAgent(id: string): Promise<CustomAgentDef | null> {
    const configs = await loadCustomConfigs(this.projectDir);
    if (!configs || !configs.custom_agents) {
      return null;
    }

    return configs.custom_agents.find((a) => a.id === id) || null;
  }

  /**
   * 获取指定 Skill 详情
   */
  async getSkill(id: string): Promise<CustomSkillDef | null> {
    const configs = await loadCustomConfigs(this.projectDir);
    if (!configs || !configs.custom_skills) {
      return null;
    }

    return configs.custom_skills.find((s) => s.id === id) || null;
  }

  /**
   * 删除验证类型
   */
  async deleteValidation(id: string): Promise<boolean> {
    const configs = await this.ensureConfigs();
    if (!configs.validation) {
      return false;
    }

    const index = configs.validation.types.findIndex((t) => t.id === id);
    if (index === -1) {
      return false;
    }

    configs.validation.types.splice(index, 1);
    await saveCustomConfigs(this.projectDir, configs);

    return true;
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(id: string): Promise<boolean> {
    const configs = await this.ensureConfigs();
    if (!configs.custom_agents) {
      return false;
    }

    const index = configs.custom_agents.findIndex((a) => a.id === id);
    if (index === -1) {
      return false;
    }

    configs.custom_agents.splice(index, 1);
    await saveCustomConfigs(this.projectDir, configs);

    return true;
  }

  /**
   * 删除 Skill
   */
  async deleteSkill(id: string): Promise<boolean> {
    const configs = await this.ensureConfigs();
    if (!configs.custom_skills) {
      return false;
    }

    const index = configs.custom_skills.findIndex((s) => s.id === id);
    if (index === -1) {
      return false;
    }

    configs.custom_skills.splice(index, 1);
    await saveCustomConfigs(this.projectDir, configs);

    return true;
  }

  /**
   * 确保配置存在（如果不存在则初始化）
   */
  private async ensureConfigs(): Promise<CustomConfigs> {
    const configs = await loadCustomConfigs(this.projectDir);
    if (!configs) {
      await initCustomConfigs(this.projectDir);
      const newConfigs = await loadCustomConfigs(this.projectDir);
      if (!newConfigs) {
        throw new Error('初始化自定义配置失败');
      }
      return newConfigs;
    }
    return configs;
  }
}
