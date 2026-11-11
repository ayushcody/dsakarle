import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadCode, renderCode, renderSnippet } from '../../lib/code/render';

let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'dsakarle-code-'));
  const dir = path.join(root, 'content', 'code', 'demo');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'sum.py'), 'total = 0  # @init\nfor x in xs:\n    total += x  # @add\nreturn total  # @done\n');
  await writeFile(
    path.join(dir, 'sum.java'),
    'int total = 0;  // @init\nfor (int x : xs) {\n    total += x;  // @add\n}\nreturn total;  // @done\n',
  );
  await writeFile(
    path.join(dir, 'sum.cpp'),
    'int total = 0;  // @init\r\nfor (int x : xs) {\r\n    total += x;  // @add\r\n}\r\nreturn total;  // @done\r\n',
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('loadCode', () => {
  it('parses all three languages', async () => {
    const code = await loadCode('demo/sum', root);
    expect(code.python.anchors).toEqual({ init: [1], add: [3], done: [4] });
    expect(code.java.anchors).toEqual({ init: [1], add: [3], done: [5] });
    expect(code.cpp.source.includes('\r')).toBe(false);
  });

  it('throws a clear error when a file is missing', async () => {
    await expect(loadCode('demo/nope', root)).rejects.toThrow(/Code file missing for "demo\/nope"/);
  });
});

describe('renderCode', () => {
  it('adds data-line and data-anchor to the right lines and hides markers', async () => {
    const out = await renderCode('demo/sum', root);
    for (const lang of ['python', 'java', 'cpp'] as const) {
      const { html, anchors, lineCount } = out.langs[lang];
      expect(html).not.toContain('@init');
      expect(html).not.toContain('@add');
      expect(html).toMatch(/<span[^>]*data-line="1"[^>]*data-anchor="init"/);
      expect(html).not.toMatch(/data-line="2"[^>]*data-anchor/);
      expect(html).toContain('code-line');
      expect(html).toContain('--shiki-light');
      expect(html).toContain('--shiki-dark');
      expect(anchors.init).toEqual([1]);
      expect(lineCount).toBe(lang === 'python' ? 4 : 5);
    }
    expect(out.langs.python.html).toMatch(/data-line="3"[^>]*data-anchor="add"/);
  });
});

describe('renderSnippet', () => {
  it('renders a one-off snippet with line attributes', async () => {
    const html = await renderSnippet('a = 1  # @init\nb = 2', 'python');
    expect(html).toContain('data-line="2"');
    expect(html).not.toContain('@init');
  });
});
