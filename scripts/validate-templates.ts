#!/usr/bin/env node
/* eslint-env node */

/**
 * 模板验证脚本
 *
 * 在编译前验证:
 * 1. 所有 .mustache 模板文件的语法正确性
 * 2. Qoder 平台契约:
 *    - settings.json 仅使用官方 5 种 Hook 事件
 *    - 每个 Skill 为 <name>/SKILL.md 目录结构且 frontmatter 有 name+description
 *    - 每个 Agent 为 .md 文件且 frontmatter 有 name+description
 *    - Hook 脚本存在且和 settings.json 中的命令一致
 *
 * 使用方式:
 *   npm run validate-templates
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Mustache from 'mustache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Qoder 平台契约常量
// ============================================================

/** Qoder 官方支持的 5 种 Hook 事件 */
const QODER_OFFICIAL_HOOK_EVENTS = [
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'Stop',
] as const;

type HookEventName = typeof QODER_OFFICIAL_HOOK_EVENTS[number];

interface QoderHookCommand {
  type?: string;
  command?: string;
}

interface QoderHookEntry {
  matcher?: string;
  hooks?: QoderHookCommand[];
}

interface QoderSettings {
  hooks?: Record<string, QoderHookEntry[]>;
}

// ============================================================
// 一、 Mustache 模板语法校验
// ============================================================

function findMustacheFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMustacheFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.mustache')) {
      files.push(fullPath);
    }
  }
  return files;
}

function validateTemplate(filePath: string): { valid: boolean; error?: string } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    Mustache.parse(content);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================
// 二、Qoder 平台契约校验
// ============================================================

interface ContractIssue {
  file: string;
  message: string;
}

/** 校验 settings.json Hook 配置 */
function validateSettingsJson(qoderDir: string): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const settingsPath = path.join(qoderDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    issues.push({ file: 'qoder/settings.json', message: '缺失 settings.json' });
    return issues;
  }

  let settings: QoderSettings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch (e) {
    issues.push({
      file: 'qoder/settings.json',
      message: `JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`,
    });
    return issues;
  }

  const hooks = settings.hooks ?? {};
  const hooksDir = path.join(qoderDir, 'hooks');

  for (const [eventName, entries] of Object.entries(hooks)) {
    if (!QODER_OFFICIAL_HOOK_EVENTS.includes(eventName as HookEventName)) {
      issues.push({
        file: 'qoder/settings.json',
        message: `非法 Hook 事件 "${eventName}"，官方只支持: ${QODER_OFFICIAL_HOOK_EVENTS.join(', ')}`,
      });
      continue;
    }

    for (const entry of entries ?? []) {
      for (const h of entry.hooks ?? []) {
        if (h.type !== 'command') {
          issues.push({
            file: 'qoder/settings.json',
            message: `${eventName} 下存在非 command 类型的 hook`,
          });
          continue;
        }
        if (!h.command) {
          issues.push({
            file: 'qoder/settings.json',
            message: `${eventName} 下存在空的 command`,
          });
          continue;
        }
        // bash .qoder/hooks/xxx.sh  -> 提取脚本路径
        const match = h.command.match(/\.qoder\/hooks\/([\w.-]+\.sh)/);
        if (match) {
          const scriptName = match[1];
          const scriptPath = path.join(hooksDir, scriptName);
          if (!fs.existsSync(scriptPath)) {
            issues.push({
              file: 'qoder/settings.json',
              message: `${eventName} 引用了不存在的脚本: hooks/${scriptName}`,
            });
          }
        }
      }
    }
  }

  return issues;
}

/** 解析 Markdown frontmatter（简易版，仅提取 name / description） */
function parseFrontmatter(content: string): Record<string, string> | null {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null;
  const end = content.indexOf('\n---', 4);
  if (end === -1) return null;
  const fmBody = content.slice(4, end);
  const result: Record<string, string> = {};
  for (const line of fmBody.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (m) {
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      result[m[1]] = value;
    }
  }
  return result;
}

/** 校验 Skills 目录结构 */
function validateSkills(qoderDir: string): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const skillsDir = path.join(qoderDir, 'skills');
  if (!fs.existsSync(skillsDir)) {
    issues.push({ file: 'qoder/skills/', message: '缺失 skills 目录' });
    return issues;
  }

  const categories = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const cat of categories) {
    if (!cat.isDirectory()) continue;
    if (cat.name === 'in-progress') continue; // 留白檣案忽略
    const catDir = path.join(skillsDir, cat.name);
    const skills = fs.readdirSync(catDir, { withFileTypes: true });
    for (const skill of skills) {
      // 忽略类别目录下的 README.md 等说明文件
      if (skill.isFile() && skill.name.toLowerCase() === 'readme.md') continue;
      if (!skill.isDirectory()) {
        issues.push({
          file: `qoder/skills/${cat.name}/${skill.name}`,
          message: 'Skill 必须是目录结构 <name>/SKILL.md，不允许扁平 .md 文件',
        });
        continue;
      }
      const skillFile = path.join(catDir, skill.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        issues.push({
          file: `qoder/skills/${cat.name}/${skill.name}/`,
          message: '缺失 SKILL.md',
        });
        continue;
      }
      const content = fs.readFileSync(skillFile, 'utf-8');
      const fm = parseFrontmatter(content);
      if (!fm) {
        issues.push({
          file: `qoder/skills/${cat.name}/${skill.name}/SKILL.md`,
          message: '缺失 frontmatter (---) 头部',
        });
        continue;
      }
      if (!fm.name) {
        issues.push({
          file: `qoder/skills/${cat.name}/${skill.name}/SKILL.md`,
          message: 'frontmatter 缺失 name',
        });
      }
      if (!fm.description) {
        issues.push({
          file: `qoder/skills/${cat.name}/${skill.name}/SKILL.md`,
          message: 'frontmatter 缺失 description',
        });
      }
      if (fm.name && fm.name !== skill.name) {
        issues.push({
          file: `qoder/skills/${cat.name}/${skill.name}/SKILL.md`,
          message: `frontmatter.name (${fm.name}) 与目录名 (${skill.name}) 不一致`,
        });
      }
    }
  }
  return issues;
}

/** 校验 Agents 目录 */
function validateAgents(qoderDir: string): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const agentsDir = path.join(qoderDir, 'agents');
  if (!fs.existsSync(agentsDir)) {
    issues.push({ file: 'qoder/agents/', message: '缺失 agents 目录' });
    return issues;
  }

  const files = fs.readdirSync(agentsDir, { withFileTypes: true });
  for (const f of files) {
    if (!f.isFile() || !f.name.endsWith('.md')) continue;
    const filePath = path.join(agentsDir, f.name);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm) {
      issues.push({
        file: `qoder/agents/${f.name}`,
        message: '缺失 frontmatter (---) 头部',
      });
      continue;
    }
    if (!fm.name) {
      issues.push({ file: `qoder/agents/${f.name}`, message: 'frontmatter 缺失 name' });
    }
    if (!fm.description) {
      issues.push({
        file: `qoder/agents/${f.name}`,
        message: 'frontmatter 缺失 description',
      });
    }
  }
  return issues;
}

/** 校验 Hook 脚本存在性 */
function validateHookScripts(qoderDir: string): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const hooksDir = path.join(qoderDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    // 无 hooks 目录本身不是错误，settings.json 也可以为空
    return issues;
  }
  const files = fs.readdirSync(hooksDir);
  for (const f of files) {
    if (!f.endsWith('.sh')) continue;
    const filePath = path.join(hooksDir, f);
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.startsWith('#!')) {
      issues.push({
        file: `qoder/hooks/${f}`,
        message: '缺失 shebang（第一行应为 #!/usr/bin/env bash 或类似）',
      });
    }
  }
  return issues;
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  const templatesDir = path.join(__dirname, '..', 'templates');
  const qoderDir = path.join(templatesDir, 'qoder');

  console.log('🔍 验证模板文件...\n');
  console.log(`模板目录: ${templatesDir}\n`);

  // ---- Mustache 语法验证 ----
  console.log('─'.repeat(60));
  console.log('[1/2] Mustache 语法校验');
  console.log('─'.repeat(60));
  const mustacheFiles = findMustacheFiles(templatesDir);
  console.log(`找到 ${mustacheFiles.length} 个模板文件\n`);

  let mustacheValid = 0;
  let mustacheInvalid = 0;
  const mustacheErrors: { file: string; error: string }[] = [];
  for (const filePath of mustacheFiles) {
    const relativePath = path.relative(templatesDir, filePath);
    const result = validateTemplate(filePath);
    if (result.valid) {
      console.log(`  ✅ ${relativePath}`);
      mustacheValid++;
    } else {
      console.log(`  ❌ ${relativePath}`);
      console.log(`     错误: ${result.error}`);
      mustacheErrors.push({ file: relativePath, error: result.error! });
      mustacheInvalid++;
    }
  }
  console.log(`\nMustache: ${mustacheValid} 通过, ${mustacheInvalid} 失败\n`);

  // ---- Qoder 平台契约验证 ----
  console.log('─'.repeat(60));
  console.log('[2/2] Qoder 平台契约校验');
  console.log('─'.repeat(60));

  const contractIssues: ContractIssue[] = [];
  if (!fs.existsSync(qoderDir)) {
    console.log('  ⚠️  未找到 templates/qoder/ 目录，跳过');
  } else {
    contractIssues.push(...validateSettingsJson(qoderDir));
    contractIssues.push(...validateSkills(qoderDir));
    contractIssues.push(...validateAgents(qoderDir));
    contractIssues.push(...validateHookScripts(qoderDir));

    if (contractIssues.length === 0) {
      console.log('  ✅ Qoder 平台契约校验全部通过');
    } else {
      for (const issue of contractIssues) {
        console.log(`  ❌ ${issue.file}`);
        console.log(`     ${issue.message}`);
      }
      console.log(`\nQoder 契约: ${contractIssues.length} 个问题`);
    }
  }

  // ---- 总结 ----
  console.log(`\n${'='.repeat(60)}`);
  const totalIssues = mustacheInvalid + contractIssues.length;
  console.log(
    `总结: Mustache ${mustacheValid}/${mustacheFiles.length} 通过 | Qoder 契约 ${contractIssues.length} 问题`
  );

  if (totalIssues > 0) {
    console.log('\n❌ 验证失败，请修复以上错误');
    process.exit(1);
  } else {
    console.log('\n✅ 所有验证通过！');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('验证过程出错:', error);
  process.exit(1);
});
