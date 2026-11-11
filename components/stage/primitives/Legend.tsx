"use client";

import { useId } from "react";
import type { MarkRole, PointerRole } from "@/lib/engine/types";
import { sketchBracket } from "@/lib/stage/sketch";
import {
  COMPARE_DASH,
  DISCARDED_OPACITY,
  FONT_MONO,
  FONT_SANS,
  MARK_VISUAL,
  POINTER_VISUAL,
  ROLE_LABEL,
  SURFACE,
  WINDOW_VISUAL,
  type RoleVisual,
} from "@/lib/stage/semantics";
import { HatchPattern } from "./Defs";

export type LegendRole = PointerRole | MarkRole | "window";

export interface LegendProps {
  /** Roles currently on screen. Duplicates are ignored; order is kept. */
  roles: readonly LegendRole[];
  className?: string;
}

function visualFor(role: LegendRole): RoleVisual {
  if (role === "window") return WINDOW_VISUAL;
  if (role === "ptrA" || role === "ptrB") return POINTER_VISUAL[role];
  return MARK_VISUAL[role];
}

const W = 30;
const H = 22;

/** A tiny drawing of the role's cue, so the legend teaches shape as well as colour. */
function Swatch({ role, hatchId }: { role: LegendRole; hatchId: string }) {
  const vis = visualFor(role);
  const box = { x: 5, y: 4, width: 20, height: 14, rx: 3 };
  const base = { fill: SURFACE.raised, stroke: SURFACE.ruleStrong };
  const glyph = (g: string, color: string, size = 12) => (
    <text
      x={W / 2}
      y={H / 2 + 0.5}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fontWeight={700}
      style={{ fill: color, fontFamily: FONT_MONO }}
    >
      {g}
    </text>
  );
  let body;
  switch (vis.cue.kind) {
    case "tag-below":
      body = (
        <>
          <rect
            x={5}
            y={2}
            width={20}
            height={11}
            rx={3}
            strokeWidth={1.2}
            style={base}
          />
          <polygon points="15,14 11,19.5 19,19.5" style={{ fill: vis.fill }} />
        </>
      );
      break;
    case "tag-above":
      body = (
        <>
          <rect
            x={5}
            y={9}
            width={20}
            height={11}
            rx={3}
            strokeWidth={1.2}
            style={base}
          />
          <polygon points="15,8 11,2.5 19,2.5" style={{ fill: vis.fill }} />
        </>
      );
      break;
    case "ring":
      body = (
        <>
          <rect
            x={7}
            y={6}
            width={16}
            height={10}
            rx={2}
            strokeWidth={1.2}
            style={base}
          />
          <rect
            x={4}
            y={3}
            width={22}
            height={16}
            rx={4}
            fill="none"
            strokeWidth={2}
            style={{ stroke: vis.stroke }}
          />
        </>
      );
      break;
    case "dashed":
      body = (
        <rect
          {...box}
          fill="none"
          strokeWidth={2}
          strokeDasharray={vis.cue.dash ?? COMPARE_DASH}
          style={{ stroke: vis.stroke }}
        />
      );
      break;
    case "bracket":
      body = (
        <>
          <rect
            x={3}
            y={3}
            width={24}
            height={10}
            rx={3}
            style={{ fill: vis.wash }}
          />
          <path
            d={sketchBracket(4, 26, 17, { seed: 3, depth: 5 })}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: vis.stroke }}
          />
        </>
      );
      break;
    case "hatch":
      body = (
        <>
          <rect {...box} strokeWidth={1.2} style={base} />
          <rect {...box} fill={`url(#${hatchId})`} />
        </>
      );
      break;
    case "strike":
      body = (
        <g opacity={DISCARDED_OPACITY + 0.2}>
          <rect {...box} strokeWidth={1.2} style={base} />
          <line
            x1={7}
            y1={11}
            x2={23}
            y2={11}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ stroke: vis.stroke }}
          />
        </g>
      );
      break;
    case "flash":
      body = (
        <rect
          {...box}
          strokeWidth={1.2}
          style={{ fill: vis.fill, stroke: SURFACE.ruleStrong }}
        />
      );
      break;
    case "glyph-zigzag":
      body = (
        <>
          <rect
            {...box}
            strokeWidth={1.8}
            style={{ fill: vis.wash, stroke: vis.stroke }}
          />
          {glyph(vis.cue.glyph ?? "✕", vis.stroke, 10)}
        </>
      );
      break;
    case "glyph":
    default:
      body = (
        <>
          <rect
            {...box}
            strokeWidth={1.8}
            style={{ fill: vis.wash, stroke: vis.stroke }}
          />
          {glyph(vis.cue.glyph ?? "", vis.stroke, 11)}
        </>
      );
  }
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      focusable="false"
    >
      {body}
    </svg>
  );
}

/** HTML legend of the roles on screen, each with its cue drawing and plain-English name. */
export function Legend({ roles, className }: LegendProps) {
  const raw = useId();
  const hatchId = `legend-hatch-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const unique = Array.from(new Set(roles));
  if (unique.length === 0) return null;
  return (
    <>
      <svg
        width={0}
        height={0}
        aria-hidden="true"
        style={{ position: "absolute" }}
      >
        <defs>
          <HatchPattern id={hatchId} />
        </defs>
      </svg>
      <ul
        aria-label="Legend"
        className={className}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 16px",
          margin: 0,
          padding: 0,
          listStyle: "none",
          fontFamily: FONT_SANS,
          fontSize: 13,
          lineHeight: "18px",
          color: SURFACE.ink2,
        }}
      >
        {unique.map((role) => (
          <li
            key={role}
            title={visualFor(role).cue.description}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Swatch role={role} hatchId={hatchId} />
            <span>{ROLE_LABEL[role]}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
