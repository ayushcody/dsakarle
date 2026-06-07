import HeroSection from '@/components/home/HeroSection';
import CourseCatalog from '@/components/home/CourseCatalog';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import DemoSection from '@/components/home/DemoSection';
import PhilosophySection from '@/components/home/PhilosophySection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CTABanner from '@/components/home/CTABanner';

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <HeroSection />
      <CourseCatalog />
      <HowItWorksSection />
      <DemoSection />
      <PhilosophySection />
      <TestimonialsSection />
      <CTABanner />
    </div>
  );
}
