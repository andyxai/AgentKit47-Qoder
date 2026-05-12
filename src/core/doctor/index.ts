/**
 * ak47 doctor - 项目健康体检
 *
 * 与 `ak47 validate` 的区别：
 * - validate：规范合规检查（硬性/强规则，pass/fail）
 * - doctor：健康度快照（环境/结构/快照一致性/升级待办/自定义资产/冲突残留）
 *
 * 设计原则（见 docs/design/decisions/CLI与LLM职责分层决策）：
 * - CLI 只负责采集确定性证据，不做 AI 解读
 * - 上层 Skill（ak47-skill-doctor-analysis）负责结合 git diff 给建议
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../../utils/config.js';
import { getAk47Dir, getConfigPath } from '../../utils/paths.js';
import { loadSnapshot, computeFileHash } from '../upgrader/snapshot-manager.js';
import { computeUpgradeDiff } from '../upgrader/diff-engine.js';

export type DoctorSeverity = 'pass' | 'warn' | 'fail';

export interface DoctorCheck {
  id: string;
  title: string;
  severity: DoctorSeverity;
  message: string;
  hint?: string;
  details?: Record<string, unknown>;
}

export interface DoctorSection {
  name: string;
  checks: DoctorCheck[];
}

export interface DoctorReport {
  overall: DoctorSeverity;
  sections: DoctorSection[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
  meta: {
    projectDir: string;
    cliVersion: string;
    nodeVersion: string;
    generatedAt: string;
  };
}

function findPackageRoot(currentFilePath: string): string {
  let current = dirname(currentFilePath);
  while (true) {
    if (existsSync(join(current, 'package.json'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return current;
    }
    current = parent;
  }
}

async function getCliVersion(): Promise<string> {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const pkgRoot = findPackageRoot(currentFilePath);
    const raw = await readFile(join(pkgRoot, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function getTemplateDir(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  const pkgRoot = findPackageRoot(currentFilePath);
  return join(pkgRoot, 'templates');
}

function escalate(current: DoctorSeverity, next: DoctorSeverity): DoctorSeverity {
  const rank: Record<DoctorSeverity, number> = { pass: 0, warn: 1, fail: 2 };
  return rank[next] > rank[current] ? next : current;
}

function sectionSeverity(checks: DoctorCheck[]): DoctorSeverity {
  return checks.reduce<DoctorSeverity>((acc, c) => escalate(acc, c.severity), 'pass');
}

/**
 * 1. 环境检查：Node 版本、CLI 版本
 */
function checkEnvironment(cliVersion: string, nodeVersion: string): DoctorCheck[] {
  const checks: DoctorCheck[] = [];

  const major = Number.parseInt(nodeVersion.replace(/^v/, '').split('.')[0] ?? '0', 10);
  if (Number.isNaN(major) || major < 18) {
    checks.push({
      id: 'env.node-version',
      title: 'Node.js 版本',
      severity: 'fail',
      message: `当前 Node 版本 ${nodeVersion}，低于最低要求 v18`,
      hint: '升级 Node.js 到 18+ 后重新运行',
    });
  } else {
    checks.push({
      id: 'env.node-version',
      title: 'Node.js 版本',
      severity: 'pass',
      message: `Node ${nodeVersion}`,
    });
  }

  checks.push({
    id: 'env.cli-version',
    title: 'ak47 CLI 版本',
    severity: 'pass',
    message: cliVersion,
  });

  return checks;
}

/**
 * 2. 项目结构检查：.ak47/、config.yaml、.snapshots.json
 */
async function checkStructure(projectDir: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const ak47Dir = getAk47Dir(projectDir);
  const configPath = getConfigPath(projectDir);
  const snapshotPath = join(ak47Dir, '.snapshots.json');

  if (!existsSync(ak47Dir)) {
    checks.push({
      id: 'struct.ak47-dir',
      title: '.ak47/ 目录',
      severity: 'fail',
      message: '.ak47/ 目录不存在',
      hint: '运行 ak47 init 初始化项目',
    });
    return checks;
  }

  checks.push({
    id: 'struct.ak47-dir',
    title: '.ak47/ 目录',
    severity: 'pass',
    message: '存在',
  });

  if (!existsSync(configPath)) {
    checks.push({
      id: 'struct.config',
      title: '.ak47/config.yaml',
      severity: 'fail',
      message: 'config.yaml 缺失',
      hint: '运行 ak47 init 重新生成',
    });
  } else {
    const config = await loadConfig(projectDir);
    if (!config) {
      checks.push({
        id: 'struct.config',
        title: '.ak47/config.yaml',
        severity: 'fail',
        message: '解析失败或未通过 schema 校验',
        hint: '检查 YAML 语法或运行 ak47 validate 查看详情',
      });
    } else {
      checks.push({
        id: 'struct.config',
        title: '.ak47/config.yaml',
        severity: 'pass',
        message: `projectName=${config.projectName}, paradigm=${config.paradigm}, enabledUnits=${config.enabledUnits.length}`,
      });
    }
  }

  if (!existsSync(snapshotPath)) {
    checks.push({
      id: 'struct.snapshot',
      title: '.ak47/.snapshots.json',
      severity: 'warn',
      message: '快照文件缺失',
      hint: '升级检测将降级为保守策略；运行 ak47 upgrade 生成新快照',
    });
  } else {
    const snapshot = await loadSnapshot(projectDir);
    const count = snapshot ? Object.keys(snapshot.files).length : 0;
    checks.push({
      id: 'struct.snapshot',
      title: '.ak47/.snapshots.json',
      severity: snapshot ? 'pass' : 'fail',
      message: snapshot ? `记录 ${count} 个文件 (version ${snapshot.version})` : '解析失败',
    });
  }

  return checks;
}

/**
 * 3. 快照一致性：记录文件是否全部存在、hash 是否匹配
 */
async function checkSnapshotIntegrity(projectDir: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const snapshot = await loadSnapshot(projectDir);

  if (!snapshot) {
    checks.push({
      id: 'snapshot.integrity',
      title: '快照一致性',
      severity: 'warn',
      message: '无快照，跳过一致性检查',
    });
    return checks;
  }

  const missing: string[] = [];
  const modified: string[] = [];

  for (const [relativePath, expectedHash] of Object.entries(snapshot.files)) {
    const absolutePath = join(projectDir, relativePath);
    if (!existsSync(absolutePath)) {
      missing.push(relativePath);
      continue;
    }
    try {
      const currentHash = await computeFileHash(absolutePath);
      if (currentHash !== expectedHash) {
        modified.push(relativePath);
      }
    } catch {
      missing.push(relativePath);
    }
  }

  if (missing.length > 0) {
    checks.push({
      id: 'snapshot.missing',
      title: '快照中记录的文件缺失',
      severity: 'fail',
      message: `${missing.length} 个文件已被删除`,
      hint: '运行 ak47 upgrade 重新生成，或从备份恢复',
      details: { files: missing.slice(0, 10) },
    });
  } else {
    checks.push({
      id: 'snapshot.missing',
      title: '快照中记录的文件',
      severity: 'pass',
      message: `${Object.keys(snapshot.files).length} 个文件全部存在`,
    });
  }

  if (modified.length > 0) {
    checks.push({
      id: 'snapshot.modified',
      title: '用户已修改的文件',
      severity: 'warn',
      message: `${modified.length} 个文件 hash 与快照不一致`,
      hint: '这是预期的用户自定义内容；升级时将以 .new 形式呈现冲突',
      details: { files: modified.slice(0, 10) },
    });
  }

  return checks;
}

/**
 * 4. 升级待办：复用 computeUpgradeDiff 统计五种策略计数
 */
async function checkUpgradePending(projectDir: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const config = await loadConfig(projectDir);
  if (!config) {
    checks.push({
      id: 'upgrade.pending',
      title: '升级待办',
      severity: 'warn',
      message: 'config.yaml 不可用，跳过检测',
    });
    return checks;
  }

  try {
    const entries = await computeUpgradeDiff(config, projectDir, getTemplateDir());
    const counts = {
      add: 0,
      update: 0,
      conflict: 0,
      deprecate: 0,
      skip: 0,
    };
    for (const entry of entries) {
      if (entry.strategy === 'update-with-conflict') counts.conflict += 1;
      else counts[entry.strategy] += 1;
    }

    const pending = counts.add + counts.update + counts.conflict + counts.deprecate;
    if (pending === 0) {
      checks.push({
        id: 'upgrade.pending',
        title: '升级待办',
        severity: 'pass',
        message: '项目与当前 CLI 模板一致，无升级项',
      });
    } else {
      const severity: DoctorSeverity = counts.conflict > 0 ? 'warn' : 'pass';
      checks.push({
        id: 'upgrade.pending',
        title: '升级待办',
        severity,
        message: `待处理 ${pending} 项：新增 ${counts.add}、更新 ${counts.update}、冲突 ${counts.conflict}、废弃 ${counts.deprecate}`,
        hint: 'ak47 upgrade --dry-run 查看详情',
        details: counts as unknown as Record<string, unknown>,
      });
    }
  } catch (err) {
    checks.push({
      id: 'upgrade.pending',
      title: '升级待办',
      severity: 'warn',
      message: `分析失败: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  return checks;
}

/**
 * 5. 用户自定义资产：.qoder/ 下非 ak47-* 前缀的 Agent/Skill 数量
 */
async function checkCustomAssets(projectDir: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const qoderDir = join(projectDir, '.qoder');
  if (!existsSync(qoderDir)) {
    checks.push({
      id: 'custom.qoder',
      title: '自定义 Qoder 资产',
      severity: 'pass',
      message: '.qoder/ 目录不存在，跳过',
    });
    return checks;
  }

  const customAgents = await listCustomAssets(join(qoderDir, 'agents'));
  const customSkills = await listCustomSkills(join(qoderDir, 'skills'));

  const total = customAgents.length + customSkills.length;
  if (total === 0) {
    checks.push({
      id: 'custom.qoder',
      title: '自定义 Qoder 资产',
      severity: 'pass',
      message: '未发现用户自定义 Agent/Skill',
    });
  } else {
    checks.push({
      id: 'custom.qoder',
      title: '自定义 Qoder 资产',
      severity: 'pass',
      message: `用户自定义 Agent ${customAgents.length} 个、Skill ${customSkills.length} 个`,
      hint: '这些资产不受 ak47 upgrade 管理，请自行维护',
      details: {
        agents: customAgents.map((a) => relative(projectDir, a)),
        skills: customSkills.map((a) => relative(projectDir, a)),
      },
    });
  }

  return checks;
}

async function listCustomAssets(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('ak47-'))
      .map((e) => join(dir, e.name));
  } catch {
    return [];
  }
}

async function listCustomSkills(skillsDir: string): Promise<string[]> {
  if (!existsSync(skillsDir)) return [];
  const result: string[] = [];
  try {
    const categories = await readdir(skillsDir, { withFileTypes: true });
    for (const cat of categories) {
      if (!cat.isDirectory()) continue;
      const categoryPath = join(skillsDir, cat.name);
      const skills = await readdir(categoryPath, { withFileTypes: true });
      for (const skill of skills) {
        if (!skill.isDirectory()) continue;
        if (skill.name.startsWith('ak47-')) continue;
        const skillMd = join(categoryPath, skill.name, 'SKILL.md');
        if (existsSync(skillMd)) {
          result.push(skillMd);
        }
      }
    }
  } catch {
    // ignore
  }
  return result;
}

/**
 * 6. 升级冲突残留：检查 .qoder/ 和 .ak47/ 下的 *.new 文件
 */
async function checkConflictResidue(projectDir: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const newFiles: string[] = [];

  for (const dir of ['.ak47', '.qoder']) {
    const absDir = join(projectDir, dir);
    if (!existsSync(absDir)) continue;
    await collectNewFiles(absDir, projectDir, newFiles);
  }

  if (newFiles.length === 0) {
    checks.push({
      id: 'conflict.residue',
      title: '升级冲突残留',
      severity: 'pass',
      message: '无 .new 文件',
    });
  } else {
    checks.push({
      id: 'conflict.residue',
      title: '升级冲突残留',
      severity: 'warn',
      message: `${newFiles.length} 个 .new 文件等待合并`,
      hint: '对比原文件与 .new 文件，手动合并后删除 .new',
      details: { files: newFiles.slice(0, 10) },
    });
  }

  return checks;
}

async function collectNewFiles(
  dirPath: string,
  projectDir: string,
  out: string[]
): Promise<void> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      // 跳过备份目录避免误报
      if (entry.name === 'backups') continue;
      await collectNewFiles(full, projectDir, out);
    } else if (entry.isFile() && entry.name.endsWith('.new')) {
      out.push(relative(projectDir, full));
    }
  }
}

/**
 * 入口：运行全部检查
 */
export async function runDoctor(projectDir: string): Promise<DoctorReport> {
  const cliVersion = await getCliVersion();
  const nodeVersion = process.version;

  // 提前消费一下 stat 的类型以避免 tsc 报未用（保留导入以便未来扩展）
  void stat;

  const sections: DoctorSection[] = [
    { name: '环境', checks: checkEnvironment(cliVersion, nodeVersion) },
    { name: '项目结构', checks: await checkStructure(projectDir) },
    { name: '快照一致性', checks: await checkSnapshotIntegrity(projectDir) },
    { name: '升级待办', checks: await checkUpgradePending(projectDir) },
    { name: '自定义资产', checks: await checkCustomAssets(projectDir) },
    { name: '升级冲突残留', checks: await checkConflictResidue(projectDir) },
  ];

  const summary = { pass: 0, warn: 0, fail: 0 };
  let overall: DoctorSeverity = 'pass';
  for (const section of sections) {
    for (const check of section.checks) {
      summary[check.severity] += 1;
      overall = escalate(overall, check.severity);
    }
    // 同时将 section 自身严重度对齐（用于文本渲染时的分组色）
    void sectionSeverity(section.checks);
  }

  return {
    overall,
    sections,
    summary,
    meta: {
      projectDir,
      cliVersion,
      nodeVersion,
      generatedAt: new Date().toISOString(),
    },
  };
}
