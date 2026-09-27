import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TOPICS_DIR = path.join(ROOT, 'content', 'topics');
const PUBLIC_DIR = path.join(ROOT, 'public');

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const topics = fs
  .readdirSync(TOPICS_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, file), 'utf8')))
  .map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    category: topic.category,
    difficulty: topic.difficulty,
    tags: topic.tags || [],
    overview: {
      summary: topic.overview?.summary || '',
    },
  }));

fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(topics, null, 2));
console.log(`Wrote ${topics.length} topics to public/search-index.json`);

const all = fs
  .readdirSync(TOPICS_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, file), 'utf8')))
  .flatMap((topic) => [
    { kind: 'Topics', title: topic.title, subtitle: topic.overview?.summary || '', href: `/learn/${topic.slug}` },
    ...(topic.definition?.vocabulary || []).map((v) => ({
      kind: 'Concepts',
      title: v.term,
      subtitle: `${topic.title} · ${v.definition}`,
      href: `/learn/${topic.slug}`,
    })),
    ...(topic.practice || []).map((p) => ({
      kind: 'Practice Problems',
      title: p.title,
      subtitle: `${topic.title} · ${p.difficulty}`,
      href: p.url,
    })),
  ]);

fs.writeFileSync(path.join(PUBLIC_DIR, 'search-all.json'), JSON.stringify(all));
console.log(`Wrote ${all.length} entries to public/search-all.json`);
