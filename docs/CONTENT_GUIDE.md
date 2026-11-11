# DSA Karle — Content Guide

How to author a lesson that passes validation and feels like DSA Karle. Read this before you touch `content/`, `lib/tracers/` or `content/code/`.

## The promise
A learner should understand **what this is, when to reach for it, and why it works** before they ever see code. Picture first, then watch it run, then predict it, then try your own input, then the code.

## Where things live
| What | Where | Notes |
|---|---|---|
| Which lessons exist, order, title, glyph, difficulty, status | `content/curriculum.json` | The only registry. Never list lessons anywhere else. |
| Lesson prose, quizzes, practice | `content/topics/<slug>.json` | `schemaVersion: 2`, type `LessonV2` in `types/learning.ts` |
| Algorithm tracers | `lib/tracers/<slug>/<algo>.ts` | Implements `Tracer` from `lib/engine/types.ts` |
| Canonical code | `content/code/<slug>/<algo>.{py,java,cpp}` | Path equals the tracer id |
| Tracer tests | `tests/tracers/<slug>.test.ts` | Uses `tests/tracers/harness.ts` |

`status: "live"` only when the v2 lesson is complete and `npm run validate` passes. Everything else stays `draft` — and the site says so honestly.

## Tracers
A tracer runs the real algorithm and records one **frame** per meaningful moment.

- **Pure and deterministic.** No `Math.random` (use `input.random(seed)`), no dates, no globals. Stop at `MAX_FRAMES` (400).
- **One frame per idea, not per line.** A frame is something the learner should see change. Typically 8–40 frames for a preset.
- **`say`**: one sentence, present tense, ≤ 140 chars, names concrete values: "Window sum is 9 — that's the new best." Never "Step 4".
- **`at`**: the rule being executed. Every anchor in `anchors` must be used by some frame and must appear in all three code files.
- **`anchors`** are the Rule Rail, in order, phrased as plain-English rules: `expand: "Add nums[right] to the window"`.
- **Scenes describe state, never layout.** No x/y. Use pointers, `window`, and `marks` with semantic roles (below).
- **`reference(input)`** is an independent, boring implementation. The harness compares it with `run(input).result` on 200 random inputs.
- **Inputs**: `parse` must reject anything outside `limits` with a friendly message ("Use at most 12 numbers"). Default limits: `maxN: 12`, values `-99..99`. Provide 2–3 `presets`; the first is the guided run and should show every rule at least once.

### Predict candidates
Attach `predict` to frame *i* to ask what happens on the way to frame *i + 1*.
- Ask about **decisions**, not arithmetic: "Expand or shrink?", "Which pointer moves?", "Left half or right half?", "Which bucket?".
- `kind: "choice"` with 2–3 short options, or `kind: "cell"` when the answer is a place in the scene (index, node id, bucket).
- Always give `why` (one sentence) and, when useful, a `hint` that nudges without giving it away.
- Emit candidates generously; the lesson chooses which tags to ask and caps them (3–5 per run).

## Code files
Three languages: **Python, Java, C++**. Same algorithm, same variable names, same shape.

Mark the line that implements each rule with a trailing anchor comment:
```python
def max_sum_k(nums, k):
    window = best = 0                      # @init
    for right in range(len(nums)):
        window += nums[right]              # @expand
        if right >= k:
            window -= nums[right - k]      # @shrink
        if right >= k - 1:
            best = max(best, window)       # @record
    return best                            # @done
```
```java
int window = 0, best = 0;                  // @init
```
- Markers are stripped before display; only the anchor id after `@` matters.
- An anchor may mark several lines; a line carries at most one anchor.
- Code must compile/run as shown (Java: one `class Solution` method; C++: a function using `std::vector`). No "omitted for brevity".

## Lesson JSON (v2)
- **hook**: a question the learner can't answer quickly yet ("How do you find the busiest 3-hour stretch in a day of sales without adding every stretch?"), ≤ 2 short paragraphs, and an `aha` that resolves it.
- **shape**: the Picture — one static `scene` plus 2–3 `callouts` (≤ 6 words each) pointing at the key parts.
- **mentalModel**: an everyday metaphor (≤ 3 sentences), one `click` sentence, a small glossary.
- **stage.tracks**: 1–3 tracks (e.g. Access / Insert / Delete for a data structure, or two variants of a pattern). `playground: true` unless input makes no sense.
- **recognise**: 2–4 `useWhen` clues, 1–3 `notWhen` clues, ≥ 3 recognition items whose options are curriculum slugs.
- **template.pseudocode**: lines link to anchors so they light up with the stage.
- **examples**: 2–3, each with working code in all three languages.
- **conceptQuiz**: 5 questions. **Vary the answer position** — no index may hold more than 60% of answers.
- **practice**: 6–8 problems, mixed difficulty, URLs `https://leetcode.com/problems/<slug>/`, an `insight` that hints without solving.

## Voice
- Friendly, precise, short. Second person ("you"). One idea per sentence.
- Concrete before abstract: show `[2, 1, 5, 1, 3, 2]` before saying "array of n integers".
- No fake facts, statistics or quotes. Hedge honestly ("usually", "on average") where complexity depends on the case.
- Use the same words the UI uses: *window*, *pointer*, *bucket*, *node*, *rule*.

## Colour roles (never pick colours directly)
| Role | Means |
|---|---|
| `ptrA` | left / slow / lo / prev pointer |
| `ptrB` | right / fast / hi / curr pointer |
| `focus` | the element being processed now |
| `compare` | being compared |
| `window` | the active range (use `window`, not marks) |
| `visited` | already processed |
| `discarded` | out of play |
| `changed` | value just changed |
| `found` | the answer |
| `error` | a violation |

## Checklist before marking a lesson live
- [ ] `npm run validate` and `npm test` pass
- [ ] Every rule appears in the guided run; predicts feel like decisions
- [ ] Playground rejects bad input kindly and runs good input
- [ ] All three code tabs highlight the right line on every frame
- [ ] Read it aloud: could a smart 16-year-old follow it?
