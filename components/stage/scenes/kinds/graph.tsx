"use client";

/**
 * Graph scene: BFS / DFS / shortest-path pictures.
 *
 * Geometry lives in ./graph-layout (pure). Nodes are circles on the tracer's
 * logical grid, edges are sketched lines (heads when directed, bent apart when
 * an opposite edge exists), weights sit on small paper chips, badges (BFS
 * distance, DFS order) hang under their node, pointers are tags.
 *
 * Note targets: `node:<id>`, `ptr:<name>`, `edge:<from>-<to>`.
 * Pickable: nodes (pick target = node id).
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { GraphScene as GraphSceneData } from "@/lib/engine/types";
import { Arrow, Node, PointerTag } from "@/components/stage/primitives";
import { usePositionTransition } from "@/components/stage/primitives/motion-utils";
import { sketchArrow } from "@/lib/stage/sketch";
import {
  DISCARDED_OPACITY,
  FONT_MONO,
  RING_WIDTH,
  SURFACE,
  arrowVisual,
  pointerVisual,
} from "@/lib/stage/semantics";
import { PickRect, SceneFrame, type SceneKindProps } from "../SceneFrame";
import { planNotes } from "../layout";
import {
  describeGraph,
  layoutGraph,
  resolveGraphTarget,
  type GraphBadgeGeom,
  type GraphEdgeGeom,
  type GraphLayout,
  type GraphNodeGeom,
} from "./graph-layout";

export { describeGraph, layoutGraph, resolveGraphTarget };
export type { GraphLayout };

/** One edge: sketched shaft, with an open head when directed. Discarded edges fade and dash. */
function EdgeView({ edge }: { edge: GraphEdgeGeom }) {
  const transition = usePositionTransition("snappy");
  const discarded = edge.tone === "discarded";
  const width = edge.tone === "visited" ? 2.8 : edge.role === "neutral" ? 1.8 : 2.4;
  const d = useMemo(
    () => sketchArrow(edge.p0, edge.p1, { seed: edge.seed, curve: edge.curve }),
    [edge.p0, edge.p1, edge.seed, edge.curve],
  );
  return (
    <motion.g
      initial={false}
      animate={{ opacity: discarded ? DISCARDED_OPACITY : 1 }}
      transition={transition}
    >
      {edge.directed ? (
        <Arrow
          from={edge.p0}
          to={edge.p1}
          curve={edge.curve}
          role={edge.role}
          dashed={discarded}
          seed={edge.seed}
          strokeWidth={width}
        />
      ) : (
        <motion.path
          initial={false}
          animate={{ d }}
          transition={transition}
          fill="none"
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={discarded ? "5 4" : undefined}
          aria-hidden="true"
          style={{ stroke: arrowVisual(edge.role).stroke }}
        />
      )}
    </motion.g>
  );
}

/** Weight label: mono text on a small paper chip so crossing edges do not strike through it. */
function WeightChip({ edge }: { edge: GraphEdgeGeom }) {
  const transition = usePositionTransition("snappy");
  const chip = edge.chip;
  if (!chip || edge.weight === undefined) return null;
  const vis = arrowVisual(edge.role);
  const neutral = edge.role === "neutral";
  return (
    <motion.g
      initial={false}
      animate={{
        x: chip.cx,
        y: chip.cy,
        opacity: edge.tone === "discarded" ? DISCARDED_OPACITY : 1,
      }}
      transition={transition}
      role="img"
      aria-label={`weight ${edge.weight}`}
    >
      <rect
        x={-chip.w / 2}
        y={-chip.h / 2}
        width={chip.w}
        height={chip.h}
        rx={chip.h / 2}
        strokeWidth={1.2}
        style={{
          fill: SURFACE.raised,
          stroke: neutral ? SURFACE.ruleStrong : vis.stroke,
        }}
      />
      <text
        y={0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        style={{ fill: neutral ? SURFACE.ink2 : vis.text, fontFamily: FONT_MONO }}
      >
        {edge.weight}
      </text>
    </motion.g>
  );
}

/** Small chip under a node: BFS distance, DFS order... */
function Badge({ badge }: { badge: GraphBadgeGeom }) {
  const transition = usePositionTransition("snappy");
  return (
    <motion.g
      initial={false}
      animate={{ x: badge.cx, y: badge.cy }}
      transition={transition}
      role="img"
      aria-label={`badge ${badge.text}`}
    >
      <rect
        x={-badge.w / 2}
        y={-badge.h / 2}
        width={badge.w}
        height={badge.h}
        rx={badge.h / 2}
        strokeWidth={1.2}
        style={{ fill: SURFACE.sunken, stroke: SURFACE.ruleStrong }}
      />
      <text
        y={0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        style={{ fill: SURFACE.ink2, fontFamily: FONT_MONO }}
      >
        {badge.text}
      </text>
    </motion.g>
  );
}

/** Ring for a node that carries a `focus` pointer (the `focus` mark draws its own). */
function FocusRing({ node }: { node: GraphNodeGeom }) {
  const transition = usePositionTransition("snappy");
  return (
    <motion.g
      initial={false}
      animate={{ x: node.cx, y: node.cy }}
      transition={transition}
      aria-hidden="true"
    >
      <circle
        r={node.r + 4}
        fill="none"
        strokeWidth={RING_WIDTH}
        style={{ stroke: pointerVisual("focus").stroke }}
      />
    </motion.g>
  );
}

export function GraphSceneView({
  scene,
  density = "comfortable",
  pickable = false,
  onPick,
  className,
  ariaLabel,
  notes,
  minNoteRows = 0,
}: SceneKindProps<GraphSceneData>) {
  const layout = useMemo(() => layoutGraph(scene, density), [scene, density]);
  const allNotes = useMemo(
    () => [...(scene.annotations ?? []), ...(notes ?? [])],
    [scene.annotations, notes],
  );
  const plan = useMemo(
    () => planNotes(scene, layout, allNotes, density, { minTopRows: minNoteRows }),
    [scene, layout, allNotes, density, minNoteRows],
  );
  const summary = useMemo(() => describeGraph(scene), [scene]);

  return (
    <SceneFrame
      width={layout.width}
      height={layout.height}
      plan={plan}
      ariaLabel={ariaLabel}
      summary={summary}
      interactive={pickable}
      className={className}
    >
      {layout.edges.map((e) => (
        <EdgeView key={`edge-${e.key}`} edge={e} />
      ))}
      {layout.edges.map((e) => (
        <WeightChip key={`w-${e.key}`} edge={e} />
      ))}

      {layout.nodes.map((n) => (
        <Node
          key={`node-${n.id}`}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          value={n.label}
          marks={n.marks}
          seed={n.seed}
        />
      ))}
      {layout.nodes
        .filter((n) => n.focusRing)
        .map((n) => (
          <FocusRing key={`ring-${n.id}`} node={n} />
        ))}
      {layout.nodes.map((n) =>
        n.badge ? <Badge key={`badge-${n.id}`} badge={n.badge} /> : null,
      )}

      {layout.tags.map((t) => (
        <PointerTag
          key={`ptr-${t.key}`}
          x={t.x}
          y={t.y}
          name={t.name}
          role={t.role}
          offset={t.offset}
        />
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
            label={`Pick node ${n.label}`}
            onActivate={() => onPick?.(n.id)}
          />
        ))}
    </SceneFrame>
  );
}
