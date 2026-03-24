import { notFound } from 'next/navigation';

import TopicPageRenderer from '@/components/topic/TopicPageRenderer';
import { getKnownTopicSlugs, getTopicBySlug } from '@/lib/content';

export async function generateStaticParams() {
  return getKnownTopicSlugs().map((slug) => ({ slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const topic = getTopicBySlug(params.slug);

  if (!topic) {
    notFound();
  }

  return <TopicPageRenderer data={topic} />;
}
