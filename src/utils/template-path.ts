/**
 * 模板路径工具
 * 
 * 解决构建产物（dist/）中不包含 templates 目录的问题
 * 使用双路径回退机制：
 * 1. 优先使用项目根目录的 templates/（开发环境）
 * 2. 回退到构建产物中的 templates/（打包后的 CLI）
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 获取模板文件路径（双路径回退机制）
 * 
 * @param relativePath - 相对于 templates/ 的路径，例如 'platforms/qoder/settings.json.mustache'
 * @returns 模板文件的绝对路径
 * 
 * @example
 * ```typescript
 * const templatePath = getTemplatePath('platforms/qoder/settings.json.mustache');
 * const template = fs.readFileSync(templatePath, 'utf-8');
 * ```
 */
export function getTemplatePath(relativePath: string): string {
  // 路径 1: 项目根目录的 templates（开发环境）
  const projectPath = path.join(process.cwd(), 'templates', relativePath);
  
  // 路径 2: 相对于当前模块文件的 templates（构建产物 dist/）
  // import.meta.url 指向当前文件（如 dist/utils/template-path.js）
  // 从 dist/utils/ 回退 2 级到 dist/，然后访问 templates/
  const distPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '..',  // dist/utils/ → dist/
    '..',  // dist/ → AgentKit47/
    'templates',
    relativePath
  );
  
  // 路径 3: 全局安装路径的 templates（如果 CLI 被全局安装）
  // 从 dist/utils/ 回退 4 级到全局 node_modules 上级
  const globalPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '..',  // dist/utils/ → dist/
    '..',  // dist/ → AgentKit47/
    '..',  // AgentKit47/ → gitlab/
    '..',  // gitlab/ → qoder/
    'lib',
    'node_modules',
    'agentkit47',
    'templates',
    relativePath
  );
  
  // 优先顺序：项目根目录 > 构建产物 > 全局安装
  if (fs.existsSync(projectPath)) {
    return projectPath;
  }
  
  if (fs.existsSync(distPath)) {
    return distPath;
  }
  
  // 回退到全局安装路径（即使不存在也返回，让调用者报错）
  return globalPath;
}

/**
 * 安全读取模板文件
 * 
 * @param relativePath - 相对于 templates/ 的路径
 * @returns 模板内容（字符串）
 * @throws 如果模板文件不存在
 * 
 * @example
 * ```typescript
 * const template = readTemplate('rules/hard-rules.md');
 * ```
 */
export function readTemplate(relativePath: string): string {
  const templatePath = getTemplatePath(relativePath);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`模板文件不存在: ${templatePath}\n尝试过的路径:\n  1. ${path.join(process.cwd(), 'templates', relativePath)}\n  2. ${templatePath}`);
  }
  
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * 检查模板文件是否存在
 * 
 * @param relativePath - 相对于 templates/ 的路径
 * @returns 是否存在
 * 
 * @example
 * ```typescript
 * if (templateExists('workflow/workflow-rules.yaml.mustache')) {
 *   // 处理模板
 * }
 * ```
 */
export function templateExists(relativePath: string): boolean {
  const projectPath = path.join(process.cwd(), 'templates', relativePath);
  const distPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '..',
    '..',
    '..',
    'templates',
    relativePath
  );
  
  return fs.existsSync(projectPath) || fs.existsSync(distPath);
}

/**
 * 获取 templates 目录的根路径
 * 
 * @returns templates 目录的绝对路径
 * 
 * @example
 * ```typescript
 * const templatesDir = getTemplatesRoot();
 * const workflowPath = path.join(templatesDir, 'workflow', 'workflow-rules.yaml.mustache');
 * ```
 */
export function getTemplatesRoot(): string {
  const projectPath = path.join(process.cwd(), 'templates');
  const distPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '..',  // dist/utils/ → dist/
    '..',  // dist/ → AgentKit47/
    'templates'
  );
  const globalPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '..',  // dist/utils/ → dist/
    '..',  // dist/ → AgentKit47/
    '..',  // AgentKit47/ → gitlab/
    '..',  // gitlab/ → qoder/
    'lib',
    'node_modules',
    'agentkit47',
    'templates'
  );
  
  // 优先顺序：项目根目录 > 构建产物 > 全局安装
  if (fs.existsSync(projectPath)) {
    return projectPath;
  }
  
  if (fs.existsSync(distPath)) {
    return distPath;
  }
  
  return globalPath;
}
