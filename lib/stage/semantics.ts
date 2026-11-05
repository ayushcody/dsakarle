/**
 * The ONLY place that maps roles to visuals.
 *
 * Stage primitives never name a colour; they ask this module. Every role has a
 * non-colour cue (shape, glyph, dash, hatch...) so colour is never the only
 * signal. Token names come from docs/DESIGN_SYSTEM.md; the fallbacks keep the
 * primitives legible if a token is missing.
 */
import type { MarkRole, PointerRole, VarRole } from "@/lib/engine/types";

const v = (name: string, fallback: string) => `var(--${name}, ${fallback})`;

// ---------------------------------------------------------------------------
// Fonts and surfaces (neutral, non-role)
// ---------------------------------------------------------------------------

export const FONT_MONO = v(
  "font-mono",
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
);
export const FONT_HAND = v("font-hand", "'Caveat', 'Comic Sans MS', cursive");
export const FONT_SANS = v("font-sans", "'DM Sans', system-ui, sans-serif");

export const SURFACE = {
  paper: v("paper", "#FBF5EF"),
  raised: v("paper-raised", "#FFFDF9"),
  sunken: v("paper-sunken", "#F4ECE3"),
  ink: v("ink", "#1D1B19"),
  ink2: v("ink-2", "#4A4540"),
  ink3: v("ink-3", "#6F6861"),
  rule: v("rule", "rgba(29,27,25,0.12)"),
  ruleStrong: v("rule-strong", "rgba(29,27,25,0.24)"),
  grid: v("grid", "rgba(29,27,25,0.045)"),
} as const;

// ---------------------------------------------------------------------------
// Cues
// ---------------------------------------------------------------------------

export type CueKind =
  | "tag-below" // pointer tag under the cell, triangle pointing up
  | "tag-above" // pointer tag over the cell, triangle pointing down
  | "ring" // solid outline ring
  | "dashed" // dashed outline
  | "bracket" // sketched bracket + wash
  | "hatch" // pencil hatching
  | "strike" // faded + struck through
  | "flash" // short highlighter flash
  | "glyph" // a glyph badge
  | "glyph-zigzag" // a glyph badge and a zigzag underline
  | "none";

export interface RoleCue {
  kind: CueKind;
  /** Glyph drawn for this cue (triangle, check, cross...). */
  glyph?: string;
  /** Stroke width for ring / dashed / bracket cues. */
  strokeWidth?: number;
  /** SVG dasharray for dashed cues. */
  dash?: string;
  /** Opacity applied to the element for `strike`. */
  opacity?: number;
  /** One short phrase for legends and tooltips. */
  description: string;
}

export interface RoleVisual {
  stroke: string;
  fill: string;
  wash: string;
  text: string;
  cue: RoleCue;
}

export const RING_WIDTH = 2;
export const COMPARE_DASH = "4 3";
/** Numeric twin of `--role-discarded-opacity` (framer-motion cannot animate to a CSS var). */
export const DISCARDED_OPACITY = 0.35;
export const HATCH_STROKE = v("role-visited", "rgba(29,27,25,0.35)");

// ---------------------------------------------------------------------------
// Visuals per role
// ---------------------------------------------------------------------------

const ptrA = v("role-ptr-a", "#1E7B6C");
const ptrB = v("role-ptr-b", "#4C55B8");
const focus = v("role-focus", "#CC5A37");
const compare = v("role-compare", "#B57D12");
const found = v("role-found", "#2F8F4E");
const error = v("role-error", "#C23B3B");

export const NEUTRAL_VISUAL: RoleVisual = {
  stroke: SURFACE.ruleStrong,
  fill: SURFACE.raised,
  wash: SURFACE.sunken,
  text: SURFACE.ink,
  cue: { kind: "none", description: "Plain" },
};

export const POINTER_VISUAL: Record<PointerRole, RoleVisual> = {
  ptrA: {
    stroke: ptrA,
    fill: ptrA,
    wash: v("role-ptr-a-wash", "rgba(30,123,108,0.12)"),
    text: ptrA,
    cue: {
      kind: "tag-below",
      glyph: "▲",
      description: "Tag below the cell, pointing up",
    },
  },
  ptrB: {
    stroke: ptrB,
    fill: ptrB,
    wash: v("role-ptr-b-wash", "rgba(76,85,184,0.12)"),
    text: ptrB,
    cue: {
      kind: "tag-above",
      glyph: "▼",
      description: "Tag above the cell, pointing down",
    },
  },
  focus: {
    stroke: focus,
    fill: v("coral-wash", "rgba(204,90,55,0.10)"),
    wash: v("coral-wash", "rgba(204,90,55,0.10)"),
    text: v("coral-ink", "#A83A1D"),
    cue: {
      kind: "ring",
      strokeWidth: RING_WIDTH,
      description: "Solid 2px ring",
    },
  },
};

export const MARK_VISUAL: Record<MarkRole, RoleVisual> = {
  focus: POINTER_VISUAL.focus,
  compare: {
    stroke: compare,
    fill: "transparent",
    wash: "transparent",
    text: compare,
    cue: {
      kind: "dashed",
      dash: COMPARE_DASH,
      strokeWidth: RING_WIDTH,
      description: "Dashed outline",
    },
  },
  visited: {
    stroke: HATCH_STROKE,
    fill: "transparent",
    wash: "transparent",
    text: SURFACE.ink3,
    cue: { kind: "hatch", description: "Pencil hatching" },
  },
  discarded: {
    stroke: SURFACE.ink3,
    fill: "transparent",
    wash: "transparent",
    text: SURFACE.ink3,
    cue: {
      kind: "strike",
      opacity: DISCARDED_OPACITY,
      description: "Faded and struck through",
    },
  },
  changed: {
    stroke: v("role-changed", "#F6D36B"),
    fill: v("role-changed", "#F6D36B"),
    wash: v("role-changed", "#F6D36B"),
    text: SURFACE.ink,
    cue: { kind: "flash", description: "Brief highlighter flash" },
  },
  found: {
    stroke: found,
    fill: found,
    wash: v("role-found-wash", "rgba(47,143,78,0.12)"),
    text: found,
    cue: { kind: "glyph", glyph: "✓", description: "Check mark" },
  },
  error: {
    stroke: error,
    fill: error,
    wash: v("role-error-wash", "rgba(194,59,59,0.10)"),
    text: error,
    cue: { kind: "glyph-zigzag", glyph: "✕", description: "Cross and zigzag" },
  },
};

export const WINDOW_VISUAL: RoleVisual = {
  stroke: v("role-window", "#CC5A37"),
  fill: v("role-window-wash", "rgba(204,90,55,0.08)"),
  wash: v("role-window-wash", "rgba(204,90,55,0.08)"),
  text: v("coral-ink", "#A83A1D"),
  cue: {
    kind: "bracket",
    strokeWidth: 2,
    description: "Sketched bracket with a tint",
  },
};

export const VAR_VISUAL: Record<VarRole, RoleVisual> = {
  ptrA: POINTER_VISUAL.ptrA,
  ptrB: POINTER_VISUAL.ptrB,
  focus: POINTER_VISUAL.focus,
  value: {
    ...NEUTRAL_VISUAL,
    text: SURFACE.ink,
    cue: { kind: "none", description: "Plain value" },
  },
  best: {
    stroke: v("amber", "#D99B26"),
    fill: v("amber", "#D99B26"),
    wash: v("amber", "#D99B26"),
    text: SURFACE.ink,
    cue: { kind: "glyph", glyph: "★", description: "Star" },
  },
};

// ---------------------------------------------------------------------------
// Arrow roles (links and pointer arrows)
// ---------------------------------------------------------------------------

export type ArrowRole =
  | "neutral"
  | "ptrA"
  | "ptrB"
  | "focus"
  | "compare"
  | "changed"
  | "found"
  | "error";

export const ARROW_ROLES: readonly ArrowRole[] = [
  "neutral",
  "ptrA",
  "ptrB",
  "focus",
  "compare",
  "changed",
  "found",
  "error",
] as const;

export function arrowVisual(role: ArrowRole = "neutral"): RoleVisual {
  if (role === "neutral") return { ...NEUTRAL_VISUAL, stroke: SURFACE.ink2 };
  if (role === "ptrA" || role === "ptrB") return POINTER_VISUAL[role];
  const base = MARK_VISUAL[role];
  // The "changed" highlighter colour is too pale for a line; use ink with the flash cue.
  if (role === "changed")
    return { ...base, stroke: SURFACE.ink, text: SURFACE.ink };
  return base;
}

// ---------------------------------------------------------------------------
// Lookups, labels, precedence
// ---------------------------------------------------------------------------

export type RoleKey = PointerRole | MarkRole | VarRole | "window";

/** Human names for legends. */
export const ROLE_LABEL: Record<RoleKey, string> = {
  ptrA: "Left / slow pointer",
  ptrB: "Right / fast pointer",
  focus: "Being processed",
  compare: "Comparing",
  visited: "Already seen",
  discarded: "Out of play",
  changed: "Just changed",
  found: "Found it",
  error: "Rule broken",
  window: "Active window",
  value: "Value",
  best: "Best so far",
};

export function markVisual(role: MarkRole): RoleVisual {
  return MARK_VISUAL[role];
}

export function pointerVisual(role: PointerRole): RoleVisual {
  return POINTER_VISUAL[role];
}

/** Resolved look of a shape (cell, node, bucket) given every mark that applies. */
export interface ShapeLook {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  hatch: boolean;
  flash: boolean;
  ring: boolean;
  dashed: boolean;
  strike: boolean;
  found: boolean;
  error: boolean;
}

/** error > found > focus/compare tint for fill and stroke; the other cues stack. */
export function resolveShapeLook(
  marks: readonly MarkRole[],
  base: { fill?: string; stroke?: string } = {},
): ShapeLook {
  const has = (r: MarkRole) => marks.includes(r);
  let fill = base.fill ?? NEUTRAL_VISUAL.fill;
  let stroke = base.stroke ?? NEUTRAL_VISUAL.stroke;
  let strokeWidth = 1.5;
  if (has("focus")) fill = MARK_VISUAL.focus.wash;
  if (has("found")) {
    fill = MARK_VISUAL.found.wash;
    stroke = MARK_VISUAL.found.stroke;
    strokeWidth = 2;
  }
  if (has("error")) {
    fill = MARK_VISUAL.error.wash;
    stroke = MARK_VISUAL.error.stroke;
    strokeWidth = 2;
  }
  return {
    fill,
    stroke,
    strokeWidth,
    opacity: has("discarded") ? DISCARDED_OPACITY : 1,
    hatch: has("visited"),
    flash: has("changed"),
    ring: has("focus"),
    dashed: has("compare"),
    strike: has("discarded"),
    found: has("found"),
    error: has("error"),
  };
}
