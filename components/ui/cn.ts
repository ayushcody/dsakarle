/** Tiny class-name joiner: drops falsy values, no dependencies. */
export type ClassValue = string | number | false | null | undefined | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v && v !== 0) continue;
    if (Array.isArray(v)) {
      const inner = cn(...v);
      if (inner) out.push(inner);
    } else {
      out.push(String(v));
    }
  }
  return out.join(' ');
}

/** Shared `:focus-visible` ring (2px, 2px offset, `--focus-ring`). */
export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
