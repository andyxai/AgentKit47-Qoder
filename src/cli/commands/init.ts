import { Command } from 'commander';
import chalk from 'chalk';
import { select, confirm, input } from '@inquirer/prompts';
import { basename, dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';
import { scanProject } from '../../core/scanner/index.js';
import { recommend } from '../../core/recommender/index.js';
import { plan, applyPlan } from '../../core/generator/index.js';
import { orchestrate } from '../../core/orchestrator/index.js';
import { saveConfig } from '../../utils/config.js';
import { getTemplatePath, getTemplatesRoot } from '../../utils/template-path.js';
import type { Ak47Config } from '../../types/index.js';

/**
 * 从当前文件路径向上查找 package.json 所在的目录作为包根目录
 */
function findPackageRoot(currentFilePath: string): string {
  let current = dirname(resolve(currentFilePath));
  while (true) {
    if (existsSync(join(current, 'package.json'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error('无法找到 package.json 所在的包根目录');
    }
    current = parent;
  }
}

/**
 * 从 CLI 自身 package.json 读取版本号
 */
async function getCliVersion(): Promise<string> {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const cliPkgRoot = findPackageRoot(currentFilePath);
    const cliPkgPath = join(cliPkgRoot, 'package.json');
    const raw = await readFile(cliPkgPath, 'utf-8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export const initCommand = new Command('init')
  .description('项目初始化 - 扫描项目并全量生成所有能力单元')
  .argument('[targetPath]', '项目路径（默认为当前目录）', '.')
  .option('--yes', '跳过确认，自动执行')
  .action(async (targetPath: string, options: { yes?: boolean }) => {
    console.log(chalk.blue('ak47 init - 项目初始化'));
    console.log('');

    // 0. 确定项目根目录
    let projectPath: string;
    if (options.yes) {
      projectPath = targetPath === '.' ? process.cwd() : targetPath;
      console.log(chalk.gray(`→ 项目路径: ${projectPath}`));
    } else {
      const mode = await select({
        message: '请选择初始化模式:',
        choices: [
          { name: '当前目录作为项目根目录', value: 'current' },
          { name: '在当前目录内新建项目', value: 'new' },
        ],
      });

      if (mode === 'current') {
        projectPath = targetPath === '.' ? process.cwd() : targetPath;
        console.log(chalk.gray(`→ 项目路径: ${projectPath}`));
      } else {
        const projectName = await input({
          message: '请输入项目名称:',
          default: 'my-project',
        });
        projectPath = path.join(process.cwd(), projectName);

        // 创建项目目录
        if (!fs.existsSync(projectPath)) {
          fs.mkdirSync(projectPath, { recursive: true });
          console.log(chalk.green(`✓ 创建目录: ${projectPath}`));
        } else {
          console.log(chalk.gray(`→ 使用已存在目录: ${projectPath}`));
        }
      }
    }
    console.log('');

    try {
      // 1. 扫描项目
      console.log(chalk.gray('→ 扫描项目中...'));
      const profile = await scanProject(projectPath);

      // 2. 显示检测摘要
      console.log(chalk.green('✓ 扫描完成'));
      console.log('');
      console.log('检测摘要:');
      console.log(
        `  技术栈: ${profile.techStack.primaryLanguage ?? '未知'}${
          profile.techStack.framework ? ` / ${profile.techStack.framework}` : ''
        }`
      );
      console.log(`  项目状态: ${profile.projectState === 'greenfield' ? '全新项目' : '已有项目'}`);
      console.log(`  成熟度: ${profile.maturity}`);
      console.log(
        `  协作模式: ${profile.collaboration.recommendedMode === 'solo' ? '个人开发' : '团队协作'}`
      );
      if (profile.platforms.detected.length > 0) {
        console.log(`  已检测平台: ${profile.platforms.detected.map((p) => p.id).join(', ')}`);
      }
      if (profile.gaps.length > 0) {
        console.log(`  检测到 ${profile.gaps.length} 个缺口`);
      }
      console.log('');

      // 3. init 全量初始化，不关联范式（范式是 change 命令的概念）
      console.log(chalk.gray('→ 推荐能力单元中...'));
      const result = await recommend(profile);

      // 5. 确认单元列表
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('警告:'));
        result.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
        console.log('');
      }

      console.log(`推荐的能力单元 (${result.units.length} 个):`);
      result.units.forEach((u) => console.log(`  • ${u.unitId}`));
      if (result.reasoning.length > 0) {
        console.log('');
        console.log(chalk.gray('推荐理由:'));
        result.reasoning.forEach((r) => console.log(`  • ${r}`));
      }
      console.log('');

      if (!options.yes) {
        const unitConfirmed = await confirm({
          message: '是否使用以上推荐的能力单元?',
          default: true,
        });
        if (!unitConfirmed) {
          console.log(chalk.yellow('已取消初始化'));
          process.exit(0);
        }
      }
      console.log('');

      // 6. 平台选择（当前只支持 Qoder）
      // 必须在生成文件之前选择，因为文件生成需要平台信息
      const selectedPlatforms = ['qoder'];
      console.log(chalk.green('✓ 已选择平台: qoder'));
      console.log('');

      // 7. 生成文件计划（传入平台信息）
      console.log(chalk.gray('→ 生成文件计划中...'));
      const genPlan = await plan(result.units, profile, projectPath, selectedPlatforms);

      // 7. 显示计划摘要
      const createCount = genPlan.files.filter((f) => f.action === 'create').length;
      const updateCount = genPlan.files.filter((f) => f.action === 'update').length;
      const skipCount = genPlan.files.filter((f) => f.action === 'skip').length;

      console.log(chalk.green('✓ 文件计划生成完成'));
      console.log(`  将创建: ${createCount} 个文件`);
      if (updateCount > 0) console.log(`  将更新: ${updateCount} 个文件`);
      if (skipCount > 0) console.log(`  将跳过: ${skipCount} 个文件`);
      console.log('');

      // 8. 执行生成
      console.log(chalk.gray('→ 写入文件中...'));
      await applyPlan(genPlan, projectPath);
      console.log(chalk.green('✓ 文件生成完成'));
      console.log('');

      // 9. 写入 config.yaml
      const cliVersion = await getCliVersion();
      const now = new Date().toISOString();
      const supportedPlatformIds = new Set(['qoder']); // 当前只支持 Qoder
      const platformConfigDirs: Record<string, string> = {
        qoder: '.qoder',
      };
      const configPlatforms = selectedPlatforms
        .filter((id) => supportedPlatformIds.has(id))
        .map((id) => ({
          id: id as 'qoder',
          enabled: true,
          configDir: platformConfigDirs[id] ?? '.',
        }));

      const config: Ak47Config = {
        version: cliVersion,
        ak47Version: cliVersion,
        projectName: basename(projectPath),
        platforms: configPlatforms,
        enabledUnits: result.units.map((u) => u.unitId),
        // paradigm 不设置，change 命令触发时由用户选择
        createdAt: now,
        updatedAt: now,
      };
      await saveConfig(config, projectPath);
      console.log(chalk.green('✓ config.yaml 生成完成'));
      console.log('');

      // 11. 安装引导
      if (selectedPlatforms.length > 0) {
        console.log(chalk.gray('→ 执行平台配置与安装引导...'));
        await orchestrate(result.units, selectedPlatforms, projectPath);
      } else {
        console.log(chalk.gray('→ 跳过平台配置（未选择平台）'));
        await orchestrate(result.units, [], projectPath);
      }

      // 12. 生成行为控制规则
      console.log('');
      console.log(chalk.gray('→ 生成项目规则...'));
      await generateProjectRules(projectPath);
      console.log(chalk.green('✓ .ak47/rules.md 生成完成'));
      console.log('');

      // 13. 复制 Qoder 平台配置（settings.json + skills + commands + hooks + rules）
      if (selectedPlatforms.includes('qoder')) {
        console.log(chalk.gray('→ 复制 Qoder 平台配置...'));
        await copyQoderConfig(projectPath);
        console.log(chalk.green('✓ Qoder 配置复制完成'));
        console.log('');

        // 13.1 复制模块级规则到 .ak47/rules/（供 AGENTS.md 模块规则索引查阅）
        console.log(chalk.gray('→ 复制模块规则到 .ak47/rules/...'));
        await copyModuleRules(projectPath);
        console.log(chalk.green('✓ 模块规则复制完成'));
        console.log('');
      }

      // 13.2 处理 .gitignore（创建或补全 ak47 必要规则）
      console.log(chalk.gray('→ 检查 .gitignore...'));
      const gitignoreResult = await handleGitignore(projectPath);
      console.log('');

      // 14. 生成 AGENTS.md（项目级 Agent 入口文件）
      console.log(chalk.gray('→ 生成 AGENTS.md...'));
      await generateAgentsMd(projectPath, result.units, selectedPlatforms);
      console.log(chalk.green('✓ AGENTS.md 生成完成'));
      console.log('');

      // 14.1 生成 CONTEXT.md（项目领域上下文，空白模板）
      console.log(chalk.gray('→ 生成 CONTEXT.md...'));
      await generateContextMd(projectPath);
      console.log(chalk.green('✓ CONTEXT.md 生成完成'));
      console.log('');

      // 15. 生成工作流引导规则
      console.log(chalk.gray('→ 生成 workflow-rules.yaml...'));
      await generateWorkflowRules(projectPath);
      console.log(chalk.green('✓ workflow-rules.yaml 生成完成'));
      console.log('');

      // 16. 初始化知识资产库
      console.log(chalk.gray('→ 初始化知识资产库...'));
      await initializeExperiences(projectPath);
      console.log(chalk.green('✓ 知识资产库初始化完成'));
      console.log('');

      // 17. 安装 Git Hooks（需显式确认，保护已有 hook）
      await installGitHooks(projectPath, { yes: options.yes });

      // 16. 输出结构化引导信息
      printInitGuidance(
        projectPath,
        result.units.map((u) => u.unitId),
        gitignoreResult
      );
    } catch (err) {
      console.error('');
      console.error(chalk.red('初始化失败:'));
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      // Exit code 规范：
      //   0   成功
      //   1   通用错误（当前路径）
      //   2   参数错误（保留给命令行解析）
      //   130 SIGINT（由 shell 自动产生，无需显式设置）
      process.exit(1);
    }
  });

/**
 * 生成项目规则文件
 */
async function generateProjectRules(projectPath: string): Promise<void> {
  const ak47Dir = path.join(projectPath, '.ak47');
  const rulesPath = path.join(ak47Dir, 'rules.md');

  // 确保 .ak47 目录存在
  if (!fs.existsSync(ak47Dir)) {
    fs.mkdirSync(ak47Dir, { recursive: true });
  }

  // 如果 rules.md 已存在，跳过
  if (fs.existsSync(rulesPath)) {
    return;
  }

  // 从模板生成 rules.md
  const templatePath = getTemplatePath('rules/hard-rules.md');

  if (fs.existsSync(templatePath)) {
    const template = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(rulesPath, template, 'utf-8');
  } else {
    // 如果模板不存在，创建基本内容
    const basicRules = `# ak47 项目规则

本文档定义 ak47 项目的行为规则，AI 助手应遵循这些规则以确保工程质量和流程一致性。

## 规则分类

### 🔴 硬规则（Hard Rules）- 必须遵守

- [ ] **没有 Spec 不得编写代码**
  - 所有代码变更必须有对应的 OpenSpec Spec 文档
  
- [ ] **没有测试不得提交**
  - 所有功能必须有对应的测试
  - 测试必须通过才能提交代码
  
- [ ] **没有 Plan 不得实现复杂功能**
  - 复杂度 > 1 天的功能必须有实施计划

### 🟡 强建议（Strong Suggestions）- 强烈建议遵循

- [ ] **使用 brainstorming 开始创造性工作**
  - 创建功能、构建组件、添加功能前先 brainstorming
  
- [ ] **使用 TDD 流程**
  - 遵循 RED → GREEN → REFACTOR 循环
  
- [ ] **完成前验证**
  - 声明"完成"前必须运行验证命令

### 🟢 建议（Suggestions）- 推荐做法

- [ ] **小步提交**
  - 每个 Task 完成后提交
  
- [ ] **代码审查**
  - 重要变更请求代码审查

## 偏离记录

当偏离上述规则时，必须记录到 \`.ak47/deviations.log\`：

\`\`\`yaml
- timestamp: "ISO 8601 时间戳"
  deviation: "偏离行为描述"
  reason: "偏离原因"
  impact: "low|medium|high"
  user_approval: true|false
\`\`\`

## 规则执行

ak47 通过以下机制执行规则：

1. **Agent 内置规则**：主 Agent 在关键节点检查规则
2. **验证器**：\`ak47 validate\` 命令检查规则遵守情况
3. **偏离日志**：记录所有偏离行为，便于追溯

> **重要**：规则的目的是保证质量，不是限制灵活性。用户可以选择不遵循某些规则，但必须记录原因。
`;
    fs.writeFileSync(rulesPath, basicRules, 'utf-8');
  }
}

/**
 * 复制 Qoder 平台配置到项目
 * 
 * 新策略：templates/qoder/ 目录包含完整的 Qoder 配置
 * 包括 settings.json、skills、commands、superpowers.yaml
 * 直接复制整个目录，零模板渲染
 */
async function copyQoderConfig(projectPath: string): Promise<void> {
  // 1. 复制 .qoder/ 配置
  const qoderTemplateDir = path.join(getTemplatesRoot(), 'qoder');
  const qoderTargetDir = path.join(projectPath, '.qoder');
  
  if (fs.existsSync(qoderTargetDir)) {
    console.log(chalk.gray('  → 合并到现有 .qoder 目录'));
    await copyDirectoryRecursive(qoderTemplateDir, qoderTargetDir);
  } else {
    console.log(chalk.gray('  → 创建 .qoder 目录'));
    await copyDirectoryRecursive(qoderTemplateDir, qoderTargetDir);
  }
  
  // 2. 复制 ak47/templates/ 系统模板
  const ak47TemplatesDir = path.join(getTemplatesRoot(), 'ak47', 'templates');
  const ak47TargetDir = path.join(projectPath, '.ak47', 'templates');
  
  if (fs.existsSync(ak47TemplatesDir)) {
    console.log(chalk.gray('  → 复制系统模板到 .ak47/templates/'));
    await copyDirectoryRecursive(ak47TemplatesDir, ak47TargetDir);
  }
}

/**
 * 判断目录是否包含任何文件（递归）
 */
function hasAnyFile(dir: string): boolean {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) return true;
      if (hasAnyFile(path.join(dir, entry.name))) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 递归复制目录
 *
 * 策略说明：
 * - 默认 safe-skip：目标文件已存在则跳过（保护用户定制）
 * - overwrite=true：强制覆盖（用于由工具完全管理的文件，如 .qoder/hooks/*.sh）
 * - 自动跳过源端空目录，避免污染用户项目（如 in-progress/ 占位目录）
 */
async function copyDirectoryRecursive(
  source: string,
  target: string,
  options: { overwrite?: boolean } = {}
): Promise<void> {
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // 过滤空目录：源目录自身无任何文件（递归）→ 跳过
  if (!hasAnyFile(source)) {
    return;
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourcePath, targetPath, options);
    } else {
      const exists = fs.existsSync(targetPath);
      if (!exists || options.overwrite) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }
}

/**
 * 复制模块级规则（`templates/experiences/rules/` → `.ak47/rules/`）
 *
 * 背景：AGENTS.md 中的模块规则索引需要真实可达的规则文件。
 * 旧设计引用 `templates/experiences/rules/...`（ak47 自身仓库路径），在用户项目中不存在。
 */
async function copyModuleRules(projectPath: string): Promise<void> {
  const rulesSource = path.join(getTemplatesRoot(), 'experiences', 'rules');
  const rulesTarget = path.join(projectPath, '.ak47', 'rules');

  if (!fs.existsSync(rulesSource)) {
    console.log(chalk.yellow('  ⚠️  模板目录不存在，跳过模块规则复制'));
    return;
  }

  if (!fs.existsSync(rulesTarget)) {
    fs.mkdirSync(rulesTarget, { recursive: true });
  }
  await copyDirectoryRecursive(rulesSource, rulesTarget);
}

/**
 * 生成 AGENTS.md（直接拷贝静态模板）
 */
async function generateAgentsMd(
  projectPath: string,
  _enabledUnits: Array<{ unitId: string }>,
  _selectedPlatforms: string[]
): Promise<void> {
  const agentsMdPath = path.join(projectPath, 'AGENTS.md');
  
  // 如果已存在，跳过
  if (fs.existsSync(agentsMdPath)) {
    return;
  }

  // 直接拷贝静态模板（从 templates/AGENTS.md，不再从 templates/qoder/ 以避免重复）
  const templatePath = path.join(getTemplatesRoot(), 'AGENTS.md');
  if (!fs.existsSync(templatePath)) {
    console.log(chalk.yellow('  ⚠️  AGENTS.md 模板不存在，跳过生成'));
    return;
  }
  fs.copyFileSync(templatePath, agentsMdPath);
}

/**
 * 生成 CONTEXT.md（项目领域上下文，空白模板）
 * 仅生成到根目录，保持唯一实例
 */
async function generateContextMd(projectPath: string): Promise<void> {
  const contextMdPath = path.join(projectPath, 'CONTEXT.md');
  
  // 如果已存在，跳过
  if (fs.existsSync(contextMdPath)) {
    return;
  }

  // 从 templates/CONTEXT.md 读取空白模板（已从 templates/qoder/ 移出）
  const templatePath = path.join(getTemplatesRoot(), 'CONTEXT.md');
  if (!fs.existsSync(templatePath)) {
    console.log(chalk.yellow('  ⚠️  CONTEXT.md 模板不存在，跳过生成'));
    return;
  }
  fs.copyFileSync(templatePath, contextMdPath);
}

/**
 * 处理 .gitignore：不存在则创建，存在则补全缺失的 ak47 规则
 */
async function handleGitignore(projectPath: string): Promise<{ created: boolean; patched: boolean }> {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const requiredRules = ['.worktrees/', '.ak47/deviations.log', '.ak47/*.lock'];
  
  if (!fs.existsSync(gitignorePath)) {
    // 场景 1: 不存在 → 创建
    const content = `# Git Worktrees (ak47 隔离工作空间)
.worktrees/

# ak47 运行时文件
.ak47/deviations.log
.ak47/*.lock
`;
    fs.writeFileSync(gitignorePath, content, 'utf-8');
    console.log(chalk.green('✓ .gitignore 已创建（含 .worktrees/ 等规则）'));
    return { created: true, patched: false };
  }
  
  // 场景 2 & 3: 存在 → 检查并补全
  let content = fs.readFileSync(gitignorePath, 'utf-8');
  const missing: string[] = [];
  
  for (const rule of requiredRules) {
    if (!content.includes(rule)) {
      missing.push(rule);
    }
  }
  
  if (missing.length > 0) {
    // 确保末尾有换行
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    content += `\n# ak47 运行时文件（由 ak47 init 自动追加）\n${missing.join('\n')}\n`;
    fs.writeFileSync(gitignorePath, content, 'utf-8');
    console.log(chalk.green(`✓ 已补全 .gitignore（追加 ${missing.join(', ')}）`));
    return { created: false, patched: true };
  }
  
  // 场景 4: 已完整
  console.log(chalk.gray('  → .gitignore 已包含必要规则，跳过'));
  return { created: false, patched: false };
}

/**
 * 输出初始化完成后的结构化引导信息
 */
function printInitGuidance(
  projectPath: string,
  enabledUnitIds: string[],
  _gitignoreResult: { created: boolean; patched: boolean }
): void {
  const isGitRepo = fs.existsSync(path.join(projectPath, '.git'));
  let step = 1;
  
  console.log('');
  console.log(chalk.green.bold('✓ ak47 init 完成!'));
  console.log('');
  
  // 能力单元
  console.log('项目已初始化，包含以下能力单元:');
  enabledUnitIds.forEach((id) => console.log(`  • ${id}`));
  console.log('');
  
  // 下一步引导
  console.log(chalk.bold('📋 下一步:'));
  
  if (!isGitRepo) {
    console.log(chalk.gray(`  ${step++}. 初始化 Git 仓库:`));
    console.log(chalk.cyan('     git init'));
    console.log(chalk.gray(`  ${step++}. 配置 Git 用户信息（如未全局配置）:`));
    console.log(chalk.cyan('     git config user.name "Your Name"'));
    console.log(chalk.cyan('     git config user.email "you@example.com"'));
    console.log(chalk.gray(`  ${step++}. 提交初始文件:`));
    console.log(chalk.cyan('     git add -A && git commit -m "chore: initialize project"'));
  } else {
    console.log(chalk.gray('  ✓ Git 仓库已存在'));
  }
  
  console.log(chalk.gray(`  ${step++}. 创建功能分支开始开发:`));
  console.log(chalk.cyan('     git worktree add .worktrees/feat-first -b feat/first-feature'));
  console.log(chalk.gray(`  ${step++}. 创建第一个 OpenSpec Change:`));
  console.log(chalk.cyan('     /opsx:propose first-feature'));
  console.log('');
  
  // 目录职责说明
  console.log(chalk.bold('📁 目录职责:'));
  console.log(chalk.gray('  .ak47/     - ak47 框架配置和知识资产'));
  console.log(chalk.gray('  .qoder/    - Qoder 平台 AI 行为配置'));
  console.log(chalk.gray('  根目录      - 项目业务代码和文档'));
  console.log('');
  
  // 核心文档索引
  console.log(chalk.bold('📖 核心文档:'));
  console.log(chalk.gray('  AGENTS.md   - AI 行为指令（唯一）'));
  console.log(chalk.gray('  CONTEXT.md  - 项目领域上下文（按需填充）'));
  console.log(chalk.gray('  .ak47/rules.md  - ak47 框架规则'));
  console.log(chalk.gray('  .qoder/rules/*.md - Qoder 平台规则'));
}

/**
 * 安装 Git Hooks
 *
 * 安全策略：
 * 1. 必须显式 confirm（--yes 模式除外）
 * 2. 覆盖前自动备份现有 hook 到 `<hook>.bak.<timestamp>`
 * 3. 非 Git 仓库或模板缺失时静默跳过（不中断 init）
 */
async function installGitHooks(
  projectPath: string,
  options: { yes?: boolean } = {}
): Promise<void> {
  console.log(chalk.gray('→ 安装 Git Hooks...'));

  const hooksInstallScript = getTemplatePath('git-hooks/install.sh');

  // 检查脚本是否存在
  if (!fs.existsSync(hooksInstallScript)) {
    console.log(chalk.yellow('⚠️  Git Hooks 模板不存在，跳过安装'));
    return;
  }

  // 检查是否是 Git 仓库
  const gitDir = path.join(projectPath, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log(chalk.yellow('⚠️  当前目录不是 Git 仓库，跳过 Git Hooks 安装'));
    return;
  }

  // 用户确认（--yes 模式自动通过）
  if (!options.yes) {
    const confirmed = await confirm({
      message: '是否安装 Git Hooks？（已有 hook 将备份为 *.bak.<timestamp>）',
      default: true,
    });
    if (!confirmed) {
      console.log(chalk.yellow('已跳过 Git Hooks 安装（可稍后手动运行 bash templates/git-hooks/install.sh）'));
      return;
    }
  }

  // 备份已有 hook
  const gitHooksDir = path.join(gitDir, 'hooks');
  if (fs.existsSync(gitHooksDir)) {
    const timestamp = Date.now();
    for (const name of ['pre-commit', 'commit-msg', 'pre-push']) {
      const hookPath = path.join(gitHooksDir, name);
      if (fs.existsSync(hookPath)) {
        const stat = fs.lstatSync(hookPath);
        if (!stat.isSymbolicLink()) {
          const backupPath = `${hookPath}.bak.${timestamp}`;
          fs.copyFileSync(hookPath, backupPath);
          console.log(chalk.gray(`  → 已备份 ${name} → ${name}.bak.${timestamp}`));
        }
      }
    }
  }

  try {
    // 执行安装脚本
    await new Promise<void>((resolve, reject) => {
      const child = spawn('bash', [hooksInstallScript], {
        cwd: projectPath,
        stdio: 'pipe'
      });

      let output = '';
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.gray(output.trim()));
          resolve();
        } else {
          reject(new Error(`Git Hooks 安装失败: ${output}`));
        }
      });
    });
  } catch (err) {
    console.log(chalk.yellow(`⚠️  Git Hooks 安装失败: ${err instanceof Error ? err.message : String(err)}`));
    console.log(chalk.yellow('   可以稍后手动运行: bash templates/git-hooks/install.sh'));
  }
}

/**
 * 生成工作流引导规则文件（静态拷贝）
 */
async function generateWorkflowRules(projectPath: string): Promise<void> {
  const templatePath = getTemplatePath('workflow/workflow-rules.yaml');
  const outputPath = path.join(projectPath, '.ak47', 'workflow-rules.yaml');
  
  // 如果模板不存在，跳过
  if (!fs.existsSync(templatePath)) {
    console.log(chalk.yellow('⚠️  workflow-rules.yaml 模板不存在，跳过生成'));
    return;
  }
  
  // 如果已存在，跳过
  if (fs.existsSync(outputPath)) {
    return;
  }
  
  // 直接拷贝静态模板
  fs.copyFileSync(templatePath, outputPath);
}

/**
 * 初始化知识资产库（渐进式 - 不预生成文档）
 * 只创建目录结构，文档在首次使用时由 AI 从系统模板创建
 */
async function initializeExperiences(projectPath: string): Promise<void> {
  const experiencesDir = path.join(projectPath, '.ak47', 'experiences');
  
  try {
    // 创建目录结构（不预生成任何文档）
    fs.mkdirSync(experiencesDir, { recursive: true });
    fs.mkdirSync(path.join(experiencesDir, 'tool-research'), { recursive: true });
    fs.mkdirSync(path.join(experiencesDir, 'best-practices'), { recursive: true });
    fs.mkdirSync(path.join(experiencesDir, 'pitfall-records'), { recursive: true });
    fs.mkdirSync(path.join(experiencesDir, 'decisions'), { recursive: true });
    
    // 渐进式文档创建：
    // - index.md 由 experience-summarization Skill 在首个经验沉淀时创建
    // - trigger-guide.md 由 AI 在需要时从 .ak47/templates/experiences/ 读取
    // 不在此处预生成空文档
  } catch (err) {
    console.log(chalk.yellow(`⚠️  知识资产库初始化失败: ${err instanceof Error ? err.message : String(err)}`));
  }
}

