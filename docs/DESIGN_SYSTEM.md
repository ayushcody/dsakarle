# DSA Karle — Design System Contract

**Identity: calm and elegant, in the spirit of The Odin Project.** Warm stone neutrals, Inter throughout, one coral accent, flat bordered cards, and graph paper only where thinking happens (the Stage). Every colour means something.

This file is the contract for token names. Agents implement against these names exactly. Change a name here first, and nowhere else.

## 1. Theme mechanics
- **Choosing the theme.** Light is the default. Dark is selected when `<html data-theme="dark">`. With no `data-theme`, the system preference applies via `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`.
- **No flash.** An inline script in `app/layout.tsx` sets `data-theme` before paint. It reads `localStorage['dsakarle-theme']`, which holds `light`, `dark` or `system`.
- **Toggle.** `components/ui/ThemeToggle.tsx` cycles system → light → dark. It writes the same storage key.

## 2. Colour tokens (CSS custom properties on `:root`)

**Surfaces and ink**

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#FAFAF9` | `#121110` | page background |
| `--paper-raised` | `#FFFFFF` | `#1B1A18` | cards, header, stage |
| `--paper-sunken` | `#F5F5F4` | `#0D0C0B` | code blocks, inputs, wells |
| `--ink` | `#1C1917` | `#F5F5F4` | primary text |
| `--ink-2` | `#44403C` | `#D6D3D1` | secondary text |
| `--ink-3` | `#6B6560` | `#A8A29E` | muted text (must stay ≥ 4.5:1 on paper, raised and sunken; on coral or teal washes use `--ink-2`) |
| `--rule` | `rgba(28,25,23,0.10)` | `rgba(245,245,244,0.10)` | borders, dividers |
| `--rule-strong` | `rgba(28,25,23,0.18)` | `rgba(245,245,244,0.18)` | focused or hovered borders |
| `--control-border` | `#8A8279` | `#7D7569` | border of text fields and search triggers (≥ 3:1 against every surface, WCAG 1.4.11). Tailwind: `border-control` |
| `--grid` | `rgba(28,25,23,0.03)` | `rgba(245,245,244,0.035)` | graph-paper lines (Stage only) |

**Brand**

| Token | Light | Dark | Use |
|---|---|---|---|
| `--coral` | `#CC5A37` | `#F08A64` | brand accent for strokes, icons, rings and large text only. Not a text colour and not a fill behind small text (3.82:1 with paper) |
| `--coral-ink` | `#A83A1D` | `#F5A584` | coral text on paper (AA), and the **primary button fill** (paper text on it is >= 6:1 light, 9:1 dark). **The single accent**: links, primary CTA, progress, active nav |
| `--coral-ink-2` | `#8C2F16` | `#F9BDA2` | primary button hover and active fill |
| `--coral-wash` | `rgba(204,90,55,0.08)` | `rgba(240,138,100,0.12)` | active nav and selected backgrounds |
| `--amber` | `#D99B26` | `#F2C14E` | secondary accent (strokes, fills) |
| `--amber-ink` | `#855A05` | `#F2C14E` | amber as **text** (chips, callout titles); 5.6:1 on paper. `--role-compare` is for strokes only |
| `--teal` | `#1E7B6C` | `#4FB7A5` | tertiary accent (strokes, icons) |
| `--teal-ink` | `#17695C` | `#4FB7A5` | teal as **text**, also on the teal wash (5.2:1) |
| `--focus-ring` | `#CC5A37` | `#F08A64` | `:focus-visible` outline, 2px with 2px offset |

**Semantic roles.** Used only through `lib/stage/semantics.ts` and the Stage primitives. Every role also has a non-colour cue.

| Token | Light | Dark | Role | Non-colour cue |
|---|---|---|---|---|
| `--role-ptr-a` | `#1E7B6C` | `#4FB7A5` | pointer A (left/slow/lo/prev) | ▲ tag below + label |
| `--role-ptr-a-wash` | `rgba(30,123,108,0.12)` | `rgba(79,183,165,0.16)` | | |
| `--role-ptr-b` | `#4C55B8` | `#9097F0` | pointer B (right/fast/hi/curr) | ▼ tag above + label |
| `--role-ptr-b-wash` | `rgba(76,85,184,0.12)` | `rgba(144,151,240,0.16)` | | |
| `--role-focus` | `#CC5A37` | `#F08A64` | element being processed | 2px solid ring |
| `--role-compare` | `#B57D12` | `#F2C14E` | being compared | dashed outline |
| `--role-window` | `#CC5A37` | `#F08A64` | active range stroke | sketched bracket |
| `--role-window-wash` | `rgba(204,90,55,0.08)` | `rgba(240,138,100,0.14)` | range fill | |
| `--role-visited` | `rgba(28,25,23,0.35)` | `rgba(245,245,244,0.35)` | hatching stroke for processed items | pencil hatching |
| `--role-discarded-opacity` | `0.35` | `0.35` | out of play | strike-through |
| `--role-changed` | `#F6D36B` | `#8A6D1F` | value just changed | 300ms highlighter flash |
| `--role-found` | `#2F8F4E` | `#5CC77E` | answer, success | ✓ glyph |
| `--role-found-wash` | `rgba(47,143,78,0.12)` | `rgba(92,199,126,0.16)` | | |
| `--role-error` | `#C23B3B` | `#F07171` | violation, wrong | ✕ glyph, zigzag |
| `--role-error-wash` | `rgba(194,59,59,0.10)` | `rgba(240,113,113,0.14)` | | |
| `--found-ink` | `#256F3A` | `#5CC77E` | success as **text** (and on its wash). `--role-found` is for strokes, fills and glyphs | |
| `--error-ink` | `#A82F2F` | `#F07171` | error as **text** (and on its wash). `--role-error` is for strokes, fills and glyphs | |

**Legacy aliases.** Existing components still use these names. They must keep working in both themes until the legacy code is retired in Phase 5. Define them only as aliases of the new tokens.

| Legacy name | Maps to |
|---|---|
| `--bg-primary` | `--paper` |
| `--bg-secondary`, `--white` | `--paper-raised` |
| `--text-primary` | `--ink` |
| `--text-secondary` | `--ink-2` |
| `--text-muted` | `--ink-3` |
| `--border` | `--rule` |
| `--border-strong` | `--rule-strong` |
| `--accent-coral` | `--coral` |
| `--accent-coral-dark` | `--coral-ink` |
| `--accent-amber` | `--amber` |
| `--accent-teal` | `--teal` |
| `--surface-coral` | `--coral-wash` |
| `--pointer-left` | `--role-ptr-a` |
| `--pointer-right` | `--role-ptr-b` |
| `--state-success` | `--role-found` |
| `--state-danger` | `--role-error` |
| `--state-warning` | `--amber` |

Keep `--surface-teal`, `--surface-amber`, `--surface-highlight`, `--surface-success`, `--surface-danger`, `--bg-dark*` and `--text-inverse-*` as they are, with dark-mode-friendly values. Remove `--color-pointer`, `--color-active`, `--color-error`, `--color-target` and `--color-neutral`, and fix their usages to use role tokens.

## 3. Typography
Load all fonts with `next/font/google` in `app/fonts.ts`: latin subset, `display: 'swap'`, each exposed as a CSS variable on `<html>`. There must be **no** `@import` from fonts.googleapis.com.

| Variable | Font | Weights | Use |
|---|---|---|---|
| `--font-serif` | Fraunces (variable, `opsz` axis) | 400–700 | `.t-display` only (home hero) |
| `--font-sans` | Inter (variable) | 100–900 | headings, body and UI |
| `--font-mono` | JetBrains Mono | 400, 500, 600 | code, values in cells, variables |
| `--font-hand` | Caveat | 500 | handwritten callouts only, never body text |

Legacy font variables are aliases: `--font-dmsans` maps to `--font-sans` and `--font-dmmono` to `--font-mono`. The typo `--font-dm-mono` is also aliased to `--font-mono` until its usages are swept.

**Type scale.** Sizes are in px, written as size/line-height. Classes live in `@layer components`.

| Class | Spec |
|---|---|
| `.t-display` | `clamp(40px,6vw,72px)` / 1.05, serif 600, `font-variation-settings: "opsz" 144`, letter-spacing -0.02em |
| `.t-h1` | `clamp(28px,3.2vw,34px)` / 1.2, Inter 600, letter-spacing -0.015em, `--ink` |
| `.t-h2` | 24/32, Inter 600, `--ink` |
| `.t-h3` | 20/30, Inter 600, `--ink` |
| `.t-body` | 16/28 (17/28 from md), Inter 400, `--ink-2` |
| `.prose-notebook` | 68ch max width; 16/28 (17 from md), `--ink-2`; h2/h3 Inter 600 `--ink`; paragraph gap 1.1em, list gap 0.5em |
| `.anchor-heading` | `<h2 id class="anchor-heading"><a href="#id">Title</a></h2>`: link looks like plain heading text; a `#` fades in to its left on hover/focus-visible (>= md). `scroll-margin-top: 96px` |
| `.t-small` | 14/20 |
| `.t-caption` | 13/18, sans 500, letter-spacing 0.01em |
| `.t-eyebrow` | 12/16, sans 600, uppercase, letter-spacing 0.08em, `--ink-3` |

## 4. Space, shape, elevation
- **Spacing:** 4px base. Use Tailwind's default scale: 1=4, 2=8, 3=12, 4=16, 6=24, 8=32, 12=48, 16=64, 24=96. Lesson sections are separated by 64px (`gap-16`) on desktop and 48px on mobile.
- **Radii:** `--r-cell: 6px`, `--r-card: 8px`, `--r-control: 6px` (buttons, inputs, chips), `--r-pill: 999px`. Legacy `--radius` maps to `--r-card` and `--radius-sm` to `--r-cell`.
- **Shadows** are ink-tinted, never coral:

| Token | Light | Dark |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgba(0,0,0,.04)` (almost none; cards are flat) | `0 1px 2px rgba(0,0,0,.3)` |
| `--shadow-2` | `0 4px 12px rgba(0,0,0,.06)` (hover only) | `0 4px 12px rgba(0,0,0,.4)` |

  Legacy `--shadow-card` maps to `--shadow-1` and `--shadow-card-hover` to `--shadow-2`.
- **Graph paper:** the `.graph-paper` utility draws a 24px grid in `--grid` on `--paper-raised`. It is used only on the Stage surface.

## 5. Tailwind mapping (`tailwind.config.ts`)
- **Colours:** `paper`, `paper-raised`, `paper-sunken`, `ink`, `ink-2`, `ink-3`, `rule`, `rule-strong`, `coral`, `coral-ink`, `coral-ink-2`, `coral-wash`, `amber`, `amber-ink`, `teal`, `teal-ink`, `found-ink`, `error-ink`, `control` (the `--control-border` token). Also `role-ptr-a`, `role-ptr-b`, `role-focus`, `role-compare`, `role-found`, `role-error`, each as `var(--…)`.
- **Font families:** `serif`, `sans`, `mono`, `hand`. Keep `dmsans` (now Inter) and `dmmono` as aliases, and add `lora` → serif as a temporary alias until the sweep.
- **Border radius:** `cell`, `card`, `control`, `pill`.
- **Shadows:** `1` and `2`.

## 6. Motion (`lib/motion.ts`)

| Export | Value | Use |
|---|---|---|
| `spring` | `{ type: 'spring', stiffness: 300, damping: 30 }` | positions: pointers, cells, nodes |
| `springSnappy` | stiffness 420, damping 34 | small tags |
| `fade` | `{ duration: 0.16, ease: 'easeOut' }` | colour and opacity changes |
| `flash` | `{ duration: 0.3 }` | the "changed" highlighter |
| `STEP_MS` | `900` | autoplay base interval, divided by speed |
| `revealOnScroll` | 8px y + opacity, once | entering content |

- The root wraps the app in `<MotionConfig reducedMotion="user">`.
- When reduced motion is on, autoplay never starts by itself, and springs become instant cross-fades.

## 7. Interaction and accessibility
- **Hit targets:** at least 40px, and at least 44px on touch.
- **Focus:** always visible, using `--focus-ring`.
- **Keyboard:** everything interactive is reachable. The Stage uses ←/→, Space, Home/End.
- **Contrast:** WCAG AA in both themes. Any text in `--ink-3` must still reach 4.5:1.
  - Text colours: `ink`, `ink-2`, `ink-3`, `coral-ink`, `amber-ink`, `teal-ink`, `found-ink`, `error-ink`. Never use `coral`, `amber`, `teal`, `role-found` or `role-error` for small text; they are for strokes, icons and fills (3:1).
  - A filled primary button is `bg-coral-ink` (hover `bg-coral-ink-2`) with `text-paper`. `bg-coral` is only for bars, dots and rings.
  - Inside a coral or teal wash, `--ink-3` is below 4.5:1 in dark mode. Use `--ink-2` there.
- **Names match labels.** If a control shows text, its accessible name must start with that text. Do not put an `aria-label` on it; use `aria-describedby` for extra context (see the "I solved this" toggles).
- **Scrollers are focusable.** Any element that can scroll (`overflow-x/y: auto`) and has no focusable child gets `tabIndex={0}`, `role="region"`, an `aria-label` and a visible focus ring.
- **Colour is never the only signal.** Every role keeps its non-colour cue from the table in section 2.

## 8. Voice in the UI
- **Short and warm.** Buttons are verbs: "Watch it run", "Try your own", "Check my answer".
- **No fake data.** No invented stats, testimonials or streaks.
- **Honest status.** Lessons are labelled **Live** or **Draft**, never "coming soon".

## 9. Refinement (Odin-inspired)
Direction: `docs/REFINE_BRIEF.md`. Summary of what changed, with token names untouched:
- **Type.** Inter replaces DM Sans, and headings are now sans (Inter 600). Fraunces survives only as `.t-display`. Headings use `--ink`, body copy `--ink-2` (set on `<body>`). Body is 16/28, 17/28 from `md`. `.anchor-heading` adds `#` permalinks.
- **Palette.** Warm stone neutrals (near-white paper, white cards), a quieter `--rule`, a much fainter `--grid`, subtler washes. Coral values are unchanged; `--coral-ink` is the one accent. Role colours appear only in diagrams and quiz feedback.
- **Shape.** Cards 8px, controls 6px (`rounded-control`). Cards are flat with a 1px rule; shadow appears only on hover (`Card interactive`, 1px lift). `.button-primary` no longer lifts.
- **Components.** Button: 6px radius, medium weight, 40px (`md`) / 44px (`lg`); secondary = raised fill, `--rule-strong` border, `--ink-2` text; ghost hovers to sunken. Chip: 6px radius, 12-13px, neutral by default. Callout: sunken fill, 3px left rule (coral-ink / teal / amber / rule-strong), small-caps label, no serif italic. Disclosure, SegmentedControl, Tooltip, Kbd, Prose: matching radii and weights.
- **Smoothness.** `scroll-padding-top: 96px` on `html`, `text-rendering: optimizeLegibility`, antialiased font smoothing.
- **Contrast.** All text pairs are >= 4.5:1 and UI boundaries >= 3:1 on paper, raised and sunken, in both themes (checked with a WCAG script over every text/surface pair, including washes).
