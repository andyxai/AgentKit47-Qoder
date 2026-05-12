/**
 * Hook 配置数据准备器
 * 
 * 负责准备模板渲染所需的 Hook 数据结构
 */

import { HookDefinition } from './platform-adapters/hook-generator.js';

/**
 * 按事件分组的 Hook 数据（用于模板渲染）
 */
interface HookGroup {
  event: string;
  matcher: string;
  type: string;
  command: string;
  timeout?: number;
  hasNext: boolean;  // 用于模板中的逗号控制
}

/**
 * 准备 Qoder 平台的 Hook 模板数据
 * 
 * Qoder 格式：matcher 在外部，hooks 是嵌套数组
 */
export function prepareQoderHookData(hooks: HookDefinition[]): { hooks: HookGroup[] } {
  // 按事件和 matcher 分组
  const grouped = new Map<string, HookGroup[]>();
  
  for (const hook of hooks) {
    const key = hook.event;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    
    const group = grouped.get(key)!;
    group.push({
      event: hook.event,
      matcher: hook.matcher || '*',
      type: hook.type || 'command',
      command: hook.command,
      timeout: hook.timeout,
      hasNext: false, // 稍后计算
    });
  }
  
  // 计算 hasNext - 扁平化所有组，并标记每个事件组的最后一个元素
  const result: HookGroup[] = [];
  const eventKeys = Array.from(grouped.keys());
  
  eventKeys.forEach((event, eventIndex) => {
    const groups = grouped.get(event)!;
    const isLastEvent = eventIndex === eventKeys.length - 1;
    
    groups.forEach((group, groupIndex) => {
      // 如果是该事件组的最后一个，且是最后一个事件组，则 hasNext = false
      // 否则 hasNext = true
      const isLastInGroup = groupIndex === groups.length - 1;
      group.hasNext = !(isLastInGroup && isLastEvent);
      result.push(group);
    });
  });
  
  return { hooks: result };
}

/**
 * 准备 Claude Code 平台的 Hook 模板数据
 * 
 * Claude Code 格式：平铺结构，matcher 在内部
 */
export function prepareClaudeHookData(hooks: HookDefinition[]): { hooks: HookGroup[] } {
  const result: HookGroup[] = hooks.map((hook, index) => ({
    event: hook.event,
    matcher: hook.matcher || '',
    type: hook.type || 'command',
    command: hook.command,
    timeout: hook.timeout,
    hasNext: index < hooks.length - 1,
  }));
  
  return { hooks: result };
}
