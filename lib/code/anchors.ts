/**
 * Anchor parsing for canonical code files. Pure and isomorphic: no fs, no Node
 * APIs. Relative imports only so it runs under tsx, vitest and Next alike.
 *
 * A line is anchored by a trailing comment ending in `@<id>`:
 *   x = 1            # @init          -> `x = 1`
 *   x = 1  # start empty @init        -> `x = 1  # start empty`
 * Only a real comment counts (the comment start is found with string-literal
 * awareness), so `"a@b"` and a line-leading Java `@Override` are never anchors.
 */
import type { AnchorId, Lang, ParsedCode } from '../engine/types';
import { LANGS } from '../engine/types';

const COMMENT_MARKER: Record<Lang, string> = { python: '#', java: '//', cpp: '//' };

/** Optional comment text, then `@id` as the last token of the comment. */
const MARKER_RE = /^(.*?)(?:^|\s)@([a-z0-9-]+)\s*$/;

/** Index where a real (non-string) comment starts, or -1. */
function findCommentStart(line: string, marker: string): number {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (line.startsWith(marker, i)) return i;
  }
  return -1;
}

/** Strip a single trailing marker from one line; returns the new line and anchor id. */
function stripLine(line: string, markers: readonly string[]): { text: string; anchor: AnchorId | null } {
  for (const marker of markers) {
    const start = findCommentStart(line, marker);
    if (start < 0) continue;
    const code = line.slice(0, start);
    if (code.trim() === '') continue; // whole-line comments never anchor
    const match = MARKER_RE.exec(line.slice(start + marker.length).trim());
    if (!match) continue;
    const comment = match[1].trim();
    const text = comment === '' ? code : `${code}${marker} ${comment}`;
    return { text: text.replace(/\s+$/, ''), anchor: match[2] };
  }
  return { text: line, anchor: null };
}

function parseWithMarkers(raw: string, markers: readonly string[]): ParsedCode {
  const normalised = raw.replace(/\r\n?/g, '\n').replace(/\n$/, '');
  const anchors: Record<AnchorId, number[]> = {};
  const lines = normalised.split('\n').map((line, index) => {
    const { text, anchor } = stripLine(line, markers);
    if (anchor) (anchors[anchor] ??= []).push(index + 1);
    return text;
  });
  return { source: lines.join('\n'), anchors };
}

/** Parse one canonical code file: strip anchor markers, record 1-based lines per anchor. */
export function parseCode(raw: string, lang: Lang): ParsedCode {
  return parseWithMarkers(raw, [COMMENT_MARKER[lang]]);
}

/** Language-agnostic variant (accepts `#` and `//`); prefer `parseCode` when the language is known. */
export function parseCodeAnyLang(raw: string): ParsedCode {
  return parseWithMarkers(raw, ['#', '//']);
}

/** 1-based line numbers carrying `anchor` (empty when absent). */
export function anchorLines(parsed: ParsedCode, anchor: AnchorId): number[] {
  return parsed.anchors[anchor] ?? [];
}

/** Every anchor present in any language must be present in all three. */
export function checkAnchorParity(parsedByLang: Record<Lang, ParsedCode>): {
  missing: Array<{ anchor: AnchorId; lang: Lang }>;
} {
  const all = new Set<AnchorId>();
  for (const lang of LANGS) for (const id of Object.keys(parsedByLang[lang]?.anchors ?? {})) all.add(id);
  const missing: Array<{ anchor: AnchorId; lang: Lang }> = [];
  for (const anchor of Array.from(all)) {
    for (const lang of LANGS) {
      if (!parsedByLang[lang] || !(anchor in parsedByLang[lang].anchors)) missing.push({ anchor, lang });
    }
  }
  return { missing };
}
