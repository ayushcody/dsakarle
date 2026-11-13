/**
 * The /visualize catalog: every walkthrough track of every lesson, in path order.
 * SERVER ONLY (reads lesson JSON through lib/content). Lesson JSON stays the single
 * source of truth: a new stage track shows up in the gallery automatically.
 */
import { getTopicBySlug } from '@/lib/content';
import { PATHS, getLessonMeta, pathLessons } from '@/lib/curriculum';
import type { TracerId } from '@/lib/engine/types';
import type { GlyphId, StageTrack } from '@/types/learning';

export interface VisualEntry {
  /** Tracer id, also the URL: /visualize/<topic>/<algo>. */
  tracer: TracerId
  topic: string
  algo: string
  /** The lesson's track label, e.g. "Meetings: earliest end first". */
  label: string
  /** The track as the lesson configures it (preset, predict tags). */
  track: StageTrack
  lessonSlug: string
  lessonTitle: string
  lessonOneLiner: string
  glyph: GlyphId
  pathId: string
  pathTitle: string
}

export interface VisualGroup {
  pathId: string
  pathTitle: string
  lessons: Array<{ slug: string; title: string; glyph: GlyphId; entries: VisualEntry[] }>
}

let cache: VisualEntry[] | null = null;

export function visualEntries(): VisualEntry[] {
  if (cache) return cache;
  const seen = new Set<string>();
  const out: VisualEntry[] = [];
  for (const path of PATHS) {
    for (const meta of pathLessons(path.id)) {
      const lesson = getTopicBySlug(meta.slug);
      if (!lesson) continue;
      for (const track of lesson.stage.tracks) {
        if (seen.has(track.tracer)) continue;
        seen.add(track.tracer);
        const [topic, algo] = track.tracer.split('/');
        out.push({
          tracer: track.tracer,
          topic,
          algo,
          label: track.label,
          track,
          lessonSlug: meta.slug,
          lessonTitle: meta.title,
          lessonOneLiner: meta.oneLiner,
          glyph: meta.glyph,
          pathId: path.id,
          pathTitle: path.title,
        });
      }
    }
  }
  cache = out;
  return out;
}

export function visualGroups(): VisualGroup[] {
  const entries = visualEntries();
  return PATHS.map((path) => ({
    pathId: path.id,
    pathTitle: path.title,
    lessons: pathLessons(path.id)
      .map((meta) => ({
        slug: meta.slug,
        title: meta.title,
        glyph: getLessonMeta(meta.slug)?.glyph ?? meta.glyph,
        entries: entries.filter((e) => e.lessonSlug === meta.slug),
      }))
      .filter((lesson) => lesson.entries.length > 0),
  })).filter((group) => group.lessons.length > 0);
}

export function getVisual(topic: string, algo: string): VisualEntry | undefined {
  return visualEntries().find((e) => e.topic === topic && e.algo === algo);
}

/** Previous and next visualization in catalog order. */
export function visualNeighbours(tracer: TracerId): { prev?: VisualEntry; next?: VisualEntry } {
  const entries = visualEntries();
  const i = entries.findIndex((e) => e.tracer === tracer);
  if (i < 0) return {};
  return { prev: entries[i - 1], next: entries[i + 1] };
}
