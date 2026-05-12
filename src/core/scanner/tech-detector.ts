import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { TechStackInfo } from '../../types/project.js';

/**
 * 检测项目的技术栈信息
 */
export async function detectTechStack(projectDir: string): Promise<TechStackInfo> {
  const result: TechStackInfo = {
    primaryLanguage: null,
    framework: null,
    buildTool: null,
    testFramework: null,
    packageManager: null,
    hasTypeScript: false,
    hasPython: false,
  };

  // ── 检查语言标志文件 ──
  const hasFile = async (name: string) => {
    try {
      await access(join(projectDir, name));
      return true;
    } catch {
      return false;
    }
  };

  const [
    hasPackageJson,
    hasTsConfig,
    hasPyProject,
    hasRequirements,
    hasPipfile,
    hasGoMod,
    hasCargoToml,
    hasBuildGradle,
    hasPomXml,
  ] = await Promise.all([
    hasFile('package.json'),
    hasFile('tsconfig.json'),
    hasFile('pyproject.toml'),
    hasFile('requirements.txt'),
    hasFile('Pipfile'),
    hasFile('go.mod'),
    hasFile('Cargo.toml'),
    hasFile('build.gradle'),
    hasFile('pom.xml'),
  ]);

  // ── 确定主语言 ──
  if (hasPackageJson || hasTsConfig) {
    result.primaryLanguage = 'node.js';
  } else if (hasPyProject || hasRequirements || hasPipfile) {
    result.primaryLanguage = 'python';
  } else if (hasGoMod) {
    result.primaryLanguage = 'go';
  } else if (hasCargoToml) {
    result.primaryLanguage = 'rust';
  } else if (hasBuildGradle || hasPomXml) {
    result.primaryLanguage = 'java';
  }

  // ── Python 检测 ──
  result.hasPython = hasPyProject || hasRequirements || hasPipfile;

  // ── TypeScript 检测 ──
  result.hasTypeScript = hasTsConfig;

  // ── 解析 package.json ──
  if (hasPackageJson) {
    try {
      const raw = await readFile(join(projectDir, 'package.json'), 'utf-8');
      const pkg = JSON.parse(raw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const depNames = Object.keys(deps);

      // TypeScript 在依赖中
      if (depNames.includes('typescript')) {
        result.hasTypeScript = true;
      }

      // 框架检测
      if (depNames.includes('next')) {
        result.framework = 'next.js';
      } else if (depNames.includes('react')) {
        result.framework = 'react';
      } else if (depNames.includes('express')) {
        result.framework = 'express';
      } else if (depNames.includes('fastify')) {
        result.framework = 'fastify';
      } else if (depNames.includes('@angular/core')) {
        result.framework = 'angular';
      } else if (depNames.includes('vue')) {
        result.framework = 'vue';
      } else if (depNames.includes('svelte')) {
        result.framework = 'svelte';
      } else if (depNames.includes('@nestjs/core')) {
        result.framework = 'nestjs';
      }

      // 构建工具检测
      if (depNames.includes('vite')) {
        result.buildTool = 'vite';
      } else if (depNames.includes('webpack')) {
        result.buildTool = 'webpack';
      } else if (depNames.includes('esbuild')) {
        result.buildTool = 'esbuild';
      } else if (depNames.includes('rollup')) {
        result.buildTool = 'rollup';
      } else if (depNames.includes('parcel')) {
        result.buildTool = 'parcel';
      } else if (depNames.includes('turbopack')) {
        result.buildTool = 'turbopack';
      } else if (depNames.includes('tsup')) {
        result.buildTool = 'tsup';
      }

      // 测试框架检测
      if (depNames.includes('jest')) {
        result.testFramework = 'jest';
      } else if (depNames.includes('vitest')) {
        result.testFramework = 'vitest';
      } else if (depNames.includes('mocha')) {
        result.testFramework = 'mocha';
      } else if (depNames.includes('jasmine')) {
        result.testFramework = 'jasmine';
      } else if (depNames.includes('cypress')) {
        result.testFramework = 'cypress';
      } else if (depNames.includes('playwright')) {
        result.testFramework = 'playwright';
      }

      // 包管理器检测（通过 lock 文件）
      const hasYarnLock = await hasFile('yarn.lock');
      const hasPnpmLock = await hasFile('pnpm-lock.yaml');
      const hasPackageLock = await hasFile('package-lock.json');
      const hasBunLock = (await hasFile('bun.lockb')) || (await hasFile('bun.lock'));

      if (hasPnpmLock) {
        result.packageManager = 'pnpm';
      } else if (hasYarnLock) {
        result.packageManager = 'yarn';
      } else if (hasPackageLock || hasBunLock) {
        result.packageManager = 'npm';
      }
    } catch {
      // package.json 解析失败，优雅降级
    }
  }

  // ── Python 包管理器 ──
  if (result.primaryLanguage === 'python' && !result.packageManager) {
    if (hasPyProject) {
      result.packageManager = 'pip';
    } else if (hasPipfile) {
      result.packageManager = 'pip';
    } else if (hasRequirements) {
      result.packageManager = 'pip';
    }
  }

  // ── Go 包管理器 ──
  if (hasGoMod && !result.packageManager) {
    result.packageManager = 'go';
  }

  return result;
}
