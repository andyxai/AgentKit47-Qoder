import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { renderTemplate, loadTemplate } from '../../../src/core/generator/template-engine.js';

describe('template-engine', () => {
  describe('renderTemplate', () => {
    it('should replace simple variables', () => {
      const result = renderTemplate('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should handle conditional blocks', () => {
      const template = '{{#flag}}enabled{{/flag}}{{^flag}}disabled{{/flag}}';
      expect(renderTemplate(template, { flag: true })).toBe('enabled');
      expect(renderTemplate(template, { flag: false })).toBe('disabled');
    });

    it('should handle loops', () => {
      const template = '{{#items}}{{name}},{{/items}}';
      const result = renderTemplate(template, { items: [{ name: 'a' }, { name: 'b' }] });
      expect(result).toBe('a,b,');
    });

    it('should support partials', () => {
      const template = 'Header: {{>header}}';
      const partials = { header: 'Hello' };
      const result = renderTemplate(template, {}, partials);
      expect(result).toBe('Header: Hello');
    });
  });

  describe('loadTemplate', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'ak47-test-'));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('should load template from file', async () => {
      const templatePath = join(tempDir, 'test.md');
      writeFileSync(templatePath, 'Hello {{name}}!', 'utf-8');
      const result = await loadTemplate(templatePath);
      expect(result).toBe('Hello {{name}}!');
    });

    it('should return empty string for non-existent file', async () => {
      const result = await loadTemplate(join(tempDir, 'nonexistent.md'));
      expect(result).toBe('');
    });
  });
});
