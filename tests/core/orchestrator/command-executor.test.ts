import { describe, it, expect } from 'vitest';
import { checkCommand, execute } from '../../../src/core/orchestrator/command-executor.js';

describe('command-executor', () => {
  describe('checkCommand', () => {
    it('should return true for existing command (node)', async () => {
      const result = await checkCommand('node');
      expect(result).toBe(true);
    });

    it('should return false for nonexistent command', async () => {
      const result = await checkCommand('nonexistent_command_xyz');
      expect(result).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute echo successfully', async () => {
      const result = await execute('echo', ['hello']);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('hello');
      expect(result.code).toBe(0);
    });

    it('should return failure for false command', async () => {
      const result = await execute('false');
      expect(result.success).toBe(false);
    });

    it('should return failure for nonexistent command', async () => {
      const result = await execute('nonexistent_cmd');
      expect(result.success).toBe(false);
    });
  });
});
