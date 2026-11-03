import { getLessonMeta } from '@/lib/curriculum';

export interface StartPath {
  id: string
  title: string
  blurb: string
  /** Lesson slugs, in the order to read them. */
  slugs: string[]
}

const PATHS: StartPath[] = [
  {
    id: 'brand-new',
    title: 'Brand new',
    blurb: 'Start with the foundation, then your first two patterns.',
    slugs: ['arrays', 'two-pointers', 'sliding-window'],
  },
  {
    id: 'interview-week',
    title: 'Interview in a week',
    blurb: 'The moves that show up again and again.',
    slugs: ['hash-maps', 'two-pointers', 'binary-search', 'bfs-dfs'],
  },
  {
    id: 'trees-graphs',
    title: 'Trees and graphs',
    blurb: 'Recursion first, then everything with branches.',
    slugs: ['recursion', 'trees', 'graphs', 'bfs-dfs'],
  },
];

/** Suggested paths, with any slug that is not in the curriculum dropped. */
export const START_PATHS: StartPath[] = PATHS.map((path) => ({
  ...path,
  slugs: path.slugs.filter((slug) => getLessonMeta(slug) !== undefined),
}));
