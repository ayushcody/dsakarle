# DSAKarle — Complete Website Information Architecture
# Agentic IDE Master Build Plan
# Version 1.0 | March 2026

---

## ════════════════════════════════════════════════════════════
## PART 0: PROJECT OVERVIEW
## ════════════════════════════════════════════════════════════

**Product:** DSAKarle
**Tagline:** DSA? Karle.
**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
**Deployment:** Vercel
**Design Reference:** The Odin Project layout × Claude.ai color palette × hand-drawn badge icons (as shown in ChatGPT image references)

### Brand Identity
- **Primary Font (Display/Headings):** Lora (serif, Google Fonts)
- **Body Font:** DM Sans (Google Fonts)
- **Code Font:** DM Mono (Google Fonts)
- **Color Palette:**
  - bg-primary:    #FAF9F7  (warm off-white)
  - bg-secondary:  #F0EDE8  (light sand)
  - bg-dark:       #1A1A18  (near-black footer/dark sections)
  - accent-coral:  #D4603A  (primary CTA, active states)
  - accent-amber:  #C8900A  (icons, badges, secondary accent)
  - accent-teal:   #1D7A6B  (success, completion)
  - text-primary:  #1A1A18
  - text-secondary:#6B6860
  - text-muted:    #9C9890
  - border:        #E5E0D8

---

## ════════════════════════════════════════════════════════════
## PART 1: COMPLETE SITEMAP & ROUTING
## ════════════════════════════════════════════════════════════

```
/                               ← Home (Landing Page)
/learn                          ← Course Hub (chapter browser)

── DATA STRUCTURES ──
/learn/arrays                   ← Arrays & Vectors
/learn/linked-lists             ← Linked Lists
/learn/stacks-queues            ← Stacks & Queues
/learn/trees                    ← Binary Trees
/learn/graphs                   ← Graphs
/learn/heaps                    ← Heaps
/learn/tries                    ← Tries
/learn/hash-maps                ← Hash Maps

── ALGORITHMS ──
/learn/sorting                  ← Sorting Algorithms
/learn/searching                ← Searching Algorithms
/learn/dynamic-programming      ← Dynamic Programming
/learn/sliding-window           ← Sliding Window
/learn/two-pointers             ← Two Pointers
/learn/binary-search            ← Binary Search
/learn/backtracking             ← Backtracking
/learn/greedy                   ← Greedy Algorithms
/learn/prefix-sum               ← Prefix Sum

── UTILITY PAGES ──
/practice                       ← Practice problem browser
/about                          ← About DSAKarle
/progress                       ← User progress dashboard (future)
```

---

## ════════════════════════════════════════════════════════════
## PART 2: HOME PAGE — FULL SPECIFICATION
## ════════════════════════════════════════════════════════════

**File:** `app/page.tsx`

### Section 1 — Navigation Bar
- Fixed top, 64px height, bg-primary with bottom border
- LEFT: DSAKarle logo (SVG bracket icon) + wordmark in Lora bold
- CENTER: Nav links → Learn, Practice, About (DM Sans 15px)
- RIGHT: "Shuru Karo →" button in accent-coral
- On scroll > 80px: add box-shadow

### Section 2 — Hero
- Min-height 100vh, centered content
- Background: bg-primary + CSS dot-grid pattern (radial-gradient, border color, 28px spacing)
- Eyebrow label (DM Mono): "Ab DSA se darna band karo"
- H1 (Lora, 80px, tight): "DSA?" on line 1, "Karle." in accent-coral italic on line 2
- Subtitle (DM Sans, 19px): "Stop memorizing code. Start recognizing patterns. DSAKarle teaches algorithms the way visual thinkers actually learn."
- CTA row: "Patterns Dekho →" (coral filled) + "Kaise kaam karta hai ↓" (coral outline)
- Stats row (DM Mono, 13px): 13 patterns · 50+ examples · Visual-first · Free to start
- Hero Illustration: The ISOMETRIC DSA CAMPUS SVG (described in detail in Part 4)
  - Matches the ChatGPT-generated image: beige/cream buildings, "DSA" on main building
  - Data structure icons on building rooftops (tree, linked list, graph, array blocks)
  - Green pixel trees, blue rectangular pools
  - Isometric 2.5D perspective

### Section 3 — "How it Works" (3 columns)
- bg-secondary
- Heading (Lora): "Jaise visual learners actually sochte hain"
- 3-column card grid:
  1. Icon: eye looking at bracket → "See the Pattern" → "Every concept starts with its spatial shape."
  2. Icon: scrubber/slider → "Control the Steps" → "Drag through each step. Watch variables update live."
  3. Icon: brain+lightning → "Train the Reflex" → "Classify before coding. Build the interviewer's instinct."

### Section 4 — COURSE GRID (THE MAIN FEATURE — SEE DETAILED SPEC BELOW)
- bg-primary
- Heading (Lora): "Master Data Structures and Algorithms"
- TWO SECTIONS SIDE BY SIDE on desktop, stacked on mobile:

  ┌─────────────────────────────┬─────────────────────────────┐
  │   DATA STRUCTURES           │   ALGORITHMS                │
  │   (3×3 badge grid)          │   (3×3 badge grid)          │
  │                             │                             │
  │   Arrays & Vectors  →       │   Sorting Algorithms →      │
  │   Linked Lists      →       │   Searching Algorithms →    │
  │   Stacks & Queues   →       │   Dynamic Programming →     │
  │   Binary Trees      →       │   Sliding Window →          │
  │   Graphs            →       │   Two Pointers →            │
  │   Heaps             →       │   Binary Search →           │
  │   Tries             →       │   Backtracking →            │
  │   Hash Maps         →       │   Greedy Algorithms →       │
  │                             │   Prefix Sum →              │
  └─────────────────────────────┴─────────────────────────────┘

  EACH BADGE CARD IS A CLICKABLE LINK (<a href="/learn/[slug]">):
  - White background card, 1px border (--border), 12px border-radius
  - Centered circular badge SVG (90×90px): concentric dashed rings, hand-drawn data structure icon inside
  - Pattern name in DM Sans 14px bold below badge
  - Difficulty pill (DM Mono 11px): Beginner / Intermediate / Advanced
  - On hover: translateY(-4px), box-shadow, badge rotates 3 degrees
  - On click: navigates to /learn/[slug]

  SECTION DIVIDER between the two halves: a thin vertical line on desktop

  "Explore Curriculum →" button centered below both grids

### Section 5 — Interactive Demo (Dark section)
- bg-dark full width
- Split layout: left = text, right = LIVE SLIDING WINDOW WIDGET
  - Array of 8 numbers with draggable slider
  - Window highlight, pointer labels (L in green, R in orange)
  - Live variable state panel: left, right, window_sum, max_sum
  - Values flash amber on change
  - "Try Sliding Window →" CTA

### Section 6 — Philosophy (Alternating layout)
- bg-secondary
- Item 1: "Patterns, not problems." + SVG showing 3 problems → 1 pattern
- Item 2: "Code last. Always." + 8-step numbered teaching flow

### Section 7 — Testimonials (2×2 grid)
- bg-primary
- Avatar circle (initials, coral background) + name + role + quote in italic
- 4 testimonials

### Section 8 — CTA Banner
- bg: accent-coral
- "Ab DSA se darna band karo." (Lora, white, 42px)
- "bilkul free · koi account nahi chahiye" (DM Mono, white muted)
- White button: "Start with Sliding Window →" with coral text

### Section 9 — Footer
- bg-dark
- Logo + tagline
- 4 link columns: Learn, Platform, Community, Legal
- Bottom: copyright + GitHub/Discord/Twitter SVG icons

---

## ════════════════════════════════════════════════════════════
## PART 3: INDIVIDUAL TOPIC PAGE SPECIFICATION
## ════════════════════════════════════════════════════════════

**File pattern:** `app/learn/[slug]/page.tsx`
**Component:** `TopicPageRenderer`

Every topic page renders the SAME layout driven by a JSON data file.

### Layout
- Persistent LEFT SIDEBAR (280px):
  - DSAKarle logo
  - Chapter tree (Data Structures / Algorithms collapsible)
  - Each section item: title + kind icon + completion dot
  - Progress % per chapter

- CENTER CONTENT (max-width 960px):
  - Topic page content (see Teaching Sequence below)

- RIGHT MINI-PANEL (220px, desktop only, sticky):
  - "On this page" jump links (auto-generated from H2/H3)

### Teaching Sequence (rendered in this exact order for EVERY topic)

```
1. HERO BLOCK
   ├── Pattern shape SVG (the badge icon, large, 120px)
   ├── Topic title (Lora, H1)
   ├── Subtitle / one-liner
   ├── Badge row: Difficulty chip + Estimated time
   └── Learning Objectives list (3-5 bullets)

2. CONCEPT SECTION
   ├── TheoryBlock: Core definition in plain language
   ├── TheoryBlock: Key terminology (defined inline, highlighted)
   └── CalloutBlock (type: "interview"): When to recognize this pattern

3. VISUAL / MENTAL MODEL SECTION
   ├── DiagramBlock: The pattern's spatial illustration (SVG)
   └── CalloutBlock (type: "tip"): The one sentence that makes it click

4. SCRUBABLE STEPPER SECTION  ← THE CORE FEATURE
   ├── StepperBlock:
   │   ├── Array/Tree/Graph diagram (SVG, updates per step)
   │   ├── Slider (range input, keyboard navigable)
   │   ├── Variable State Panel (left, right, curr, max — live values)
   │   ├── Explanation text (one sentence per step)
   │   └── Code line highlight (synced to active step)
   └── ConstraintGauge (for sliding window / two pointers only):
       └── SVG fuel-gauge, green→amber→red as value approaches max

5. PATTERN TEMPLATE SECTION
   ├── Pseudocode block (DM Mono, not language-specific)
   └── "When to use this template" callout

6. WORKED EXAMPLES (2-3 cards)
   Each ExampleCard contains:
   ├── Problem statement (gray box, LeetCode style)
   ├── Input/Output example
   ├── Step-by-step explanation (bullet list)
   ├── Optional: mini diagram
   ├── CodeTabs: Python / JavaScript / Java / C++ (switchable)
   └── Complexity row: Time O(...) + Space O(...) with brief rationale

7. PATTERN RECOGNITION QUIZ  ← PRE-CODE CLASSIFIER
   ├── Problem statement shown
   ├── 4 pattern shape icons as clickable cards
   ├── User selects → correct: green + explanation / wrong: red → reveal correct
   └── Quiz score written to localStorage

8. CONCEPT QUIZ (3-5 questions)
   ├── MCQ or short conceptual questions
   ├── Show explanation after answer
   └── Score tracked in localStorage per topic

9. PRACTICE BRIDGE
   ├── Table: Problem name | Source | Difficulty | Pattern tag
   ├── Each row links to LeetCode (opens in new tab)
   └── "Pattern template" side panel opens on click (3-panel view)
```

---

## ════════════════════════════════════════════════════════════
## PART 4: ISOMETRIC HERO ILLUSTRATION SPEC
## ════════════════════════════════════════════════════════════

Build this as a single SVG component: `components/IsometricCampus.tsx`

### Visual Elements (all in isometric 2.5D projection)

**Main Building (center):**
- Neoclassical facade: white/cream building with 4 columns
- Golden "DSA" text on the facade (accent-amber color)
- On rooftop: tree node icon + graph network icon (gray, outline style)
- Shadow: soft warm gray offset

**Side Buildings (6-8 surrounding platforms):**
1. Array platform: row of 5 beige rectangular blocks (array cells)
2. Linked List platform: 3 chain-linked nodes with connector arrows
3. Stack platform: 3 stacked blocks (pyramid)
4. Graph platform: 4 nodes connected with lines (network icon)
5. Tree platform: binary tree node arrangement
6. Hash Map platform: grid of small cells

**Environment:**
- Blue rectangular pools (flat blue rectangles, isometric)
- Green pixel trees (cube trunk, cube top — Minecraft style)
- Connecting roads/paths between platforms (beige lines)
- Small gray rock/pebble details for depth
- Amphitheatre on right: concentric stepped rings

**Color palette for illustration:**
- Buildings: #F0EDE8 (cream), #E5E0D8 (border), #FFFFFF (highlights)
- "DSA" text: #C8900A (accent-amber)
- Pools: #60B8D4 (blue)
- Trees: #4CAF50 trunk #5D4037 (green + brown)
- Shadows: rgba(0,0,0,0.06)
- Icon overlays: #9C9890 (muted gray)

**Size:** viewBox="0 0 1200 600", width="100%", max-width 900px

**Implementation note:** This should match the aesthetic in the reference image exactly.
Use CSS transforms for the isometric angle (rotateX(30deg) rotateZ(-45deg) on individual platform groups OR draw manually in isometric coordinate math).

---

## ════════════════════════════════════════════════════════════
## PART 5: BADGE ICON SPECIFICATIONS (All 17 topics)
## ════════════════════════════════════════════════════════════

Each badge = 90×90px SVG with:
- Outer circle: 42px radius, stroke #E5E0D8
- Inner dashed ring: 36px radius, stroke #E5E0D8, stroke-dasharray="3 3"
- Center illustration: hand-drawn style, amber/cream palette
- All strokes: #C8900A or #D4603A, stroke-width 1.5-2px
- Fill: warm translucent fills (rgba of amber/coral, 0.1-0.3 opacity)

### DATA STRUCTURES

**1. Arrays & Vectors** — `/learn/arrays`
Badge: 5 connected rectangular blocks in a row, each with rounded corners.
Difficulty: Beginner

**2. Linked Lists** — `/learn/linked-lists`
Badge: 3 oval nodes connected by chain links (like the reference image exactly).
Difficulty: Beginner

**3. Stacks & Queues** — `/learn/stacks-queues`
Badge: 3 stacked cylinder shapes with a small right-arrow for queue. (Reference image style)
Difficulty: Beginner

**4. Binary Trees** — `/learn/trees`
Badge: Root node → 2 child nodes → 4 grandchild nodes. Node circles connected by lines.
Difficulty: Intermediate

**5. Graphs** — `/learn/graphs`
Badge: 5 nodes in pentagon arrangement, connected by edges (reference image style).
Difficulty: Intermediate

**6. Heaps** — `/learn/heaps`
Badge: Pyramid of 6 circles (1 top, 2 middle, 3 bottom), top circle highlighted coral.
Difficulty: Intermediate

**7. Tries** — `/learn/tries`
Badge: Root node branching into 3 nodes, each branching into 2, with letter labels (a, b, c).
Difficulty: Advanced

**8. Hash Maps** — `/learn/hash-maps`
Badge: Key icon → funnel arrow → row of 4 buckets.
Difficulty: Intermediate

### ALGORITHMS

**9. Sorting Algorithms** — `/learn/sorting`
Badge: Bar chart with bars of different heights, upward arrow overlay.
Difficulty: Beginner

**10. Searching Algorithms** — `/learn/searching`
Badge: Magnifying glass over a network/graph (reference image style).
Difficulty: Beginner

**11. Dynamic Programming** — `/learn/dynamic-programming`
Badge: 3×3 grid of cells, bottom-right cell highlighted, diagonal arrow from top-left.
Difficulty: Advanced

**12. Sliding Window** — `/learn/sliding-window`
Badge: 7-cell array row, 3 cells highlighted with a coral stroke rectangle overlay.
Difficulty: Beginner

**13. Two Pointers** — `/learn/two-pointers`
Badge: Number line with two arrow pointers (green L, orange R) converging toward center.
Difficulty: Beginner

**14. Binary Search** — `/learn/binary-search`
Badge: 7-cell array, middle cell highlighted, vertical bisecting line.
Difficulty: Beginner

**15. Backtracking** — `/learn/backtracking`
Badge: Decision tree with some branches marked X (pruned) in red, one path green.
Difficulty: Advanced

**16. Greedy Algorithms** — `/learn/greedy`
Badge: Upward stepped path, each step coin/circle highlighted gold.
Difficulty: Intermediate

**17. Prefix Sum** — `/learn/prefix-sum`
Badge: Cumulative bar chart with brackets showing sub-range sum.
Difficulty: Beginner

---

## ════════════════════════════════════════════════════════════
## PART 6: DATA ARCHITECTURE & CONTENT SCHEMA
## ════════════════════════════════════════════════════════════

### File Structure
```
/content/
  topics/
    arrays.json
    linked-lists.json
    stacks-queues.json
    trees.json
    graphs.json
    heaps.json
    tries.json
    hash-maps.json
    sorting.json
    searching.json
    dynamic-programming.json
    sliding-window.json
    two-pointers.json
    binary-search.json
    backtracking.json
    greedy.json
    prefix-sum.json
  course-structure.json       ← Chapter/section tree
  search-index.json           ← Built at compile time
```

### TopicPage JSON Schema (TypeScript)
```typescript
interface TopicPage {
  id: string                    // slug: "sliding-window"
  title: string                 // "Sliding Window"
  hindiTitle?: string           // "Sliding Window — Khiski Khidki"
  patternShapeId: string        // references badge SVG component
  category: "data-structure" | "algorithm"
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedMinutes: number
  prerequisites: string[]       // array of topic ids
  tags: string[]

  overview: {
    summary: string
    learningObjectives: string[]
    interviewRelevance: string  // "Asked in 40% of FAANG array problems"
  }

  content: ContentBlock[]       // ordered rendering blocks

  patternTemplate: {
    pseudocode: string
    whenToUse: string
    timeComplexity: string
    spaceComplexity: string
  }

  examples: Example[]           // 2-3 worked problems

  recognitionQuiz: {
    problemStatement: string
    correctPatternId: string
    distractors: string[]       // 3 wrong pattern ids
    explanation: string
  }

  conceptQuiz: QuizQuestion[]   // 3-5 MCQ/conceptual

  practice: PracticeLink[]      // 5-10 curated problems
}

interface Step {
  stepIndex: number
  diagramState: DiagramState    // pointer positions, highlighted cells
  variables: Record<string, string | number>
  constraintValue?: number
  constraintMax?: number
  explanation: string           // one sentence
  activeLine: number            // code line to highlight (0-indexed)
}

interface Example {
  title: string
  difficulty: "easy" | "medium" | "hard"
  leetcodeUrl: string
  problemStatement: string
  inputExample: string
  outputExample: string
  steps: string[]               // bullet explanation
  code: {
    python: string
    javascript: string
    java: string
    cpp: string
  }
  timeComplexity: string
  spaceComplexity: string
}
```

---

## ════════════════════════════════════════════════════════════
## PART 7: COMPONENT ARCHITECTURE
## ════════════════════════════════════════════════════════════

```
components/
  layout/
    Navbar.tsx              ← Fixed top bar, scroll effect, hamburger
    Sidebar.tsx             ← Chapter tree, progress dots, collapsible
    MainContent.tsx         ← Max-width container
    RightPanel.tsx          ← "On this page" sticky outline
    Footer.tsx              ← Dark footer with links + social icons

  home/
    HeroSection.tsx         ← Headline, CTA, stats row
    IsometricCampus.tsx     ← THE ISOMETRIC SVG ILLUSTRATION (Part 4)
    HowItWorksSection.tsx   ← 3-column card grid
    CourseCatalog.tsx       ← TWO-PANEL BADGE GRID (Part 5)
    BadgeCard.tsx           ← Individual clickable badge card
    DemoSection.tsx         ← Dark section with live widget
    TestimonialsSection.tsx ← 2x2 testimonial grid
    CTABanner.tsx           ← Coral CTA section

  badges/
    ArraysBadge.tsx
    LinkedListsBadge.tsx
    StacksQueuesBadge.tsx
    TreesBadge.tsx
    GraphsBadge.tsx
    HeapsBadge.tsx
    TriesBadge.tsx
    HashMapsBadge.tsx
    SortingBadge.tsx
    SearchingBadge.tsx
    DPBadge.tsx
    SlidingWindowBadge.tsx
    TwoPointersBadge.tsx
    BinarySearchBadge.tsx
    BacktrackingBadge.tsx
    GreedyBadge.tsx
    PrefixSumBadge.tsx

  topic/
    TopicPageRenderer.tsx   ← Root: receives TopicPage JSON, renders sequence
    ContentBlockRenderer.tsx ← Switch on block.type
    HeroBlock.tsx           ← Pattern shape + title + objectives
    TheoryBlock.tsx         ← Prose with highlighted terminology
    DiagramBlock.tsx        ← Static SVG illustration
    StepperBlock.tsx        ← THE SCRUBABLE STEPPER (most complex)
    VariableStatePanel.tsx  ← Left/right/curr/max live panel
    ConstraintGauge.tsx     ← SVG fuel-gauge widget
    CalloutBlock.tsx        ← Colored callout (note/tip/warning/interview)
    CodeBlock.tsx           ← Shiki syntax-highlighted, line-highlight
    CodeTabs.tsx            ← Python/JS/Java/C++ switcher
    PatternTemplate.tsx     ← Pseudocode + when-to-use
    ExampleCard.tsx         ← Expandable worked example
    RecognitionQuiz.tsx     ← 4-icon classification quiz
    ConceptQuiz.tsx         ← MCQ quiz with explanations
    PracticeList.tsx        ← Table of curated problems

  diagrams/
    ArrayDiagram.tsx        ← N cells, left/right pointers, window highlight
    LinkedListDiagram.tsx   ← Node chain with pointer arrows
    TreeDiagram.tsx         ← Binary tree SVG
    GraphDiagram.tsx        ← Node-edge graph SVG
    GridDiagram.tsx         ← 2D grid for DP

  ui/
    Badge.tsx               ← Difficulty/time pill
    Button.tsx              ← Primary/outline/ghost variants
    ProgressRing.tsx        ← Circular progress indicator
    SearchBar.tsx           ← Fuse.js client-side search
```

---

## ════════════════════════════════════════════════════════════
## PART 8: COURSE CATALOG COMPONENT — DETAILED SPEC
## ════════════════════════════════════════════════════════════

**File:** `components/home/CourseCatalog.tsx`

This is the most important section on the home page.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│         Master Data Structures and Algorithms              │
│              (Lora H2, centered, 36px)                     │
│                                                            │
│  ┌─────────────────────────┬──────────────────────────┐   │
│  │  DATA STRUCTURES        │  ALGORITHMS              │   │
│  │  (DM Mono label, amber) │  (DM Mono label, amber)  │   │
│  │                         │                          │   │
│  │  [Badge] [Badge] [Badge]│  [Badge] [Badge] [Badge] │   │
│  │  [Badge] [Badge] [Badge]│  [Badge] [Badge] [Badge] │   │
│  │  [Badge] [Badge]        │  [Badge] [Badge] [Badge] │   │
│  │                         │                          │   │
│  └─────────────────────────┴──────────────────────────┘   │
│                                                            │
│                 [ Explore Curriculum → ]                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Divider
A single 1px vertical line in var(--border) between the two halves on desktop.
On mobile (< 768px): stacked vertically, no divider.

### BadgeCard Component Props
```typescript
interface BadgeCardProps {
  title: string              // "Arrays & Vectors"
  slug: string               // "arrays"
  category: string           // "data-structure" | "algorithm"
  difficulty: "beginner" | "intermediate" | "advanced"
  badgeComponent: React.FC   // The SVG badge for this topic
  href: string               // "/learn/arrays"
}
```

### BadgeCard Behavior
- Renders as `<Link href={href}>` (Next.js Link)
- White card, 1px border (--border), 12px border-radius
- Centered flex column: badge SVG → title → difficulty pill
- Padding: 28px 20px
- Hover: `transform: translateY(-4px)`, `box-shadow: 0 12px 32px rgba(0,0,0,0.08)`
- Hover badge: `transform: rotate(3deg)`, transition 0.2s
- CSS transition on all: 0.2s ease
- Active (being clicked): `transform: scale(0.97)`

### Data Arrays

```typescript
const dataStructures = [
  { title: "Arrays & Vectors",  slug: "arrays",        difficulty: "beginner",     badge: ArraysBadge },
  { title: "Linked Lists",      slug: "linked-lists",  difficulty: "beginner",     badge: LinkedListsBadge },
  { title: "Stacks & Queues",   slug: "stacks-queues", difficulty: "beginner",     badge: StacksQueuesBadge },
  { title: "Binary Trees",      slug: "trees",         difficulty: "intermediate", badge: TreesBadge },
  { title: "Graphs",            slug: "graphs",        difficulty: "intermediate", badge: GraphsBadge },
  { title: "Heaps",             slug: "heaps",         difficulty: "intermediate", badge: HeapsBadge },
  { title: "Tries",             slug: "tries",         difficulty: "advanced",     badge: TriesBadge },
  { title: "Hash Maps",         slug: "hash-maps",     difficulty: "intermediate", badge: HashMapsBadge },
]

const algorithms = [
  { title: "Sorting Algorithms",     slug: "sorting",              difficulty: "beginner",     badge: SortingBadge },
  { title: "Searching Algorithms",   slug: "searching",            difficulty: "beginner",     badge: SearchingBadge },
  { title: "Dynamic Programming",    slug: "dynamic-programming",  difficulty: "advanced",     badge: DPBadge },
  { title: "Sliding Window",         slug: "sliding-window",       difficulty: "beginner",     badge: SlidingWindowBadge },
  { title: "Two Pointers",           slug: "two-pointers",         difficulty: "beginner",     badge: TwoPointersBadge },
  { title: "Binary Search",          slug: "binary-search",        difficulty: "beginner",     badge: BinarySearchBadge },
  { title: "Backtracking",           slug: "backtracking",         difficulty: "advanced",     badge: BacktrackingBadge },
  { title: "Greedy Algorithms",      slug: "greedy",               difficulty: "intermediate", badge: GreedyBadge },
  { title: "Prefix Sum",             slug: "prefix-sum",           difficulty: "beginner",     badge: PrefixSumBadge },
]
```

---

## ════════════════════════════════════════════════════════════
## PART 9: STEPPER COMPONENT — DETAILED LOGIC
## ════════════════════════════════════════════════════════════

**File:** `components/topic/StepperBlock.tsx`

This is the most complex and most important component.

### State (Zustand store, scoped per topic page)
```typescript
interface StepperStore {
  currentStep: number
  totalSteps: number
  selectedLanguage: "python" | "javascript" | "java" | "cpp"
  setStep: (n: number) => void
  nextStep: () => void
  prevStep: () => void
  setLanguage: (lang: string) => void
}
```

### Three panels, always in sync:
1. **Diagram panel** — reads `steps[currentStep].diagramState`, updates pointer positions
2. **Variable panel** — reads `steps[currentStep].variables`, flashes changed values amber
3. **Code panel** — highlights `steps[currentStep].activeLine` in the selected language's code

### Slider behavior:
- HTML `<input type="range">` min=0 max=totalSteps-1 step=1
- onChange: `setStep(parseInt(e.target.value))`
- ArrowRight key: `nextStep()`, ArrowLeft key: `prevStep()` (attach to slider element)
- Displays: "Step {currentStep+1} of {totalSteps}" in DM Mono below slider

### Diagram animation:
- Pointer positions use Framer Motion `layoutId` for smooth sliding
- Changed cells flash amber (CSS keyframe, 200ms)
- Window rectangle: Framer Motion `animate` on x/width props

### Variable panel change detection:
- `usePrevious` hook stores previous step variables
- Keys with changed values receive `.flash` class (amber bg, 400ms fade)

### Code line sync:
- Shiki renders code server-side with `data-line` attributes on each `<span>`
- CSS: `.active-line { background: rgba(212,96,58,0.12); border-left: 2px solid var(--accent-coral); }`
- `scrollIntoView({ behavior: "smooth", block: "nearest" })` on activeLine change

---

## ════════════════════════════════════════════════════════════
## PART 10: PROGRESS SYSTEM
## ════════════════════════════════════════════════════════════

### localStorage Schema
```javascript
// Key: "dsakarle_progress_v1"
{
  completedSections: string[],      // ["sliding-window", "arrays"]
  quizScores: {
    "sliding-window": { recognition: true, concept: 4 },
    "arrays": { recognition: false, concept: 2 }
  },
  lastVisited: "sliding-window",
  totalTimeSpent: number            // seconds
}
```

### Progress Display
- Sidebar: colored dot per section (empty = not started, amber = in progress, teal = complete)
- Sidebar chapter header: "2 / 8 complete" in DM Mono
- Topbar: circular progress ring (% of all sections complete)
- Topic page: "Mark Complete ✓" button at bottom of page → adds to completedSections

---

## ════════════════════════════════════════════════════════════
## PART 11: SEARCH SYSTEM
## ════════════════════════════════════════════════════════════

- Library: Fuse.js (client-side, no server needed)
- Index built at compile time in `next.config.js` build step
- Index fields: `{ id, title, tags, overview.summary, difficulty }`
- Written to `/public/search-index.json`
- Loaded lazily on first keypress in search input
- Fuse options: `{ threshold: 0.35, keys: [{ name:"title",weight:0.5 }, { name:"tags",weight:0.3 }, { name:"overview.summary",weight:0.2 }] }`
- Results dropdown: max 8 results, shows topic title + category breadcrumb
- Keyboard: ArrowUp/Down navigate, Enter routes to result, Escape closes
- Search cleared on route change

---

## ════════════════════════════════════════════════════════════
## PART 12: RESPONSIVE BREAKPOINTS
## ════════════════════════════════════════════════════════════

| Breakpoint   | Width     | Changes                                                      |
|-------------|-----------|--------------------------------------------------------------|
| Desktop     | > 1200px  | Full 3-panel layout, side-by-side course catalog             |
| Tablet      | 768-1200px| Sidebar hidden (hamburger), right panel hidden, 2-col grids  |
| Mobile      | < 768px   | Single column, catalog sections stacked, code blocks scroll  |

### Course Catalog on mobile:
- "Data Structures" section first (full width, 2-col badge grid)
- Horizontal divider
- "Algorithms" section below (full width, 2-col badge grid)

### Stepper on mobile:
- Diagram full width
- Variable panel below diagram
- Code panel below variable panel
- Slider full width with large thumb target (44px minimum)

---

## ════════════════════════════════════════════════════════════
## PART 13: PERFORMANCE REQUIREMENTS
## ════════════════════════════════════════════════════════════

- All topic pages: statically generated at build time (SSG)
- Code blocks: Shiki runs server-side only
- Images/SVGs: inline (no external CDN requests for illustrations)
- Fonts: preloaded in `<head>` with `display=swap`
- Fuse.js search index: lazy-loaded on first interaction
- Target Lighthouse scores: Performance > 90, Accessibility > 95, SEO > 95

---

## ════════════════════════════════════════════════════════════
## PART 14: TECH STACK SUMMARY
## ════════════════════════════════════════════════════════════

| Layer            | Technology              | Why                                          |
|-----------------|-------------------------|----------------------------------------------|
| Framework        | Next.js 14 (App Router) | SSG, file-based routing, great DX            |
| Language         | TypeScript              | Schema-driven content needs strict types     |
| Styling          | Tailwind CSS            | Utility-first, responsive built-in           |
| Animation        | Framer Motion           | Stepper transitions, pointer animations      |
| Syntax highlight | Shiki                   | Server-side, per-line highlighting           |
| State            | Zustand                 | Lightweight, per-page stepper state          |
| Search           | Fuse.js                 | Client-side, no server needed                |
| Content          | JSON files in /content/ | No DB needed for MVP, git-versioned          |
| Validation       | Zod                     | Build-time schema validation                 |
| Testing          | Vitest + Playwright     | Unit + E2E                                   |
| Deployment       | Vercel                  | Next.js-native, CDN-backed                   |

---

## ════════════════════════════════════════════════════════════
## PART 15: BUILD ORDER FOR AGENTIC IDE
## ════════════════════════════════════════════════════════════

Execute in this exact sequence to avoid dependency issues:

### Phase 1 — Foundation (Days 1-3)
1. `npx create-next-app@latest dsakarle --typescript --tailwind --app`
2. Install: `framer-motion zustand fuse.js zod shiki`
3. Set up CSS variables in `globals.css`
4. Install Google Fonts (Lora + DM Sans + DM Mono) in `app/layout.tsx`
5. Create `content/course-structure.json` with full chapter map
6. Build Zod schemas for all content types
7. Build `Navbar`, `Footer`, `MainContent` layout shell

### Phase 2 — Badge System (Days 4-6)
8. Build all 17 badge SVG components in `components/badges/`
9. Build `BadgeCard` with Link, hover effects, difficulty pill
10. Build `CourseCatalog` with two-panel layout and divider
11. Wire all 17 badges to their routes

### Phase 3 — Hero + Home (Days 7-9)
12. Build `IsometricCampus` SVG illustration
13. Build `HeroSection` with dot-grid bg, headline, CTAs, stats
14. Build `HowItWorksSection` (3-column)
15. Assemble full `app/page.tsx` with all home sections

### Phase 4 — Stepper Core (Days 10-14)
16. Build `ArrayDiagram` with pointer positions + window highlight
17. Build `VariableStatePanel` with change detection + amber flash
18. Build `StepperBlock` with slider + keyboard nav + all three sync panels
19. Build `ConstraintGauge` SVG widget
20. Write step data for Sliding Window (30+ steps, 2 examples)
21. Test stepper end-to-end on `/learn/sliding-window`

### Phase 5 — Topic Page (Days 15-18)
22. Build all remaining `ContentBlock` components
23. Build `ExampleCard` (expandable, CodeTabs, complexity)
24. Build `RecognitionQuiz` (4-icon classifier)
25. Build `ConceptQuiz` (MCQ)
26. Build `PracticeList` table
27. Build `TopicPageRenderer` orchestrating the full sequence
28. Build `Sidebar` with progress dots + chapter tree

### Phase 6 — Content (Days 19-25, overlaps Phase 5)
29. Write full JSON content for: Sliding Window, Two Pointers, Binary Search, Arrays, Hashing
30. Write partial JSON (overview + examples, no stepper) for remaining 12 topics
31. Build search index generation script

### Phase 7 — Polish (Days 26-30)
32. Scroll reveal animations (IntersectionObserver)
33. Full mobile responsive audit
34. Playwright E2E tests (stepper, quiz, progress, search, routing)
35. Lighthouse audit, fix any performance issues
36. SEO: meta tags, OG images per topic, sitemap

---

## ════════════════════════════════════════════════════════════
## PART 16: AGENTIC IDE EXECUTION INSTRUCTIONS
## ════════════════════════════════════════════════════════════

When running this plan in an agentic IDE (Cursor, Windsurf, Devin, etc.):

1. **Start with this file as the system context.** Feed it to the agent at the start of every session.

2. **Component generation order matters.** Always build in Phase order (Part 15). Never build a component that depends on an unbuilt component.

3. **Badge SVGs are critical path.** Build all 17 badge components before building CourseCatalog. Each badge must be a standalone React component returning a single `<svg>` element.

4. **StepperBlock is the hardest component.** Allocate 3-4 days. Build `ArrayDiagram` first, validate it renders correctly, then wrap in `StepperBlock`. Add `VariableStatePanel` third, code sync last.

5. **Content JSON before TopicPageRenderer.** Write the Sliding Window JSON completely before building the renderer. The renderer should be tested against real data, not mock data.

6. **Never hardcode colors.** Always use CSS variables (`var(--accent-coral)` not `#D4603A`). This ensures dark mode can be added later.

7. **Every route must exist before launch.** Even if a topic page only shows "Coming Soon", all 17 `/learn/[slug]` routes must return 200. Use a fallback template for unfinished topics.

8. **localStorage key:** `dsakarle_progress_v1` — never change this key after launch.

9. **Badge card routing test:** After building CourseCatalog, test that clicking each of the 17 badges correctly navigates to its route. This is the core user interaction.

---

END OF PLAN
Total estimated build time: 30 days (solo developer)
Total pages: 21 (1 home + 1 course hub + 17 topic pages + 1 practice + 1 about)
Total components: ~55
Total badge SVGs: 17
