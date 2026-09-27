# DSA Karle — Project Brain

Living notes on what this project is, how it hangs together, where it stands, and the non-obvious details that bite. Update it when something here stops being true.

_Last updated: 2026-09-27_

---

## 1. What it is

A visual-first DSA learning platform for engineering students. Each topic teaches through a real-world hook, a definition, a mental model diagram, a step-through visualization synced to code, quizzes, worked examples in 4 languages, and curated LeetCode practice. Progress lives in the browser (no backend, no accounts).

Surfaces:

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/learn` | Curriculum index |
| `/learn/[slug]` | Topic page (statically generated per topic) |
| `/map` | Roadmap: CurriculumRoad (default) + Pattern Graph toggle |
| `/practice` | Practice Hub |
| `/about` | About |

## 2. Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind 3 · Framer Motion · Zustand (stepper state) · Shiki (build-time code highlighting) · Fuse.js (search) · D3 (pattern graph only) · canvas-confetti.

## 3. Commands

```bash
npm install
npm run dev                # http://localhost:3000
npm run build              # prebuild regenerates public/search-*.json
npm run start -- -p 3100   # serve production build
npm run typecheck
npm run lint
node scripts/gen-steppers.mjs   # regenerate topic walkthroughs (see §6)
```

## 4. Layout

```
app/
  layout.tsx            root: metadata, no-flash theme script
  template.tsx          CSS page fade (see gotchas)
  (public)/             Navbar + Footer layout: /, /practice, /map, /about
  (app)/learn/          LearningTopBar layout; [slug]/page.tsx renders Shiki code at build
components/
  topic/                TopicPageRenderer + every topic section
  diagrams/             DiagramRouter + Array/LinkedList/Stack/DP + NodeGraphDiagram (tree/graph/hash-map)
  map/                  CurriculumRoad (road), PatternMap (D3 graph)
  home/                 landing sections
  layout/               Navbar (+ThemeToggle, SearchTrigger), SearchModal, Sidebar, LearningTopBar
  badges/               per-topic SVG icons; registry.tsx maps slug → badge
content/
  course-structure.json SOURCE OF TRUTH for topic order + groups
  topics/*.json         one file per topic (all teaching content)
  practice-problems.ts  flattens topic `practice` arrays for the Practice Hub
lib/
  progress.ts           topic completion + quiz scores (localStorage)
  practiceProgress.ts   solved/attempted/streak (localStorage)
  content.ts            server-side topic loading
scripts/
  build-search-index.mjs  writes public/search-index.json + public/search-all.json
  gen-steppers.mjs        simulates algorithms → writes stepper + mentalModel into topic JSON
```

## 5. Data model essentials

- **Topic order/groups** come only from `content/course-structure.json` (2 groups: Data Structures, Algorithms; 22 topics). Sidebar, roadmap, breadcrumb, practice hub and group-mastery all read it.
- **Topic JSON** (`types/learning.ts` → `LearningTopicPage`): `overview`, `realWorldHook`, `definition`, `mentalModel`, `structure`, `stepper`, `operations`, `patternTemplate`, `recognitionQuiz`, `examples`, `conceptQuiz`, `practice`, plus `difficulty`, `estimatedMinutes`. `id === slug` for every topic.
- **Stepper**: `{ diagramType, array, code?, steps[] }`. Each step: `diagramState`, `variables`, `explanation`, `activeLine` (1-based line in `stepper.code.python`).
- **diagramState** is free-form per diagram. Shared conventions:
  - Array: `cells`, `left`, `right`, `windowStart/End`, `highlighted[]`, `comparing[]`
  - Tree/graph: `nodeStates: { id: 'active'|'visited'|'success'|'fail'|'compare' }`; trees use level-order `cells` or `nodes[{id,label,parent}]`; graphs use `nodes[{id,x,y}]`, `edges`, `activeEdges`
  - Stack: `stack[]` · DP: `memo[]`, `activeIndex`, `lookups[]` · Hash map: `buckets[][]`, `active`, `hit`
  - Any diagram: `aux: [{label, items}]` renders a queue/stack/output strip underneath.

## 6. Niche details & gotchas

- **Topic walkthroughs are generated.** Hand edits to `stepper` / `mentalModel.diagramState` in the 21 topics listed in `PLAN` inside `scripts/gen-steppers.mjs` are overwritten on the next run. Change the simulation, not the JSON. `sliding-window` and `two-pointers` are hand-authored and not in `PLAN`.
- **Stepper code is Python only.** `activeLine` indexes Python lines, so CodeTabs hides languages with empty code. Adding JS/Java/C++ needs per-language line maps.
- **`sliding-window` is special-cased** in `TopicPageRenderer` to use `InteractiveDemoPanel` + `CodePanel` instead of `StepperBlock`.
- **Never put `transform` on an ancestor of fixed elements.** A Framer `y` animation in `app/template.tsx` once broke the fixed sidebar/top bar. Page transition is a CSS opacity keyframe only (`.page-fade`). Don't start SSR content at `opacity: 0` via JS either — the page stays invisible if hydration is slow.
- **Don't use `scrollIntoView` inside topic sections.** It scrolls the whole page on load. Scroll the local container (`pane.scrollTo`) instead.
- **Tailwind `bg-opacity-*` does nothing on `bg-[var(--x)]` colors.** Use the `--surface-*` tokens or `rgba()`.
- **Use `bg-[var(--white)]`, not `bg-white`.** `--white` flips to a dark surface in dark mode.
- **Theme**: `.dark` class on `<html>`, stored as `localStorage.dsakarle_theme`, applied by an inline script in `app/layout.tsx` before paint. Dark mode overrides tokens only; components should never hardcode light colors.
- **Shadows**: `--shadow-card` is intentionally `none` (flat cards site-wide). Hover lift uses `--shadow-card-hover`.
- **Server → client props**: never pass component functions from a server component to a client one (e.g. badge components). Pass a rendered element (`badge={<Badge />}`).
- **Progress events**: `lib/progress.ts` dispatches `window` event `dsakarle:progress` on every write; Sidebar/RightSidebar listen to refresh.
- **Search**: `public/search-all.json` (topics + vocabulary + practice) powers Cmd/Ctrl+K. It is regenerated by `prebuild`; run `npm run build:search-index` in dev after content edits.
- **`next start` after rebuild**: kill the old server first; a stale server serves mismatched chunks (ChunkLoadError / unstyled page).
- **Orphan topics**: `stacks-queues.json` and `fast-and-slow-pointers.json` exist but are not in `course-structure.json`, and they lack a stepper, template and examples. The home catalog still links `stacks-queues`.
- **`metadataBase`** reads `NEXT_PUBLIC_SITE_URL`; set it on deploy or OG URLs point at localhost.

## 7. Design system

- Brand: coral `#CC5A37`, amber `#D99B26`, teal `#1E7B6C` (teal lightened to `#3FB5A0` in dark). Never generic blue for actions.
- Type: DM Sans (all text), JetBrains Mono (code, data only).
- Surfaces: `--bg-primary` #FBF5EF, `--bg-secondary` #FFFDF9, borders `--border` (coral at 22%).
- Motion: ease `[0.4, 0, 0.2, 1]` or expo-out `[0.16, 1, 0.3, 1]`; no bounce/elastic; respect `prefers-reduced-motion`.
- Design skills used for UI work: taste-skill, ui-ux-pro-max, design-motion-principles, impeccable. No `PRODUCT.md` / `DESIGN.md` yet (`/impeccable init` would create them).

## 8. Status

**Done**
- Data-driven topic header, live outline + progress sidebar, persistent concept quiz, completion celebration, recognition-quiz confetti.
- Real step-through visualizations + mental models for 21 topics; data-driven tree/graph/hash-map diagrams.
- CurriculumRoad roadmap with graph toggle; pattern-graph category filter.
- Practice Hub: 73 problems, saved progress, streak, accuracy, hints, list/topic views.
- Dark mode, navbar + mobile drawer, Cmd/Ctrl+K search, mobile course sidebar.
- Landing: animated hero, typing terminal, real stats, How It Works previews, testimonial marquee, richer catalog cards.
- SEO metadata, loading skeleton, page fade.

**Open / next**
- Testimonials are placeholder quotes; replace with real ones (don't fabricate named students).
- `public/og-image.png` missing (1200×630).
- README screenshots (`public/screenshots/`), Vercel deploy.
- Stepper code in JS/Java/C++.
- Decide fate of orphan topics (`stacks-queues`, `fast-and-slow-pointers`).
- Practice Hub ideas from spec not done: third hint level (vague nudge before pattern).
- `/impeccable init` to capture PRODUCT.md / DESIGN.md.
