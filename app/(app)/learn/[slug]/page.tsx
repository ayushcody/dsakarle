import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { codeToHtml } from 'shiki';
import type { Properties } from 'hast';

import { LessonPage } from '@/components/lesson/LessonPage';
import { ComingSoonTemplate } from '@/components/topic/ComingSoonTemplate';
import { TopicPageRenderer } from '@/components/topic/TopicPageRenderer';
import type { RenderedCodeProp } from '@/components/stage/contracts';
import { getAllTopicSlugs, getTopicBySlug } from '@/lib/content';
import { getLessonMeta } from '@/lib/curriculum';
import { renderCode } from '@/lib/code/render';
import { isLessonV2 } from '@/types/learning';
import type { CodeLanguage, LessonV2 } from '@/types/learning';

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

async function renderCodeBlocks(sourceByLanguage: Record<CodeLanguage, string>) {
  const renderedCode = {} as Record<CodeLanguage, string>;

  for (const lang of ['python', 'javascript', 'java', 'cpp'] as const) {
    renderedCode[lang] = await codeToHtml(sourceByLanguage[lang] || '', {
      lang,
      // Dual themes: tokens carry --shiki-light/--shiki-dark; globals.css picks one per [data-theme].
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      transformers: [
        {
          line(node, line) {
            const properties = (node.properties || {}) as Properties;
            properties['data-line'] = line;
            properties.class = 'code-line';
            node.properties = properties;
          },
        },
      ],
    });
  }

  return renderedCode;
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const topic = getTopicBySlug(params.slug);

  if (!topic) {
    notFound();
  }

  if (isLessonV2(topic)) {
    const meta = getLessonMeta(params.slug);
    if (!meta) {
      notFound();
    }
    const code = await renderLessonCode(topic);
    return <LessonPage lesson={topic} meta={meta} code={code} />;
  }

  if (topic.comingSoon) {
    return <ComingSoonTemplate slug={params.slug} />;
  }

  const baseCode = topic.examples?.[0]?.code || {
    python: '',
    javascript: '',
    java: '',
    cpp: '',
  };

  const renderedCode = await renderCodeBlocks(baseCode);

  return <TopicPageRenderer topic={topic} renderedCode={renderedCode} />;
}
