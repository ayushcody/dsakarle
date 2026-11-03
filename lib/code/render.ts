/**
 * Canonical code loading + Shiki rendering. SERVER ONLY: uses node:fs and a
 * module-level Shiki highlighter. Import from server components / scripts
 * (the `server-only` package is not installed, so this is by convention).
 *
 * Output conventions match the learn page's transformer: each line span gets
 * `data-line="<n>"` and class `code-line`; anchored lines additionally get
 * `data-anchor="<id>"`. Tokens carry --shiki-light / --shiki-dark variables.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHighlighter } from 'shiki';
import type { Highlighter, ShikiTransformer } from 'shiki';

import { CODE_EXT, LANGS } from '../engine/types';
import type { AnchorId, CodeRef, Lang, ParsedCode } from '../engine/types';
import { parseCode } from './anchors';

export interface RenderedLang {
  html: string;
  anchors: Record<AnchorId, number[]>;
  lineCount: number;
}
export interface RenderedCode {
  langs: Record<Lang, RenderedLang>;
}

const THEMES = { light: 'github-light', dark: 'github-dark' } as const;

let highlighterPromise: Promise<Highlighter> | null = null;
function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [THEMES.light, THEMES.dark],
    langs: ['python', 'java', 'cpp'],
  });
  return highlighterPromise;
}

/** Read and parse content/code/<ref>.{py,java,cpp}. `root` defaults to process.cwd(). */
export async function loadCode(ref: CodeRef, root: string = process.cwd()): Promise<Record<Lang, ParsedCode>> {
  const out = {} as Record<Lang, ParsedCode>;
  await Promise.all(
    LANGS.map(async (lang) => {
      const file = path.join(root, 'content', 'code', `${ref}.${CODE_EXT[lang]}`);
      let raw: string;
      try {
        raw = await fs.readFile(file, 'utf8');
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') {
          throw new Error(`Code file missing for "${ref}" (${lang}): expected ${file}`);
        }
        throw err;
      }
      out[lang] = parseCode(raw, lang);
    }),
  );
  return out;
}

async function highlight(parsed: ParsedCode, lang: Lang): Promise<RenderedLang> {
  const byLine = new Map<number, AnchorId>();
  for (const [id, lines] of Object.entries(parsed.anchors)) for (const n of lines) byLine.set(n, id);

  const transformer: ShikiTransformer = {
    line(node, line) {
      node.properties['data-line'] = line;
      const anchor = byLine.get(line);
      if (anchor) node.properties['data-anchor'] = anchor;
      this.addClassToHast(node, 'code-line');
    },
  };

  const highlighter = await getHighlighter();
  const html = highlighter.codeToHtml(parsed.source, {
    lang,
    themes: THEMES,
    defaultColor: false,
    transformers: [transformer],
  });
  const lineCount = parsed.source === '' ? 0 : parsed.source.split('\n').length;
  return { html, anchors: parsed.anchors, lineCount };
}

/** Load and highlight all three languages of a canonical code ref. */
export async function renderCode(ref: CodeRef, root?: string): Promise<RenderedCode> {
  const parsed = await loadCode(ref, root);
  const langs = {} as Record<Lang, RenderedLang>;
  for (const lang of LANGS) langs[lang] = await highlight(parsed[lang], lang);
  return { langs };
}

/** One-off snippet (no anchors unless the code carries markers, which are stripped). */
export async function renderSnippet(code: string, lang: Lang): Promise<string> {
  return (await highlight(parseCode(code, lang), lang)).html;
}
