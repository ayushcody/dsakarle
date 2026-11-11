import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CURRICULUM_PATH = path.join(ROOT, 'content', 'curriculum.json');
const PUBLIC_DIR = path.join(ROOT, 'public');

// Same mapping as lib/content.ts: curriculum group id -> catalog category.
const CATEGORY_BY_GROUP = {
  'data-structures': 'data-structure',
  algorithms: 'algorithm',
};

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const curriculum = JSON.parse(fs.readFileSync(CURRICULUM_PATH, 'utf8'));

// Shape matches TopicMeta in types/learning.ts, which lib/search.ts (Fuse) reads.
const entries = curriculum.lessons.map((lesson) => {
  const category = CATEGORY_BY_GROUP[lesson.group];
  if (!category) {
    throw new Error(`Lesson "${lesson.slug}" has unknown group "${lesson.group}"`);
  }

  const trigger = lesson.trigger || '';

  return {
    id: lesson.slug,
    slug: lesson.slug,
    title: lesson.title,
    category,
    difficulty: lesson.difficulty,
    trigger,
    tags: [category, trigger].filter(Boolean),
    overview: {
      summary: lesson.oneLiner || '',
    },
  };
});

fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(entries, null, 2));
console.log(`Wrote ${entries.length} lessons to public/search-index.json`);
