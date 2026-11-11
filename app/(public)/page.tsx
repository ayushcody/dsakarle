import type { Metadata } from 'next';

import { ClosingCta } from '@/components/home/ClosingCta';
import { Continue } from '@/components/home/Continue';
import { GymTeaser } from '@/components/home/GymTeaser';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { PathCards } from '@/components/home/PathCards';

export const metadata: Metadata = {
  title: 'DSA Karle — learn DSA by watching it run',
  description:
    'Data structures and algorithms, visually. Watch real algorithms step by step, predict the next move, try your own input, then practise on real LeetCode problems.',
};

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <PathCards />
      <Continue />
      <GymTeaser />
      <ClosingCta />
    </>
  );
}
