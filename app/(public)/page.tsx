import type { Metadata } from 'next';

import { ClosingCta } from '@/components/home/ClosingCta';
import { Continue } from '@/components/home/Continue';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { PatternShelf } from '@/components/home/PatternShelf';
import { Principles } from '@/components/home/Principles';

export const metadata: Metadata = {
  title: 'DSA Karle — learn DSA by watching it run',
  description:
    'Data structures and algorithms, visually. Picture the idea, watch it run step by step, predict the next move, try your own input, then read the code in Python, Java or C++.',
};

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <PatternShelf />
      <Principles />
      <Continue />
      <ClosingCta />
    </>
  );
}
