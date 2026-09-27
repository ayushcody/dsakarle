import type { Metadata } from 'next';

import courseStructure from '@/content/course-structure.json';
import { getTopicBySlug } from '@/lib/content';
import type { RoadTopic } from '@/components/map/CurriculumRoad';

import { MapViews } from './MapViews';

export const metadata: Metadata = {
  title: 'Roadmap | DSA Karle',
  description: 'Your road through every data structure and algorithm, with progress tracked as you go.',
};

export default function MapPage() {
  const topics: RoadTopic[] = courseStructure.groups.flatMap((g) =>
    g.topics.map((t) => {
      const topic = getTopicBySlug(t.slug);
      return {
        slug: t.slug,
        title: t.title,
        group: g.title,
        difficulty: topic?.difficulty ?? 'beginner',
        minutes: topic?.estimatedMinutes ?? 30,
        summary: topic?.overview?.summary ?? '',
      };
    }),
  );

  return <MapViews topics={topics} />;
}
