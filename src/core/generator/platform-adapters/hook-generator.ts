/**
 * Hook 配置生成器
 * 
 * 基于官方文档生成平台特定的 Hook 配置
 * 
 * 官方文档参考：
 * - Qoder: https://docs.qoder.com/extensions/hooks
 * - Claude Code: https://code.claude.com/docs/en/hooks
 * - OpenCode: https://opencode.ai/docs/plugins/ (使用 Plugin 系统)
 */

import * as fs from 'fs';
import * as path from 'path';
import { readTemplate } from '../../../utils/template-path.js';

/**
 * Qoder 支持的 Hook 事件（5个）
 * 官方文档：https://docs.qoder.com/extensions/hooks
 */
export type QoderHookEvent = 'UserPromptSubmit' | 'PreToolUse' | 'PostToolUse' | 'PostToolUseFailure' | 'Stop';

/**
 * Claude Code 支持的 Hook 事件（25+个）
 * 官方文档：https://code.claude.com/docs/en/hooks
 */
export type ClaudeHookEvent = 
  | 'SessionStart' | 'SessionEnd'
  | 'UserPromptSubmit' | 'Stop'
  | 'PreToolUse' | 'PostToolUse'
  | 'FileChanged' | 'ConfigChange'
  | 'Notification'
  | string; // 支持更多事件

/**
 * Hook 配置定义（基于官方格式）
 */
export interface HookDefinition {
  /** Hook 事件 */
  event: QoderHookEvent | ClaudeHookEvent;
  /** 匹配器（工具名称正则） */
  matcher?: string;
  /** 要执行的命令（shell 脚本） */
  command: string;
  /** Hook 类型 */
  type?: 'command' | 'notification' | 'bash';
  /** 超时秒数（Qoder 支持） */
  timeout?: number;
}

/**
 * 平台 Hook 适配器接口
 */
export interface HookAdapter {
  /** 平台名称 */
  readonly platform: string;
  
  /**
   * 生成平台特定的 Hook 配置文件
   * @param hooks Hook 定义列表
   * @returns 配置文件内容
   */
  generate(hooks: HookDefinition[]): string;
  
  /**
   * 获取配置文件路径
   * @param projectRoot 项目根目录
   * @returns 配置文件完整路径
   */
  getConfigPath(projectRoot: string): string;
}

/**
 * Qoder Hook 适配器
 * 
 * 生成 .qoder/settings.json 格式
 * 官方文档：https://docs.qoder.com/extensions/hooks
 */
/**
 * Qoder Hook 适配器
 * 
 * 策略：直接拷贝预配置的 settings-full.json
 */
export class QoderHookAdapter implements HookAdapter {
  readonly platform = 'qoder';
  
  generate(_hooks: HookDefinition[]): string {
    // 直接读取预配置的完整 settings.json
    // 包含 PreToolUse、PostToolUse、SessionStart 所有 Hook
    return readTemplate('platforms/qoder/settings-full.json');
  }
  
  getConfigPath(_projectRoot: string): string {
    return path.join(_projectRoot, '.qoder', 'settings.json');
  }
}

/**
 * Hook 配置生成器
 */
export class HookGenerator {
  private adapters: Map<string, HookAdapter>;
  
  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }
  
  /**
   * 注册默认适配器
   */
  private registerDefaultAdapters(): void {
    this.adapters.set('qoder', new QoderHookAdapter());
  }
  
  /**
   * 注册自定义适配器
   */
  registerAdapter(platform: string, adapter: HookAdapter): void {
    this.adapters.set(platform, adapter);
  }
  
  /**
   * 生成 Hook 配置文件
   * @param platform 平台名称
   * @param hooks Hook 定义列表
   * @param projectRoot 项目根目录
   */
  generate(platform: string, hooks: HookDefinition[], _projectRoot: string): string {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Unsupported platform: ${platform}. Supported: ${Array.from(this.adapters.keys()).join(', ')}`);
    }
    
    return adapter.generate(hooks);
  }
  
  /**
   * 写入 Hook 配置文件
   * @param platform 平台名称
   * @param hooks Hook 定义列表
   * @param projectRoot 项目根目录
   */
  async write(platform: string, hooks: HookDefinition[], projectRoot: string): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    const configPath = adapter.getConfigPath(projectRoot);
    const configDir = path.dirname(configPath);
    
    // 确保目录存在
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const content = this.generate(platform, hooks, projectRoot);
    fs.writeFileSync(configPath, content, 'utf-8');
    
    console.log(`✓ 已生成 Hook 配置: ${configPath}`);
  }
  
  /**
   * 生成默认 Hook 配置（基于 ak47 规范化规则）
   * 
   * 注意：不同平台支持的事件不同
   * - Qoder: 仅支持 5 个事件（PreToolUse, PostToolUse 等）
   * - Claude Code: 支持 25+ 个事件（包括 SessionStart）
   */
  getDefaultHooks(): HookDefinition[] {
    return [
      {
        // PreToolUse: 在工具使用前检查
        // Qoder: ✅ 支持 | Claude Code: ✅ 支持
        event: 'PreToolUse',
        matcher: 'Bash',
        command: `#!/bin/bash
# 检查是否有对应的 Spec
TOOL_INPUT=$(cat)
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# 如果是写文件操作，检查是否有 Spec
if echo "$FILE_PATH" | grep -q '\\.'; then
  if ! ls openspec/changes/*/spec.md 1>/dev/null 2>&1; then
    echo "❌ 违反硬规则：没有 Spec 不得编写代码"
    echo "请先创建 Spec：/opsx:propose 或 openspec propose"
    exit 1
  fi
fi`,
        type: 'command',
      },
      {
        // PostToolUse: 在工具使用后检查
        // Qoder: ✅ 支持 | Claude Code: ✅ 支持
        event: 'PostToolUse',
        matcher: 'Edit|Write',
        command: `#!/bin/bash
# 检查是否编写了测试
TOOL_INPUT=$(cat)
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# 如果写了代码文件（非测试文件）
if echo "$FILE_PATH" | grep -q '\\(ts|js|py|go\\)$' && ! echo "$FILE_PATH" | grep -q '\\(test|spec\\)\\.'; then
  # 检查是否有对应的测试文件
  TEST_FILE=$(echo "$FILE_PATH" | sed 's/\\\\.ts$/.test.ts/' | sed 's/\\\\.js$/.test.js/')
  
  if [ ! -f "$TEST_FILE" ]; then
    echo "⚠️  偏离强建议：没有编写测试"
    echo "建议遵循 TDD 流程（RED → GREEN → REFACTOR）"
    
    # 记录偏离
    if [ -d ".ak47" ]; then
      echo "- timestamp: \\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\\"" >> .ak47/deviations.log
      echo "  deviation: \\"没有编写测试直接实现\\"" >> .ak47/deviations.log
      echo "  rule_violated: \\"使用 TDD 流程\\"" >> .ak47/deviations.log
      echo "  reason: \\"未明确说明\\"" >> .ak47/deviations.log
      echo "  impact: \\"medium\\"" >> .ak47/deviations.log
      echo "  user_approval: true" >> .ak47/deviations.log
      echo "📝 已记录到 .ak47/deviations.log"
    fi
  fi
fi`,
        type: 'command',
      },
      {
        // PostToolUse: 检查文档真实性
        // Qoder: ✅ 支持 | Claude Code: ✅ 支持
        event: 'PostToolUse',
        matcher: 'Write',
        command: `#!/bin/bash
# 检查新创建的文档是否标注了研究来源
TOOL_INPUT=$(cat)
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# 如果是文档文件（.md）
if echo "$FILE_PATH" | grep -q '\\.md$'; then
  # 检查是否包含研究文档引用或官方文档链接
  HAS_RESEARCH_REF=$(grep -c 'docs/research/' "$FILE_PATH" 2>/dev/null || echo "0")
  HAS_DOC_URL=$(grep -c 'https://docs\\.' "$FILE_PATH" 2>/dev/null || echo "0")
  
  if [ "$HAS_RESEARCH_REF" -eq 0 ] && [ "$HAS_DOC_URL" -eq 0 ]; then
    echo "⚠️  警告：文档可能缺少官方引用来源"
    echo "建议："
    echo "  1. 使用任何可用工具查阅官方文档"
    echo "  2. 保存关键内容到 docs/research/<topic>.md"
    echo "  3. 在文档中引用研究文件或官方 URL"
    echo "规则：禁止臆想配置和 API"
    
    # 记录偏离
    if [ -d ".ak47" ]; then
      echo "- timestamp: \\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\\"" >> .ak47/deviations.log
      echo "  deviation: \\"创建文档未标注官方引用\\"" >> .ak47/deviations.log
      echo "  rule_violated: \\"禁止臆想配置和 API\\"" >> .ak47/deviations.log
      echo "  reason: \\"待验证\\"" >> .ak47/deviations.log
      echo "  impact: \\"high\\"" >> .ak47/deviations.log
      echo "  user_approval: true" >> .ak47/deviations.log
      echo "📝 已记录到 .ak47/deviations.log"
    fi
  fi
fi`,
        type: 'command',
      },
    ];
  }
}
