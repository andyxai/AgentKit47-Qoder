import Mustache from 'mustache';
import { readFile } from 'node:fs/promises';

/**
 * 使用 Mustache 渲染模板字符串
 *
 * @param templateContent - 模板原始内容
 * @param variables - Mustache 模板变量
 * @param partials - 可选的局部模板映射
 * @returns 渲染后的字符串
 */
export function renderTemplate(
  templateContent: string,
  variables: Record<string, unknown>,
  partials?: Record<string, string>
): string {
  return Mustache.render(templateContent, variables, partials);
}

/**
 * 渲染 JSON 模板（避免 HTML 转义问题）
 * 
 * 对于包含 shell 脚本等复杂内容的 JSON，使用此方法
 * 它会先对特定字段进行 JSON 字符串转义，再渲染模板
 *
 * @param templateContent - 模板原始内容
 * @param variables - Mustache 模板变量
 * @param rawFields - 需要保持原始格式的字段名列表（如 'command'）
 * @returns 渲染后的 JSON 字符串
 */
export function renderJsonTemplate(
  templateContent: string,
  variables: Record<string, unknown>,
  rawFields?: string[]
): string {
  // 对需要保持原始格式的字段进行 JSON 转义
  const escapedVars: Record<string, unknown> = { ...variables };

  if (rawFields && Array.isArray(escapedVars.hooks)) {
    escapedVars.hooks = (escapedVars.hooks as Record<string, unknown>[]).map((hook: Record<string, unknown>) => {
      const escaped = { ...hook };
      for (const field of rawFields) {
        if (escaped[field] && typeof escaped[field] === 'string') {
          // JSON 字符串转义：处理换行、引号、反斜杠等
          escaped[field] = JSON.stringify(escaped[field]).slice(1, -1);
        }
      }
      return escaped;
    });
  }
  
  return Mustache.render(templateContent, escapedVars);
}

/**
 * 从文件系统加载模板内容
 * 文件不存在时返回空字符串（优雅降级）
 *
 * @param templatePath - 模板文件的绝对路径
 * @returns 文件内容或空字符串
 */
export async function loadTemplate(templatePath: string): Promise<string> {
  try {
    return await readFile(templatePath, 'utf-8');
  } catch {
    return '';
  }
}
