/**
 * 命令执行器
 *
 * 提供命令可用性检测及安全执行能力，基于 node:child_process 的 spawn。
 */

import { spawn } from 'node:child_process';

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

/**
 * 检测命令是否可用（macOS/Linux 使用 `which`）
 *
 * @param cmd - 要检测的命令名
 * @returns 命令存在返回 true，否则 false
 */
export async function checkCommand(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('which', [cmd], { stdio: 'pipe' });

    child.on('error', () => {
      resolve(false);
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * 执行外部命令
 *
 * @param cmd - 命令名
 * @param args - 参数列表
 * @param options - 可选配置（cwd 等）
 * @returns CommandResult（不抛错，错误信息在 stderr 和 code 中）
 */
export async function execute(
  cmd: string,
  args: string[] = [],
  options: { cwd?: string } = {}
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const child = spawn(cmd, args, {
      cwd: options.cwd,
      stdio: 'pipe',
    });

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        stdout: '',
        stderr: err.message,
        code: 1,
      });
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
        code: code ?? 1,
      });
    });
  });
}
