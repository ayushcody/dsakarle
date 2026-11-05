"use client";

import { useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import { fade, spring, springSnappy } from "@/lib/motion";

/** Position transition: spring, or an instant-ish cross-fade under reduced motion. */
export function usePositionTransition(
  kind: "spring" | "snappy" = "spring",
): Transition {
  const reduce = useReducedMotion();
  if (reduce) return fade;
  return kind === "snappy" ? springSnappy : spring;
}

/** CSS transition for fill/stroke so role changes fade (CSS can resolve var() colours). */
export function useColorTransition(): string {
  const reduce = useReducedMotion();
  return reduce
    ? "none"
    : "fill 160ms ease-out, stroke 160ms ease-out, opacity 160ms ease-out";
}
