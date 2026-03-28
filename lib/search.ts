import Fuse from 'fuse.js';

import type { TopicMeta } from '@/types/learning';

let fuseInstance: Fuse<TopicMeta> | null = null;

export async function getSearchIndex(): Promise<Fuse<TopicMeta>> {
  if (fuseInstance) {
    return fuseInstance;
  }

  const response = await fetch('/search-index.json');
  const data = (await response.json()) as TopicMeta[];
  fuseInstance = new Fuse(data, {
    threshold: 0.35,
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'tags', weight: 0.3 },
      { name: 'overview.summary', weight: 0.2 },
    ],
  });

  return fuseInstance;
}
