# DSA Karle — Design System Contract

**Identity: the warm notebook.** Cream paper, ink, a coral pen, and graph paper only where thinking happens (the Stage). Calm, precise and a little handmade. Every colour means something.

This file is the contract for token names. Agents implement against these names exactly. Change a name here first, and nowhere else.

## 1. Theme mechanics
- **Choosing the theme.** Light is the default. Dark is selected when `<html data-theme="dark">`. With no `data-theme`, the system preference applies via `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`.
- **No flash.** An inline script in `app/layout.tsx` sets `data-theme` before paint. It reads `localStorage['dsakarle-theme']`, which holds `light`, `dark` or `system`.
- **Toggle.** `components/ui/ThemeToggle.tsx` cycles system → light → dark. It writes the same storage key.

## 2. Colour tokens (CSS custom properties on `:root`)

**Surfaces and ink**

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#FBF5EF` | `#1A1714` | page background |
| `--paper-raised` | `#FFFDF9` | `#23201C` | cards, header, stage |
| `--paper-sunken` | `#F4ECE3` | `#141210` | code blocks, inputs, wells |
| `--ink` | `#1D1B19` | `#EDE6DC` | primary text |
| `--ink-2` | `#4A4540` | `#B8AFA3` | secondary text |
| `--ink-3` | `#6F6861` | `#8C8378` | muted text (must stay ≥ 4.5:1 on paper) |
| `--rule` | `rgba(29,27,25,0.12)` | `rgba(237,230,220,0.14)` | borders, dividers |
| `--rule-strong` | `rgba(29,27,25,0.24)` | `rgba(237,230,220,0.28)` | focused or hovered borders |
| `--grid` | `rgba(29,27,25,0.045)` | `rgba(237,230,220,0.05)` | graph-paper lines (Stage only) |

**Brand**

| Token | Light | Dark | Use |
|---|---|---|---|
| `--coral` | `#CC5A37` | `#F08A64` | brand accent, primary buttons, links |
| `--coral-ink` | `#A83A1D` | `#F5A584` | coral text on paper (AA) |
| `--coral-wash` | `rgba(204,90,55,0.10)` | `rgba(240,138,100,0.14)` | active nav and selected backgrounds |
| `--amber` | `#D99B26` | `#F2C14E` | secondary accent |
| `--teal` | `#1E7B6C` | `#4FB7A5` | tertiary accent |
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
| `--role-visited` | `rgba(29,27,25,0.35)` | `rgba(237,230,220,0.35)` | hatching stroke for processed items | pencil hatching |
| `--role-discarded-opacity` | `0.35` | `0.35` | out of play | strike-through |
| `--role-changed` | `#F6D36B` | `#8A6D1F` | value just changed | 300ms highlighter flash |
| `--role-found` | `#2F8F4E` | `#5CC77E` | answer, success | ✓ glyph |
| `--role-found-wash` | `rgba(47,143,78,0.12)` | `rgba(92,199,126,0.16)` | | |
| `--role-error` | `#C23B3B` | `#F07171` | violation, wrong | ✕ glyph, zigzag |
| `--role-error-wash` | `rgba(194,59,59,0.10)` | `rgba(240,113,113,0.14)` | | |

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
| `--font-serif` | Fraunces (variable, `opsz` axis) | 400–700 | headings, display, the click sentence |
| `--font-sans` | DM Sans | 400, 500, 600, 700 | body and UI |
| `--font-mono` | JetBrains Mono | 400, 500, 600 | code, values in cells, variables |
| `--font-hand` | Caveat | 500 | handwritten callouts only, never body text |

Legacy font variables are aliases: `--font-dmsans` maps to `--font-sans` and `--font-dmmono` to `--font-mono`. The typo `--font-dm-mono` is also aliased to `--font-mono` until its usages are swept.

**Type scale.** Sizes are in px, written as size/line-height. Classes live in `@layer components`.

| Class | Spec |
|---|---|
| `.t-display` | `clamp(40px,6vw,72px)` / 1.05, serif 600, `font-variation-settings: "opsz" 144`, letter-spacing -0.02em |
| `.t-h1` | `clamp(34px,4vw,46px)` / 1.1, serif 600, opsz 96 |
| `.t-h2` | 28/36, serif 600 |
| `.t-h3` | 20/28, serif 600 |
| `.t-body` | 17/28, sans 400 |
| `.prose-notebook` | 68ch max width; sets the body size and paragraph spacing |
| `.t-small` | 14/20 |
| `.t-caption` | 13/18, sans 500, letter-spacing 0.01em |
| `.t-eyebrow` | 12/16, sans 600, uppercase, letter-spacing 0.12em, `--ink-3` |

## 4. Space, shape, elevation
- **Spacing:** 4px base. Use Tailwind's default scale: 1=4, 2=8, 3=12, 4=16, 6=24, 8=32, 12=48, 16=64, 24=96. Lesson sections are separated by 64px (`gap-16`) on desktop and 48px on mobile.
- **Radii:** `--r-cell: 6px`, `--r-card: 10px`, `--r-pill: 999px`. Legacy `--radius` maps to `--r-card` and `--radius-sm` to `--r-cell`.
- **Shadows** are ink-tinted, never coral:

| Token | Light | Dark |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgba(29,27,25,.06), 0 1px 1px rgba(29,27,25,.04)` | `0 1px 2px rgba(0,0,0,.4)` |
| `--shadow-2` | `0 8px 24px rgba(29,27,25,.08)` | `0 8px 24px rgba(0,0,0,.5)` |

  Legacy `--shadow-card` maps to `--shadow-1` and `--shadow-card-hover` to `--shadow-2`.
- **Graph paper:** the `.graph-paper` utility draws a 24px grid in `--grid` on `--paper-raised`. It is used only on the Stage surface.

## 5. Tailwind mapping (`tailwind.config.ts`)
- **Colours:** `paper`, `paper-raised`, `paper-sunken`, `ink`, `ink-2`, `ink-3`, `rule`, `rule-strong`, `coral`, `coral-ink`, `coral-wash`, `amber`, `teal`. Also `role-ptr-a`, `role-ptr-b`, `role-focus`, `role-compare`, `role-found`, `role-error`, each as `var(--…)`.
- **Font families:** `serif`, `sans`, `mono`, `hand`. Keep `dmsans` and `dmmono` as aliases, and add `lora` → serif as a temporary alias until the sweep.
- **Border radius:** `cell`, `card`, `pill`.
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
- **Colour is never the only signal.** Every role keeps its non-colour cue from the table in section 2.

## 8. Voice in the UI
- **Short and warm.** Buttons are verbs: "Watch it run", "Try your own", "Check my answer".
- **No fake data.** No invented stats, testimonials or streaks.
- **Honest status.** Lessons are labelled **Live** or **Draft**, never "coming soon".
