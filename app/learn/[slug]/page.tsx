import { codeToHtml } from 'shiki';
import type { Properties } from 'hast';

import { ComingSoonTemplate } from '@/components/topic/ComingSoonTemplate';
import { TopicPageRenderer } from '@/components/topic/TopicPageRenderer';
import { getAllTopicSlugs, getTopicBySlug } from '@/lib/content';
import type { CodeLanguage } from '@/types/learning';

export async function generateStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ slug }));
}

async function renderCodeBlocks(sourceByLanguage: Record<CodeLanguage, string>) {
  const renderedCode = {} as Record<CodeLanguage, string>;

  for (const lang of ['python', 'javascript', 'java', 'cpp'] as const) {
    renderedCode[lang] = await codeToHtml(sourceByLanguage[lang] || '', {
      lang,
      theme: 'github-light',
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
    return <ComingSoonTemplate slug={params.slug} />;
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
