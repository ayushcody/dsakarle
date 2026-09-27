import React from 'react';

const testimonials = [
  {
    quote: "The visual steppers made sliding window finally click for me. I used to memorize the template, now I actually understand why it works.",
    name: "Rahul M.",
    role: "Computer Science Student",
    initials: "RM",
    color: "bg-[#1D7A6B]",
  },
  {
    quote: "The clean UI matters more than people think. Studying algorithms here actually feels relaxing instead of stressful.",
    name: "Sneha P.",
    role: "SDE-1",
    initials: "SP",
    color: "bg-[#D4603A]",
  },
  {
    quote: "I love the pattern recognition quizzes. They force you to look at a problem and identify the underlying structure before writing a single line of code.",
    name: "Aman D.",
    role: "Final Year B.Tech",
    initials: "AD",
    color: "bg-[#C8900A]",
  },
  {
    quote: "Every guide has Python, Java, JS, and C++. It's easily the best free resource for technical interview prep on the internet.",
    name: "Priya S.",
    role: "Frontend Engineer",
    initials: "PS",
    color: "bg-[#6B6860]",
  }
];

export default function TestimonialsSection() {
  const loop = [...testimonials, ...testimonials];
  return (
    <section className="overflow-hidden border-t border-[var(--border)] bg-[var(--bg-primary)] py-24">
      <h2 className="mb-14 px-6 text-center font-dmsans text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">What learners say</h2>
      <div className="marquee-mask">
        <div className="marquee-track flex w-max gap-6">
          {loop.map((t, idx) => (
            <figure key={idx} aria-hidden={idx >= testimonials.length} className="flex w-[340px] shrink-0 flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--white)] p-7 shadow-[var(--shadow-card)]">
              <blockquote className="mb-6 flex-grow font-dmsans text-[17px] leading-relaxed text-[var(--text-secondary)]">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full font-dmsans text-sm font-bold text-white ${t.color}`}>{t.initials}</span>
                <span>
                  <span className="block font-dmsans font-bold text-[var(--text-primary)]">{t.name}</span>
                  <span className="block font-dmsans text-sm text-[var(--text-muted)]">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
