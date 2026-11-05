import { describe, expect, it } from "vitest";
import type { CallTreeScene } from "@/lib/engine/types";
import { layoutCallTree } from "@/components/stage/scenes/kinds/call-tree-layout";
import { sketchLine } from "@/lib/stage/sketch";

const scene = {
  kind: "call-tree",
  calls: [
    { id: "a", label: "f(3)", parent: null, status: "active" },
    { id: "b", label: "f(2)", parent: "a", status: "returned", result: "2" },
    { id: "c", label: "f(1)", parent: "a", status: "pending" },
    { id: "d", label: "f(0)", parent: "ghost", status: "pending" },
  ],
  stack: ["a"],
} as unknown as CallTreeScene;

describe("layoutCallTree edges", () => {
  it("gives every edge finite endpoints so a connector path always starts with M", () => {
    for (const density of ["comfortable", "compact"] as const) {
      const { edges } = layoutCallTree(scene, density);
      expect(edges.length).toBe(2);
      for (const e of edges) {
        for (const n of [e.from.x, e.from.y, e.to.x, e.to.y]) expect(Number.isFinite(n)).toBe(true);
        expect(sketchLine(e.from.x, e.from.y, e.to.x, e.to.y, { seed: 1 })).toMatch(/^M/);
      }
    }
  });
});
