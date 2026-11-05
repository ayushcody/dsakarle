/**
 * `npm run validate` — checks content/curriculum.json, content/topics/*.json
 * and content/code/** against the rules in lib/content-schema.ts.
 *
 * Exit 1 if any error (live-lesson problems, curriculum problems); warnings
 * (draft lessons) never fail. Pass --verbose to print every warning.
 */
import fs from 'node:fs';
import path from 'node:path';
import { JsonParseError, validateAll } from '../lib/content-schema';
import type { Issue } from '../lib/content-schema';

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return new JsonParseError(error instanceof Error ? error.message : String(error));
  }
}

function groupBySlug(issues: Issue[]): Map<string, Issue[]> {
  const grouped = new Map<string, Issue[]>();
  for (const issue of issues) {
    const list = grouped.get(issue.slug) ?? [];
    list.push(issue);
    grouped.set(issue.slug, list);
  }
  return grouped;
}

function describe(issue: Issue): string {
  return `${issue.path ? `${issue.path}: ` : ''}${issue.message}`;
}

function ruleSummary(issues: Issue[]): string {
  const counts = new Map<string, number>();
  for (const issue of issues) counts.set(issue.rule, (counts.get(issue.rule) ?? 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([rule, n]) => `${rule}×${n}`).join(', ');
}

// --- load ------------------------------------------------------------------

const curriculumFile = path.join(CONTENT, 'curriculum.json');
const curriculum = fs.existsSync(curriculumFile) ? readJson(curriculumFile) : new JsonParseError('file not found');
if (curriculum instanceof JsonParseError) {
  console.error(`content/curriculum.json: ${curriculum.message}`);
  process.exit(1);
}

const lessons: Record<string, unknown> = {};
const topicsDir = path.join(CONTENT, 'topics');
if (fs.existsSync(topicsDir)) {
  for (const name of fs.readdirSync(topicsDir).sort()) {
    if (name.endsWith('.json')) lessons[name.slice(0, -'.json'.length)] = readJson(path.join(topicsDir, name));
  }
}

const codeFiles: Record<string, string> = {};
const codeDir = path.join(CONTENT, 'code');
if (fs.existsSync(codeDir)) {
  for (const file of walk(codeDir)) {
    codeFiles[path.relative(codeDir, file).split(path.sep).join('/')] = fs.readFileSync(file, 'utf8');
  }
}

// --- run -------------------------------------------------------------------

const { errors, warnings } = validateAll({ curriculum, lessons, codeFiles });

const meta = (curriculum as { lessons?: Array<{ status?: string }> }).lessons ?? [];
const liveCount = meta.filter((lesson) => lesson.status === 'live').length;
console.log(
  `Content: ${meta.length} lessons (${liveCount} live, ${meta.length - liveCount} draft), ` +
    `${Object.keys(lessons).length} topic files, ${Object.keys(codeFiles).length} code files`,
);

if (errors.length > 0) {
  console.log(`\nERRORS (${errors.length})`);
  for (const [slug, issues] of Array.from(groupBySlug(errors))) {
    console.log(`  ${slug}`);
    for (const issue of issues) console.log(`    x [${issue.rule}] ${describe(issue)}`);
  }
}

if (warnings.length > 0) {
  const grouped = groupBySlug(warnings);
  console.log(`\nWARNINGS (${warnings.length} across ${grouped.size} draft lesson${grouped.size === 1 ? '' : 's'})`);
  for (const [slug, issues] of Array.from(grouped)) {
    if (verbose) {
      console.log(`  ${slug} (${issues.length})`);
      for (const issue of issues) console.log(`    ! [${issue.rule}] ${describe(issue)}`);
    } else {
      console.log(`  ${slug.padEnd(24)} ${String(issues.length).padStart(3)}  ${ruleSummary(issues)}`);
    }
  }
  if (!verbose) console.log('  (run with --verbose for every warning)');
}

console.log(`\n${errors.length === 0 ? 'OK' : 'FAILED'}: ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`);
process.exit(errors.length > 0 ? 1 : 0);
