import React from 'react';

const testimonials = [
  {
    quote: "The visual steppers made sliding window finally click for me. I used to memorize the template, now I actually understand why it works.",
    name: "Rahul M.",
    role: "Computer Science Student",
    initials: "RM",
    color: "bg-teal text-paper-raised",
  },
  {
    quote: "The clean UI matters more than people think. Studying algorithms here actually feels relaxing instead of stressful.",
    name: "Sneha P.",
    role: "SDE-1",
    initials: "SP",
    color: "bg-coral text-white",
  },
  {
    quote: "I love the pattern recognition quizzes. They force you to look at a problem and identify the underlying structure before writing a single line of code.",
    name: "Aman D.",
    role: "Final Year B.Tech",
    initials: "AD",
    color: "bg-amber text-ink",
  },
  {
    quote: "Every guide has Python, Java, JS, and C++. It's easily the best free resource for technical interview prep on the internet.",
    name: "Priya S.",
    role: "Frontend Engineer",
    initials: "PS",
    color: "bg-ink-3 text-paper-raised",
  }
];

export default function TestimonialsSection() {
  return (
    <section className="bg-paper py-24 px-6 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-[var(--text-primary)] mb-16">Stories from our learners</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-paper-raised p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-sm flex flex-col">
              <p className="font-dmsans text-[var(--text-secondary)] italic text-lg leading-relaxed mb-8 flex-grow">
                &quot;{t.quote}&quot;
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-dmsans font-bold `}>
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-dmsans font-bold text-[var(--text-primary)]">{t.name}</h4>
                  <p className="font-dmsans text-sm text-[var(--text-muted)]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
