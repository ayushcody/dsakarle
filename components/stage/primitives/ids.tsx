"use client";

import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ReactNode,
} from "react";
import type { ArrowRole } from "@/lib/stage/semantics";

/** Per-svg unique ids for shared <defs> (hatch pattern, arrow markers, grid). */
export interface StageIds {
  prefix: string;
  hatch: string;
  grid: string;
  marker: (role: ArrowRole) => string;
  /** `url(#...)` references. */
  hatchUrl: string;
  gridUrl: string;
  markerUrl: (role: ArrowRole) => string;
}

export function makeStageIds(prefix: string): StageIds {
  return {
    prefix,
    hatch: `${prefix}-hatch`,
    grid: `${prefix}-grid`,
    marker: (role) => `${prefix}-arrow-${role}`,
    hatchUrl: `url(#${prefix}-hatch)`,
    gridUrl: `url(#${prefix}-grid)`,
    markerUrl: (role) => `url(#${prefix}-arrow-${role})`,
  };
}

/** useId-based, SSR-stable, safe to use inside `url(#...)`. Call once per stage svg. */
export function useStageIds(): StageIds {
  const raw = useId();
  return useMemo(
    () => makeStageIds(`st-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`),
    [raw],
  );
}

const StageIdsContext = createContext<StageIds>(makeStageIds("st"));

/** Wrap the stage svg so Defs and every primitive agree on ids. Creates its own ids unless given. */
export function StageIdsProvider({
  ids,
  children,
}: {
  ids?: StageIds;
  children: ReactNode;
}) {
  const own = useStageIds();
  return (
    <StageIdsContext.Provider value={ids ?? own}>
      {children}
    </StageIdsContext.Provider>
  );
}

/** Ids for the current stage svg; `idPrefix` overrides the context. */
export function useStageScope(idPrefix?: string): StageIds {
  const ctx = useContext(StageIdsContext);
  return useMemo(
    () => (idPrefix ? makeStageIds(idPrefix) : ctx),
    [idPrefix, ctx],
  );
}
