import { describe, expect, it } from "vitest";
import {
  mulberry32,
  sketchArrow,
  sketchBracket,
  sketchCircle,
  sketchLine,
  sketchRect,
  sketchUnderline,
  zigzag,
} from "@/lib/stage/sketch";

/** Pull every number out of a path string. */
function nums(d: string): number[] {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** Path made only of the commands the helpers emit, with numeric args. */
const VALID = /^M[-\d.\s]+(?:[QCL][-\d.\s]+)*Z?$/;

function firstPoint(d: string): [number, number] {
  const [x, y] = nums(d);
  return [x, y];
}
function lastPoint(d: string): [number, number] {
  const v = nums(d);
  return [v[v.length - 2], v[v.length - 1]];
}

describe("mulberry32", () => {
  it("is deterministic and in [0,1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it("different seeds differ", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("determinism", () => {
  it("same seed -> identical output for every helper", () => {
    const opts = { seed: 7, roughness: 1 };
    expect(sketchLine(0, 0, 100, 20, opts)).toBe(
      sketchLine(0, 0, 100, 20, opts),
    );
    expect(sketchRect(5, 5, 60, 40, { ...opts, radius: 6 })).toBe(
      sketchRect(5, 5, 60, 40, { ...opts, radius: 6 }),
    );
    expect(sketchCircle(30, 30, 20, opts)).toBe(sketchCircle(30, 30, 20, opts));
    expect(sketchBracket(10, 200, 50, { ...opts, depth: 8 })).toBe(
      sketchBracket(10, 200, 50, { ...opts, depth: 8 }),
    );
    expect(sketchUnderline(120, opts)).toBe(sketchUnderline(120, opts));
    expect(
      sketchArrow({ x: 0, y: 0 }, { x: 80, y: 30 }, { ...opts, curve: 0.3 }),
    ).toBe(
      sketchArrow({ x: 0, y: 0 }, { x: 80, y: 30 }, { ...opts, curve: 0.3 }),
    );
  });

  it("does not use Math.random", () => {
    const orig = Math.random;
    Math.random = () => {
      throw new Error("Math.random called");
    };
    try {
      sketchLine(0, 0, 50, 50);
      sketchRect(0, 0, 50, 50, { radius: 4 });
      sketchCircle(0, 0, 10);
      sketchBracket(0, 50, 10);
      sketchUnderline(30);
      sketchArrow({ x: 0, y: 0 }, { x: 10, y: 10 });
    } finally {
      Math.random = orig;
    }
  });

  it("different seeds give different output", () => {
    expect(sketchLine(0, 0, 100, 0, { seed: 1 })).not.toBe(
      sketchLine(0, 0, 100, 0, { seed: 2 }),
    );
  });

  it("default seed is stable", () => {
    expect(sketchLine(0, 0, 100, 0)).toBe(
      sketchLine(0, 0, 100, 0, { seed: 1 }),
    );
  });
});

describe("geometry", () => {
  it("line endpoints stay near the requested points", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const d = sketchLine(10, 20, 210, 80, { seed });
      const [sx, sy] = firstPoint(d);
      const [ex, ey] = lastPoint(d);
      expect(Math.hypot(sx - 10, sy - 20)).toBeLessThanOrEqual(0.5);
      expect(Math.hypot(ex - 210, ey - 80)).toBeLessThanOrEqual(0.5);
    }
  });

  it("line wobble stays within ~1.2px of the chord at roughness 1", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const d = sketchLine(0, 0, 200, 0, { seed });
      const v = nums(d); // M ax ay Q cx cy bx by
      const [ax, ay, cx, cy, bx, by] = v;
      // Quadratic midpoint at t=0.5
      const my = 0.25 * ay + 0.5 * cy + 0.25 * by;
      expect(Math.abs(my)).toBeLessThanOrEqual(1.2);
      expect(Math.abs(ay)).toBeLessThanOrEqual(0.4);
      expect(Math.abs(by)).toBeLessThanOrEqual(0.4);
      expect(Math.abs(ax)).toBeLessThanOrEqual(0.4);
      expect(Math.abs(bx - 200)).toBeLessThanOrEqual(0.4);
      void cx;
    }
  });

  it("roughness 0 is straight", () => {
    const d = sketchLine(0, 0, 100, 0, { roughness: 0 });
    expect(d).toBe("M0 0Q50 0 100 0");
  });

  it("rect stays within 1.2px of its box and closes", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const d = sketchRect(10, 20, 72, 48, { seed, radius: 6 });
      expect(d.endsWith("Z")).toBe(true);
      const v = nums(d);
      for (let i = 0; i < v.length; i += 2) {
        expect(v[i]).toBeGreaterThanOrEqual(10 - 1.2);
        expect(v[i]).toBeLessThanOrEqual(10 + 72 + 1.2);
        expect(v[i + 1]).toBeGreaterThanOrEqual(20 - 1.2);
        expect(v[i + 1]).toBeLessThanOrEqual(20 + 48 + 1.2);
      }
    }
  });

  it("circle stays within 1.2px of the radius (anchors)", () => {
    const d = sketchCircle(50, 50, 20, { seed: 3 });
    expect(d.endsWith("Z")).toBe(true);
    const [x0, y0] = firstPoint(d);
    expect(Math.hypot(x0 - 50, y0 - 50)).toBeLessThanOrEqual(20 + 1.2);
    expect(Math.hypot(x0 - 50, y0 - 50)).toBeGreaterThanOrEqual(20 - 1.2);
  });

  it("bracket spans x1..x2 and ticks reach toward the cells", () => {
    const below = sketchBracket(40, 240, 100, {
      seed: 2,
      depth: 8,
      side: "below",
    });
    const [sx, sy] = firstPoint(below);
    const [ex, ey] = lastPoint(below);
    expect(Math.abs(sx - 40)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(ex - 240)).toBeLessThanOrEqual(0.5);
    expect(sy).toBeLessThan(100); // tick above the bar -> points up at the cells
    expect(ey).toBeLessThan(100);
    const above = sketchBracket(40, 240, 100, {
      seed: 2,
      depth: 8,
      side: "above",
    });
    expect(firstPoint(above)[1]).toBeGreaterThan(100);
  });

  it("bracket tolerates reversed x", () => {
    expect(sketchBracket(240, 40, 100, { seed: 2 })).toBe(
      sketchBracket(40, 240, 100, { seed: 2 }),
    );
  });

  it("underline starts at the origin and ends at width", () => {
    const d = sketchUnderline(120, { seed: 5 });
    const [sx, sy] = firstPoint(d);
    const [ex, ey] = lastPoint(d);
    expect(Math.abs(sx)).toBe(0);
    expect(Math.abs(sy)).toBeLessThanOrEqual(0.4);
    expect(Math.abs(ex - 120)).toBe(0);
    expect(Math.abs(ey)).toBeLessThanOrEqual(0.4);
  });

  it("arrow ends at the target and keeps a fixed M Q structure", () => {
    const from = { x: 20, y: 30 };
    const to = { x: 180, y: 90 };
    for (const curve of [0, 0.25, -0.4]) {
      const d = sketchArrow(from, to, { seed: 9, curve });
      expect(d).toMatch(/^M[-\d.]+ [-\d.]+Q[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+$/);
      const [ex, ey] = lastPoint(d);
      expect(Math.hypot(ex - to.x, ey - to.y)).toBeLessThanOrEqual(0.5);
      const [sx, sy] = firstPoint(d);
      expect(Math.hypot(sx - from.x, sy - from.y)).toBeLessThanOrEqual(0.5);
    }
  });

  it("arrow curve sign bends opposite ways", () => {
    const a = nums(
      sketchArrow({ x: 0, y: 0 }, { x: 100, y: 0 }, { seed: 1, curve: 0.3 }),
    );
    const b = nums(
      sketchArrow({ x: 0, y: 0 }, { x: 100, y: 0 }, { seed: 1, curve: -0.3 }),
    );
    expect(a[3]).toBeGreaterThan(0); // control y: travelling right, + sags downward
    expect(b[3]).toBeLessThan(0);
  });

  it("handles zero-length input without NaN", () => {
    expect(sketchLine(5, 5, 5, 5)).not.toMatch(/NaN/);
    expect(sketchArrow({ x: 1, y: 1 }, { x: 1, y: 1 })).not.toMatch(/NaN/);
    expect(sketchBracket(10, 10, 5)).not.toMatch(/NaN/);
    expect(sketchUnderline(0)).not.toMatch(/NaN/);
  });
});

describe("path syntax", () => {
  const cases: Array<[string, string]> = [
    ["line", sketchLine(0, 0, 100, 10, { seed: 3 })],
    ["rect", sketchRect(0, 0, 60, 40, { seed: 3, radius: 6 })],
    ["rect no radius", sketchRect(0, 0, 60, 40, { seed: 3 })],
    ["circle", sketchCircle(30, 30, 20, { seed: 3 })],
    ["bracket", sketchBracket(0, 100, 20, { seed: 3 })],
    ["underline", sketchUnderline(80, { seed: 3 })],
    [
      "arrow",
      sketchArrow({ x: 0, y: 0 }, { x: 70, y: 20 }, { seed: 3, curve: 0.2 }),
    ],
    ["zigzag", zigzag(0, 0, 40)],
  ];
  it.each(cases)("%s is a valid path", (_name, d) => {
    expect(d).toMatch(VALID);
    expect(d).not.toMatch(/NaN|Infinity|undefined/);
  });

  it("zigzag is regular and ends at width", () => {
    const d = zigzag(10, 50, 40, { amp: 2, step: 10 });
    expect(d).toBe("M10 50L20 48L30 52L40 48L50 52");
  });
});
