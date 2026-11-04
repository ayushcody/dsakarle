import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LessonPage } from '@/components/lesson/LessonPage';
import type { RenderedCodeProp } from '@/components/stage/contracts';
import { getAllTopicSlugs, getTopicBySlug } from '@/lib/content';
import { getLessonMeta } from '@/lib/curriculum';
import { renderCode } from '@/lib/code/render';
import type { LessonV2 } from '@/types/learning';

export async function generateStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const meta = getLessonMeta(params.slug);
  if (!meta) {
    return { title: 'Lesson not found — DSA Karle' };
  }
  return { title: `${meta.title} — DSA Karle`, description: meta.oneLiner };
}

/** Server-render every code ref a v2 lesson uses once. A missing file omits that code instead of crashing the page. */
async function renderLessonCode(lesson: LessonV2): Promise<Record<string, RenderedCodeProp>> {
  const refs = new Set<string>([lesson.template.tracer]);
  for (const example of lesson.examples) refs.add(example.code);
  for (const track of lesson.stage.tracks) refs.add(track.tracer);

  const code: Record<string, RenderedCodeProp> = {};
  await Promise.all(
    Array.from(refs).map(async (ref) => {
      try {
        code[ref] = await renderCode(ref as `${string}/${string}`);
      } catch (error) {
        console.error(`[learn/${lesson.slug}] could not render code "${ref}":`, error);
      }
    }),
  );
  return code;
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  // getTopicBySlug returns null for anything that is not a curriculum lesson with schemaVersion 2.
  const lesson = getTopicBySlug(params.slug);
  const meta = getLessonMeta(params.slug);
  if (!lesson || !meta) {
    notFound();
  }

  const code = await renderLessonCode(lesson);
  return <LessonPage lesson={lesson} meta={meta} code={code} />;
}
