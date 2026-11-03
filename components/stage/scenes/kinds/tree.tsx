"use client";

/**
 * Tree scene — binary trees, BSTs, heaps drawn as trees and n-ary tries.
 *
 * Geometry lives in ./tree-layout.ts (pure, no React). This file draws it:
 * sketched edges (no arrowheads), circular Node primitives keyed by node id so
 * they glide between frames, trie edge labels and terminal double rings,
 * pointer tags, focus rings, a dashed leader for floating nodes, and pick
 * buttons.
 *
 * Note targets: `node:<id>` (or `cell:<id>`) and `ptr:<name>`.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { TreeScene as TreeSceneData } from "@/lib/engine/types";
import { Node, PointerTag } from "@/components/stage/primitives";
import { useColorTransition, usePositionTransition } from "@/components/stage/primitives/motion-utils";
import { sketchCircle, sketchLine } from "@/lib/stage/sketch";
import {
  FONT_MONO,
  RING_WIDTH,
  SURFACE,
  arrowVisual,
  markVisual,
  pointerVisual,
} from "@/lib/stage/semantics";
import { PickRect, SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes, type Density, type TargetInfo } from "../layout";
import {
  describeTreeScene,
  layoutTreeGeometry,
  resolveTreeTargetIn,
  seedOf,
  type TreeEdgeGeom,
  type TreeEdgeRole,
  type TreeLayout,
  type TreeLeader,
  type TreeNodeGeom,
} from "./tree-layout";

export type { TreeLayout };

export function layoutTree(scene: TreeSceneData, density: Density = "comfortable"): TreeLayout {
  return layoutTreeGeometry(scene, density);
}

/** `node:<id>` / `ptr:<name>`; null for anything the scene does not contain. */
export function resolveTreeTarget(scene: TreeSceneData, layout: TreeLayout, target: string): TargetInfo | null {
  void scene;
  return resolveTreeTargetIn(layout, target);
}

export function describeTree(scene: TreeSceneData): string {
  return describeTreeScene(scene);
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

function edgeLook(role: TreeEdgeRole) {
  if (role === "neutral") return { stroke: arrowVisual("neutral").stroke, text: SURFACE.ink2, width: 1.8 };
  const vis = role === "visited" ? markVisual("visited") : arrowVisual(role);
  // Marked edges are heavier as well as coloured, so the cue survives greyscale.
  return { stroke: vis.stroke, text: vis.text, width: 3 };
}

function TreeEdge({ edge }: { edge: TreeEdgeGeom }) {
  const transition = usePositionTransition("spring");
  const colorTransition = useColorTransition();
  const look = edgeLook(edge.role);
  const d = useMemo(
    () => sketchLine(edge.from.x, edge.from.y, edge.to.x, edge.to.y, { seed: edge.seed, roughness: 0.6 }),
    [edge.from.x, edge.from.y, edge.to.x, edge.to.y, edge.seed],
  );
  return (
    <g aria-hidden="true">
      <motion.path
        initial={false}
        animate={{ d }}
        transition={transition}
        fill="none"
        strokeLinecap="round"
        style={{ stroke: look.stroke, strokeWidth: look.width, transition: `${colorTransition}, stroke-width 160ms ease-out` }}
      />
      {edge.label !== null && (
        <motion.text
          initial={false}
          animate={{ x: edge.labelAt.x, y: edge.labelAt.y }}
          transition={transition}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontWeight={600}
          strokeWidth={3}
          strokeLinejoin="round"
          style={{ fill: look.text, stroke: SURFACE.paper, paintOrder: "stroke", fontFamily: FONT_MONO }}
        >
          {edge.label}
        </motion.text>
      )}
    </g>
  );
}

/** Trie end-of-word marker: a second ring just outside the node. */
function TerminalRing({ node }: { node: TreeNodeGeom }) {
  const transition = usePositionTransition("spring");
  const d = useMemo(() => sketchCircle(0, 0, node.r + 5, { seed: seedOf(node.id) + 5, roughness: 0.6 }), [node.r, node.id]);
  return (
    <motion.g initial={false} animate={{ x: node.cx, y: node.cy }} transition={transition} aria-hidden="true">
      <path d={d} fill="none" strokeWidth={1.6} strokeLinecap="round" style={{ stroke: SURFACE.ink2 }} />
    </motion.g>
  );
}

/** The `focus` pointer's ring, round to match the node. */
function FocusRing({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const transition = usePositionTransition("snappy");
  return (
    <motion.g initial={false} animate={{ x: cx, y: cy }} transition={transition} aria-hidden="true">
      <circle r={r} fill="none" strokeWidth={RING_WIDTH} style={{ stroke: pointerVisual("focus").stroke }} />
    </motion.g>
  );
}

/** Short dashed tail marking a floating node as "not attached yet". */
function FloatLeader({ leader }: { leader: TreeLeader }) {
  const transition = usePositionTransition("spring");
  const d = useMemo(
    () => sketchLine(leader.from.x, leader.from.y, leader.to.x, leader.to.y, { seed: leader.seed, roughness: 0.6 }),
    [leader.from.x, leader.from.y, leader.to.x, leader.to.y, leader.seed],
  );
  return (
    <motion.path
      initial={false}
      animate={{ d }}
      transition={transition}
      fill="none"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeDasharray="5 4"
      aria-hidden="true"
      style={{ stroke: SURFACE.ink3 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export function TreeSceneView({
  scene,
  density = "comfortable",
  pickable = false,
  onPick,
  className,
  ariaLabel,
  notes,
  minNoteRows = 0,
}: SceneKindProps<TreeSceneData>) {
  const layout = useMemo(() => layoutTree(scene, density), [scene, density]);
  const allNotes = useMemo(
    () => [...(scene.annotations ?? []), ...(notes ?? [])],
    [scene.annotations, notes],
  );
  const plan = useMemo(
    () => planNotes(scene, layout, allNotes, density, { minTopRows: minNoteRows }),
    [scene, layout, allNotes, density, minNoteRows],
  );
  const summary = useMemo(() => describeTree(scene), [scene]);
  const empty = layout.nodes.length === 0;

  return (
    <SceneFrame
      width={layout.width}
      height={layout.height}
      plan={plan}
      ariaLabel={ariaLabel}
      summary={summary}
      interactive={pickable && !empty}
      className={className}
    >
      {empty && (
        <text
          x={layout.width / 2}
          y={layout.height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          style={{ fill: SURFACE.ink3, fontFamily: FONT_MONO }}
        >
          empty tree
        </text>
      )}

      {layout.edges.map((e) => (
        <TreeEdge key={e.key} edge={e} />
      ))}

      {layout.leaders.map((l) => (
        <FloatLeader key={l.key} leader={l} />
      ))}

      {layout.nodes.map((n) => (
        <Node
          key={`node-${n.id}`}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          value={n.value}
          marks={n.marks}
          seed={seedOf(n.id) + 1}
        />
      ))}

      {layout.nodes
        .filter((n) => n.terminal)
        .map((n) => (
          <TerminalRing key={`end-${n.id}`} node={n} />
        ))}

      {layout.rings.map((g) => (
        <FocusRing key={g.key} cx={g.cx} cy={g.cy} r={g.r} />
      ))}

      {layout.tags.map((t) => (
        <PointerTag key={`ptr-${t.key}`} x={t.x} y={t.y} name={t.name} role={t.role} offset={t.offset} />
      ))}

      {pickable &&
        layout.nodes.map((n) => (
          <PickRect
            key={`pick-${n.id}`}
            x={n.cx - n.r}
            y={n.cy - n.r}
            w={n.r * 2}
            h={n.r * 2}
            rx={n.r}
            label={`Pick node ${n.id}, value ${n.value}`}
            onActivate={() => onPick?.(n.id)}
          />
        ))}
    </SceneFrame>
  );
}
