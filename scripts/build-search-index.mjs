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
