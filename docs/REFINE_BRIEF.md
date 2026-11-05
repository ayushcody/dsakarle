# Refine brief — "elegant like The Odin Project"

The user loves the site, but wants it **more refined, smoother and more elegant, like theodinproject.com**. The lesson engine stays. What changes is tone, layout and information architecture.

## What Odin does (measured from its live DOM)
- **Fonts.** Inter for everything: headings, body and UI.
- **Type scale.**
  - Lesson H1: 30px/36, weight 600.
  - Section headings: 20px/32, weight 600.
  - Body: 16px/28 in grey-700.
- **Colour.** Cool neutral greys: page `#f9fafb`, cards white, headings `#1f2937`, body `#374151`, muted `#6b7280`. One accent colour, and only for links, progress and the primary call to action.
- **Calm.** No ornament. Small uppercase type labels ("PATH", "Lesson", "Project") are the only eyebrows. Cards are flat with thin borders, a 6–8px radius and almost no shadow.
- **Lesson page.**
  - A left "course contents" sidebar: back-to-course link, course title, lesson list with check circles.
  - A centred single reading column.
  - Anchor-linked section headings in this order: Introduction → Lesson overview (verb-led bullets) → content sections → Assignment → Knowledge check → Additional resources.
  - Quiet utility links at the bottom ("Edit on GitHub", "Report an issue").
  - A symmetric Previous / Next pair, each a white button with a 6px radius.
- **Information architecture.** Paths → courses → lessons. The paths page has big cards (badge, PATH label, title, lesson count, blurb, "Explore"). A course or path page has an overview paragraph, then sections, each a list of lesson rows with a type label and a progress circle.
- **Voice.** Warm, direct, second person, encouraging ("hang in there").

## Our decisions (all agents follow these)
1. **Typography.**
   - **Inter** for headings and body, replacing DM Sans; keep the CSS variable name `--font-sans`.
   - Headings become sans: all `.t-h1`, `.t-h2` and `.t-h3` use Inter 600.
   - **Fraunces** survives only as `.t-display` for the single home hero headline, as a brand moment.
   - **JetBrains Mono** stays for code and values; **Caveat** stays only for diagram callouts.
2. **Palette.**
   - Neutral and quiet, with a hint of warmth (stone, not cool blue-grey): paper is near-white and cards are white.
   - **Coral-ink** is the single accent: links, primary CTA, progress, active nav.
   - The other role colours (teal, indigo, amber, green, red) appear **only inside diagrams and quiz feedback**, never as decoration.
   - Dark mode mirrors this: near-black neutral with a warm tint.
   - Keep every existing token name; change values and add tokens only. Everything must keep WCAG AA.
3. **Shape.**
   - Radius 8 for cards and 6 for buttons and inputs.
   - Borders are a 1px neutral rule. Shadow only on hover, and subtle.
   - Graph paper stays on the Stage only, but much fainter.
4. **Rhythm.**
   - The reading column is about 720px wide, with 16/28 body text.
   - Sections are 56px apart and section headings are anchor links (a `#` appears on hover).
   - Fewer chips: at most one metadata line under a title (e.g. "Lesson 3 of 7 · 25 min · Beginner").
5. **Information architecture.**
   - `/paths` lists all paths; `/paths/[id]` shows one path with its sections and lesson rows.
   - `/learn` permanently redirects to `/paths`. Lesson URLs stay `/learn/[slug]`.
   - `/dashboard` shows your progress per path and a continue button.
   - `/gym` holds the mixed pattern-recognition drills.
   - Header nav: Paths, Gym, Practice, Map, About. The progress ring links to `/dashboard`.
6. **Lesson page.** It becomes Odin-like, with the interactive Stage as the hero section in the middle (see the lesson agent's brief).
7. **Voice.** Warm, direct and encouraging. No fake data, ever.

## Data you can rely on
- `lib/curriculum.ts`: `PATHS`, `getPath(id)`, `pathLessons(id)`, `placeOf(slug)` (path, section, number, total), plus the existing `LESSONS`, `getLessonMeta`, `getNeighbours`.
- `LessonV2.overview?: string[]` and `LessonV2.resources?: { title, url, note }[]` (types/learning.ts). Content agents are filling these in for all 23 lessons right now, so render them when present.
- Progress: `hooks/useProgress.ts`, `lib/progress.ts` (completedSections = completed lesson slugs, lastVisited, quizScores), `lib/course.ts`.
- Practice "solved" state: localStorage `dsakarle-solved` (an array of URLs).

## Quality bar
- Responsive at 375, 768, 1024 and 1440 with no horizontal overflow.
- Light and dark mode.
- Keyboard and screen-reader friendly; AA contrast; tap targets of 40px or more.
- `npx tsc --noEmit`, `npm run lint` and `npm test` must stay green.
- Respect `prefers-reduced-motion`.
