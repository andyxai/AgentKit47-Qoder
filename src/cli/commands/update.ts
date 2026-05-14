import { Command } from 'commander';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';

// 读取当前版本
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;

// 仓库 URL 从 package.json 读取，适配 GitLab / GitHub / 私有化部署
const REPO_URL = packageJson.repository?.url || 'https://github.com/andyxai/AgentKit47-Qoder.git';
const HOME_URL = packageJson.homepage || 'https://github.com/andyxai/AgentKit47-Qoder';
const releasesPath = REPO_URL.includes('github.com') ? '/releases' : '/-/releases';

/**
 * 获取远程最新版本号
 * 优先 git ls-remote（最快，复用已有 git 凭证），失败则回退 GitLab API
 */
async function getLatestVersion(): Promise<string | null> {
  // 方案 1: git ls-remote --tags（需要 git + 仓库访问权限）
  try {
    const remoteTags = execSync(`git ls-remote --tags ${REPO_URL}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 10000,
    });

    const versionRegex = /refs\/tags\/(v[0-9]+\.[0-9]+\.[0-9]+)$/gm;
    const versions: string[] = [];
    let match;
    while ((match = versionRegex.exec(remoteTags)) !== null) {
      versions.push(match[1]);
    }

    if (versions.length > 0) {
      const sortedVersions = versions.sort((a, b) => {
        const [aMajor, aMinor, aPatch] = a.slice(1).split('.').map(Number);
        const [bMajor, bMinor, bPatch] = b.slice(1).split('.').map(Number);
        if (aMajor !== bMajor) return aMajor - bMajor;
        if (aMinor !== bMinor) return aMinor - bMinor;
        return aPatch - bPatch;
      });
      return sortedVersions[sortedVersions.length - 1];
    }
  } catch {
    // git ls-remote 失败，回退 GitLab API
  }

  // 方案 2: GitLab REST API（只需 HTTPS，无需 git 凭证）
  try {
    // 从 REPO_URL 推导 API 地址: https://HOST/OWNER/REPO.git → https://HOST/api/v4/projects/OWNER%2FREPO/repository/tags
    const urlMatch = REPO_URL.match(/^https?:\/\/([^\/]+)\/(.+)\.git$/);
    if (urlMatch) {
      const host = urlMatch[1];
      const projectPath = encodeURIComponent(urlMatch[2]);
      const apiUrl = `https://${host}/api/v4/projects/${projectPath}/repository/tags?per_page=50`;

      const response = execSync(`curl -sSL --connect-timeout 10 --max-time 15 "${apiUrl}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 20000,
      });

      const tags: Array<{ name: string }> = JSON.parse(response);
      const versions = tags
        .map((t) => t.name)
        .filter((name): name is string => /^v\d+\.\d+\.\d+$/.test(name))
        .sort((a, b) => {
          const [aMajor, aMinor, aPatch] = a.slice(1).split('.').map(Number);
          const [bMajor, bMinor, bPatch] = b.slice(1).split('.').map(Number);
          if (aMajor !== bMajor) return aMajor - bMajor;
          if (aMinor !== bMinor) return aMinor - bMinor;
          return aPatch - bPatch;
        });

      if (versions.length > 0) {
        return versions[versions.length - 1];
      }
    }
  } catch {
    // GitLab API 也失败
  }

  return null;
}

/**
 * 检查是否有新版本
 */
async function checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion: string | null }> {
  const latestVersion = await getLatestVersion();
  
  if (!latestVersion) {
    return { hasUpdate: false, latestVersion: null };
  }

  const currentVersionNormalized = currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`;
  const hasUpdate = currentVersionNormalized !== latestVersion;

  return { hasUpdate, latestVersion };
}

/**
 * 执行 CLI 工具更新
 */
async function executeUpdate(targetVersion: string, yes: boolean): Promise<void> {
  console.log(chalk.blue('\n🔄 开始更新 ak47 CLI...\n'));

  // 1. 检查当前版本
  const currentVersionNormalized = currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`;
  console.log(`当前版本: ${chalk.yellow(currentVersionNormalized)}`);
  console.log(`目标版本: ${chalk.green(targetVersion)}`);

  if (currentVersionNormalized === targetVersion) {
    console.log(chalk.green('\n✓ 已是目标版本，无需更新'));
    return;
  }

  // 2. 确认更新
  if (!yes) {
    const confirmed = await confirm({
      message: `确认更新到 ${targetVersion}?`,
      default: true,
    });

    if (!confirmed) {
      console.log(chalk.yellow('\n更新已取消'));
      return;
    }
  }

  // 3. 创建临时目录
  console.log(chalk.gray('\n→ 准备更新...'));
  const installDir = mkdtempSync(join(tmpdir(), 'ak47-update-'));
  
  try {
    // 4. 克隆仓库
    console.log(chalk.gray('→ 克隆仓库到临时目录...'));
    execSync(
      `git clone --depth 1 --branch ${targetVersion} ${REPO_URL} "${installDir}"`,
      { stdio: 'inherit' }
    );

    // 5. 安装依赖
    console.log(chalk.gray('→ 安装依赖...'));
    execSync('npm install --ignore-scripts', {
      cwd: installDir,
      stdio: 'inherit',
    });

    // 6. 编译 TypeScript
    console.log(chalk.gray('→ 编译 TypeScript...'));
    execSync('npm run build', {
      cwd: installDir,
      stdio: 'inherit',
    });

    // 7. 打包
    console.log(chalk.gray('→ 打包...'));
    const packOutput = execSync('npm pack', {
      cwd: installDir,
      encoding: 'utf-8',
    });
    const packageFile = packOutput.trim().split('\n').pop()!;

    // 8. 全局安装
    console.log(chalk.gray('→ 全局安装...'));
    execSync(`npm install -g "${packageFile}"`, {
      cwd: installDir,
      stdio: 'inherit',
    });

    // 9. 安装 OpenSpec 依赖
    console.log(chalk.gray('→ 安装 OpenSpec CLI（必要依赖）...'));
    try {
      execSync('npm install -g @fission-ai/openspec', {
        stdio: 'ignore',
      });
    } catch {
      console.log(chalk.yellow('  ⚠ OpenSpec 安装失败，可稍后手动安装'));
    }

    // 10. 验证安装
    console.log(chalk.blue('\n✓ 更新完成！验证安装...\n'));
    
    try {
      const versionOutput = execSync('ak47 --version', {
        encoding: 'utf-8',
      }).trim();
      console.log(chalk.green(`✓ ak47 版本: ${versionOutput}`));
    } catch {
      console.log(chalk.yellow('⚠ ak47 命令未找到，可能需要重新打开终端'));
    }

    try {
      const openspecOutput = execSync('openspec --version', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
      console.log(chalk.green(`✓ OpenSpec 版本: ${openspecOutput}`));
    } catch {
      // OpenSpec 未安装不影响主流程
    }

    console.log(chalk.green('\n========================================='));
    console.log(chalk.green('✓ 更新成功！'));
    console.log(chalk.green('=========================================\n'));

  } catch (error) {
    console.log(chalk.red('\n========================================='));
    console.log(chalk.red('✗ 更新失败'));
    console.log(chalk.red('=========================================\n'));
    
    if (error instanceof Error) {
      console.log(chalk.red(`错误: ${error.message}`));
    }
    
    console.log('\n可能的原因:');
    console.log('  1. 权限不足 - 尝试使用 sudo 或配置 npm 全局目录权限');
    console.log('  2. 网络问题 - 检查网络连接');
    console.log('  3. 目标版本不存在');
    console.log('');
    console.log(chalk.gray(`临时目录保留在: ${installDir}`));
    
    // 发生错误时不清理临时目录，方便调试
    return;
  }

  // 11. 清理临时目录
  if (existsSync(installDir)) {
    rmSync(installDir, { recursive: true, force: true });
  }
}

export const updateCommand = new Command('update')
  .description('CLI 工具更新 - 检查并更新 ak47 CLI 到最新版本')
  .option('--check', '仅检查新版本，不执行更新')
  .option('--version <version>', '更新到指定版本')
  .option('--yes', '跳过确认直接更新')
  .option('--upgrade', '更新 CLI 后自动升级项目配置 (等效于 ak47 upgrade --yes)')
  .action(async (options: { check?: boolean; version?: string; yes?: boolean; upgrade?: boolean }) => {
    console.log(chalk.blue('🔍 检查 ak47 CLI 版本...\n'));
    console.log(`当前版本: ${chalk.yellow(currentVersion)}`);

    // 检查模式
    if (options.check) {
      const { hasUpdate, latestVersion } = await checkForUpdates();

      if (!latestVersion) {
        console.log(chalk.gray('\n⚠ 无法获取远程版本信息'));
        console.log(chalk.gray(`  请手动查看: ${HOME_URL}${releasesPath}`));
        return;
      }

      console.log(`最新版本: ${chalk.green(latestVersion)}\n`);

      if (!hasUpdate) {
        console.log(chalk.green('✓ 已是最新版本！'));
      } else {
        console.log(chalk.yellow('⚠ 发现新版本！'));
        console.log('');
        console.log(chalk.cyan('运行以下命令更新:'));
        console.log(`  ak47 update`);
        console.log('');
        console.log(chalk.gray(`当前: ${currentVersion} → 最新: ${latestVersion}`));
      }
      return;
    }

    // 获取目标版本
    let targetVersion: string;
    
    if (options.version) {
      targetVersion = options.version.startsWith('v') ? options.version : `v${options.version}`;
    } else {
      const { hasUpdate, latestVersion } = await checkForUpdates();

      if (!latestVersion) {
        console.log(chalk.red('\n✗ 无法获取远程版本信息'));
        console.log(chalk.gray('  请检查网络连接或稍后重试'));
        process.exit(1);
      }

      if (!hasUpdate) {
        console.log(chalk.green('\n✓ 已是最新版本！'));
        return;
      }

      targetVersion = latestVersion;
    }

    // 执行更新
    await executeUpdate(targetVersion, options.yes || false);

    // 如果指定了 --upgrade，链式执行项目配置升级
    if (options.upgrade) {
      console.log(chalk.blue('\n📦 升级项目配置...\n'));
      try {
        execSync('ak47 upgrade --yes', {
          cwd: process.cwd(),
          stdio: 'inherit',
        });
      } catch (err) {
        console.log(chalk.yellow('\n⚠ CLI 工具已更新，但项目配置升级失败'));
        if (err instanceof Error) {
          console.log(chalk.gray(`  错误: ${err.message}`));
        }
        console.log(chalk.gray('  可稍后手动执行: ak47 upgrade --yes'));
      }
    }
  });
