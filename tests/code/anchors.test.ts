import { describe, expect, it } from 'vitest';
import { anchorLines, checkAnchorParity, parseCode } from '../../lib/code/anchors';

describe('parseCode', () => {
  it('strips a marker-only comment and trailing whitespace', () => {
    const p = parseCode('x = 1  # @init', 'python');
    expect(p.source).toBe('x = 1');
    expect(p.anchors).toEqual({ init: [1] });
  });

  it('strips // markers for java and cpp', () => {
    expect(parseCode('int a = 0;   // @expand-step', 'java').source).toBe('int a = 0;');
    expect(parseCode('int a = 0;\t// @x1', 'cpp').anchors).toEqual({ x1: [1] });
  });

  it('keeps real comment text before the marker', () => {
    const p = parseCode('x = 1  # start empty @init', 'python');
    expect(p.source).toBe('x = 1  # start empty');
    expect(p.anchors).toEqual({ init: [1] });
    expect(parseCode('int x;  // start empty @init', 'java').source).toBe('int x;  // start empty');
  });

  it('records several anchors with 1-based lines', () => {
    const p = parseCode('a = 1  # @init\nb = 2\nc = 3  # @expand\nreturn c  # @done', 'python');
    expect(p.source).toBe('a = 1\nb = 2\nc = 3\nreturn c');
    expect(p.anchors).toEqual({ init: [1], expand: [3], done: [4] });
  });

  it('allows the same anchor on several lines', () => {
    const p = parseCode('a = 1  # @step\nb = 2\nc = 3  # @step', 'python');
    expect(p.anchors).toEqual({ step: [1, 3] });
    expect(anchorLines(p, 'step')).toEqual([1, 3]);
    expect(anchorLines(p, 'nope')).toEqual([]);
  });

  it('ignores Java annotations at line start', () => {
    const p = parseCode('@Override\npublic int f() {  // @init\n}', 'java');
    expect(p.source).toBe('@Override\npublic int f() {\n}');
    expect(p.anchors).toEqual({ init: [2] });
  });

  it("ignores '@' inside strings", () => {
    expect(parseCode('s = "a@b"', 'python').anchors).toEqual({});
    expect(parseCode('String s = "x // @b";', 'java').anchors).toEqual({});
    expect(parseCode('s = "a # b"  # @init', 'python')).toEqual({ source: 's = "a # b"', anchors: { init: [1] } });
  });

  it('ignores whole-line comments, mid-comment ids, bad ids and the wrong comment style', () => {
    expect(parseCode('# @init', 'python').anchors).toEqual({});
    expect(parseCode('x = 1  # @init later', 'python').anchors).toEqual({});
    expect(parseCode('x = 1  # @Init', 'python').anchors).toEqual({});
    expect(parseCode('x = 1  // @init', 'python').anchors).toEqual({});
    expect(parseCode('int x;  # @init', 'java').anchors).toEqual({});
  });

  it('normalises CRLF and strips a single trailing newline', () => {
    const p = parseCode('a = 1  # @init\r\nb = 2\r\n', 'python');
    expect(p.source).toBe('a = 1\nb = 2');
    expect(p.anchors).toEqual({ init: [1] });
    expect(parseCode('a\n\n', 'python').source).toBe('a\n');
  });
});

describe('checkAnchorParity', () => {
  const mk = (anchors: Record<string, number[]>) => ({ source: '', anchors });

  it('passes when all languages share anchors', () => {
    const r = checkAnchorParity({ python: mk({ a: [1] }), java: mk({ a: [2] }), cpp: mk({ a: [3] }) });
    expect(r.missing).toEqual([]);
  });

  it('reports anchors missing from any language', () => {
    const r = checkAnchorParity({ python: mk({ a: [1], b: [2] }), java: mk({ a: [1] }), cpp: mk({ a: [1], b: [4] }) });
    expect(r.missing).toEqual([{ anchor: 'b', lang: 'java' }]);
  });
});
