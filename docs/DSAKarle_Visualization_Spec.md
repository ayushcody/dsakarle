# DSAKarle — Visualization Design Specification
# For Agentic IDE: Build this file alongside the Theory Bible PDF and Agentic Prompt
# Every visualizer described here maps 1:1 to a React component in components/diagrams/

---

## GLOBAL VISUALIZATION RULES

### Tech Stack for All Visualizers
- All diagrams: **inline SVG** rendered by React components
- Animations: **Framer Motion** (`motion.rect`, `motion.g`, `motion.line`)
- Stepper sync: **Zustand** store (`currentStep`) drives all visual state
- No canvas, no D3, no external charting — pure SVG + Framer Motion

### Universal Color Coding (NEVER deviate from this)
```
Left pointer:        #16A34A  (green)
Right pointer:       #EA580C  (orange)
Active/current node: #D4603A  (coral)
Highlighted cell:    #CA8A04  (amber background tint)
Visited node:        rgba(29,122,107,0.15)  (teal tint)
Window boundary:     #D4603A  stroke, rgba(212,96,58,0.08) fill
Pruned/invalid:      #DC2626  (red)
Success path:        #16A34A  (green)
Default cell:        #FAF9F7  fill, #E5E0D8 stroke
```

### SVG Coordinate System
- All diagrams use `viewBox="0 0 680 [height]"` — same width as widget container
- Height adjusts to content
- Safe drawing area: x=20 to x=660, y=20 to y=(height-20)
- All text: minimum 12px, DM Mono for values, DM Sans for labels

### Animation Principles
- Pointer moves: `layoutId` on Framer Motion elements for smooth positional transitions
- Value changes: CSS keyframe flash (amber background, 300ms fade)
- New elements appearing: `initial={{ opacity:0, scale:0.8 }}` → `animate={{ opacity:1, scale:1 }}`
- Transitions: `{ type: "spring", stiffness: 300, damping: 30 }` for snappy feel

---

## VISUALIZATION 1 — ARRAYS (`ArrayDiagram.tsx`)

### Visual Structure
```
        ▲                     ▲
        L                     R
  ┌───┬───┬───┬───┬───┬───┬───┐
  │ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │ 4 │
  └───┴───┴───┴───┴───┴───┴───┘
   [0] [1] [2] [3] [4] [5] [6]

  window_sum: 7   max_sum: 9
```

### Props Interface
```typescript
interface ArrayDiagramProps {
  cells: number[]
  diagramState: {
    left?: number          // index of left pointer (-1 = hidden)
    right?: number         // index of right pointer (-1 = hidden)
    windowStart?: number   // window highlight start
    windowEnd?: number     // window highlight end
    highlighted?: number[] // cells to highlight amber
    comparing?: [number, number] // two cells being compared
  }
  cellWidth?: number       // default 64
  showIndices?: boolean    // default true
}
```

### SVG Layout (per cell)
- Cell rect: 64×64px, rx=8, stroke 1px
- In window: fill rgba(212,96,58,0.08), stroke #D4603A, stroke-width 1.5
- Highlighted: fill rgba(202,138,4,0.2), animate flash
- Cell value: DM Mono 20px, centered
- Index label: DM Mono 11px, muted, below cell
- Left pointer (▲): green, position x=cell[left].cx, y=cell.top-24
- Right pointer (▲): orange, position x=cell[right].cx, y=cell.top-24
- Pointer letter: "L" / "R" above the ▲, 12px DM Mono

### Framer Motion Specifics
```tsx
// Pointer movement — smooth slide
<motion.g
  layoutId="left-pointer"
  animate={{ x: leftX }}
  transition={{ type: "spring", stiffness: 400, damping: 35 }}
>
  {/* triangle + "L" label */}
</motion.g>

// Cell highlight flash
<motion.rect
  animate={{ fill: isHighlighted ? "#FDE68A" : defaultFill }}
  transition={{ duration: 0.3 }}
/>
```

### Constraint Gauge (sub-component, shown alongside)
```
  constraint_sum
  ┌──────────────────────┐
  │▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░│  curr: 7 / max: 10
  └──────────────────────┘
   fill: green → amber → red based on ratio
```
- SVG rect, fill width = (constraintValue / constraintMax) * totalWidth
- Color: ratio < 0.7 → #16A34A, 0.7-0.9 → #CA8A04, > 0.9 → #DC2626
- Framer Motion `animate={{ width: fillWidth, fill: fillColor }}`

---

## VISUALIZATION 2 — VECTORS (`VectorDiagram.tsx`)

### Visual Structure
```
  size=3, capacity=8

  ┌───┬───┬───┬░░░┬░░░┬░░░┬░░░┬░░░┐
  │ A │ B │ C │   │   │   │   │   │
  └───┴───┴───┴───┴───┴───┴───┴───┘
       ↑size=3          ↑capacity=8

  [ Append 'D' → fills slot 3 ]
  [ When full → DOUBLE CAPACITY animation ]
```

### Doubling Animation (key unique feature)
When `step.action === "resize"`:
1. Old cells: `animate={{ x: newPosition }}` slide to the left half
2. New empty cells: `animate={{ opacity: [0, 1] }}` appear on the right
3. Capacity label updates with a scale bounce

### Props
```typescript
interface VectorDiagramProps {
  cells: (string | number | null)[]
  size: number
  capacity: number
  action?: "append" | "resize" | "delete" | null
}
```

---

## VISUALIZATION 3 — STRINGS (`StringDiagram.tsx`)

### Visual Structure
```
  s = "a b c b a b"
  ┌─┬─┬─┬─┬─┬─┬─┬─┐
  │a│b│c│b│a│b│c│b│   ← character boxes
  └─┴─┴─┴─┴─┴─┴─┴─┘
   L           R       ← sliding window pointers

  Frequency Chart:
  a: ██  (2)
  b: ████ (4)
  c: ██  (2)
```

### Frequency Bar Chart (SVG, below the string)
- One bar per unique character in window
- Bar height proportional to frequency
- Bar color: coral for characters at max allowed count, amber otherwise
- Animates as window slides

---

## VISUALIZATION 4 — LINKED LISTS (`LinkedListDiagram.tsx`)

### Visual Structure
```
  curr    next
   ↓       ↓
  [3] ──▶ [7] ──▶ [2] ──▶ [NULL]
   prev↗
```

### Node Design
- Oval/rounded rect nodes (width 60px, height 40px)
- Node value centered in DM Mono 16px
- Arrow between nodes: curved SVG path with arrowhead
- `prev` pointer shown as dashed line below nodes
- `fast` pointer: coral colored arrow
- `slow` pointer: teal colored arrow

### Reversal Animation
When reversing: arrows animate from pointing right to pointing left using SVG path morphing via Framer Motion.

### Cycle Detection Visualization
When cycle detected: the connecting arrow curves back in an arc, nodes in cycle have teal background ring.

---

## VISUALIZATION 5 — STACKS (`StackDiagram.tsx`)

### Visual Structure
```
  ┌─────────┐  ← top
  │    3    │  push animation: slides in from above
  ├─────────┤
  │    7    │
  ├─────────┤
  │    1    │  pop animation: slides out upward
  └─────────┘
  stack size: 3
```

### Monotonic Stack Mode
When visualizing monotonic stack:
- Elements that will be POPPED: colored red with a slight transparency
- Elements that remain: normal amber
- Pop animation shows elements flying out and the reason labeled: "nums[4]=8 > nums[2]=3, POP"

---

## VISUALIZATION 6 — QUEUES (`QueueDiagram.tsx`)

### Visual Structure
```
  ENQUEUE →  [4][2][7][1][5]  → DEQUEUE
              front ↑    ↑ back
```

### Deque Mode
Shows arrows on both ends. Elements entering from both sides with different colors.

---

## VISUALIZATION 7 — HASH MAPS (`HashMapDiagram.tsx`)

### Visual Structure
```
  Key: "apple"
      │
      ▼
  ┌──────────────┐
  │  hash(key)   │  → 3
  │  % buckets   │
  └──────────────┘
      │
      ▼
  Bucket Array:
  [0] ───
  [1] ───
  [2] ───
  [3] ──▶ [apple: 5] ──▶ [NULL]
  [4] ───
```

### Animation
- Key text appears at top
- Dashed line traces through hash function box
- Arrow lands on the correct bucket
- If collision: new node appended to chain with animation

---

## VISUALIZATION 8 — BINARY TREES (`TreeDiagram.tsx`)

### Visual Structure
```
              [1]
             /   \
           [2]   [3]
           / \     \
         [4] [5]   [6]

  Current: node [2] (coral)
  Visited: nodes [1] (teal tint)
  Recursion Stack: [1, 2]
```

### Layout Algorithm
- Auto-layout using level-based positioning
- Node x = (level_width / (nodes_at_level + 1)) * (node_index + 1)
- Node y = level * (node_height + vertical_gap)
- Edge: curved SVG path between parent and child center points

### Traversal Mode
Shows traversal sequence as a row of node values appearing at bottom as nodes are visited.

### Side Panel: Recursion Stack
Shows call stack as small boxes to the right of the tree.

---

## VISUALIZATION 9 — HEAPS (`HeapDiagram.tsx`)

### Dual View (unique to heaps)
```
  TREE VIEW              ARRAY VIEW
       [1]               [1,3,2,5,4,7,6]
      /    \              ↑
    [3]    [2]            heap[0] = root
    / \    / \
  [5] [4] [7] [6]

  Arrow connects selected tree node ↔ array cell
```

### Heapify Animation
When pushing an element:
1. New element appears at end of array (bottom of tree)
2. Compare with parent (amber highlight both)
3. If violation: swap with animation (elements cross-swap in both views simultaneously)
4. Repeat until heap property restored

---

## VISUALIZATION 10 — GRAPHS (`GraphDiagram.tsx`)

### Force-Directed Layout
- Nodes: circles with value label
- Edges: lines between circles
- Positions: calculated with simple spring algorithm or hardcoded for small graphs
- For BFS: nodes colored by BFS distance (gradient from coral at source to light amber at farthest)
- For DFS: nodes show discovery/finish time labels
- Visited nodes: fill changes from white to teal-tinted with animation

### BFS Frontier Visualization
- Current node: coral fill
- Frontier (in queue): amber ring around node
- Visited: teal fill
- Unvisited: white/default

---

## VISUALIZATION 11 — SLIDING WINDOW (`SlidingWindowDiagram.tsx`)
*(Already specified in Visualization 1 — same component with ConstraintGauge always visible)*

Key additions specific to this chapter:
- "Explain step" text updates below the gauge: "window_sum (9) > k (7) → SHRINK LEFT"
- Arrow annotations showing which element was added and which was removed
- Color transition when window becomes invalid: border flashes red, then shrinks

---

## VISUALIZATION 12 — DYNAMIC PROGRAMMING (`DPDiagram.tsx`)

### 1D DP (e.g., Climbing Stairs, House Robber)
```
  dp: [0, 1, 2, 3, 5, 8, 13 ...]
       ↑current
  Arrows from dp[i-1] and dp[i-2] pointing to dp[i]
```

### 2D DP (e.g., LCS, Edit Distance)
```
       ""  A  C  E
  ""  [ 0  0  0  0 ]
  A   [ 0  1  1  1 ]   ← current row being filled
  B   [ 0  1  1  1 ]
  C   [ 0  1  2  2 ]   ← current cell (coral)
                  ↑ depends on these cells (amber)
```
- Current cell fills coral with animation
- Dependency cells highlighted amber
- Formula shown above table: `dp[i][j] = dp[i-1][j-1] + 1 if match, else max(...)`

---

## VISUALIZATION 13 — BACKTRACKING (`BacktrackingDiagram.tsx`)

### Decision Tree
```
              [ ]
           /   |   \
         [1]  [2]  [3]
        /   \       \
      [1,2] [1,3]  [3,1]   ← leaves = complete solutions
               ✕             ✗ = pruned branch
```
- Tree grows downward as stepper advances
- Current node: coral, with pulsing ring
- Pruned node: red background, ✕ mark, grayed out subtree
- Solution node: teal background, ✓ mark
- Current path highlighted with thick coral edges

---

## VISUALIZATION 14 — TWO POINTERS (`TwoPointersDiagram.tsx`)

### Converging Pointer Mode
```
  target = 9
  ← R                              L →
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
   ↑L                            ↑R

  sum = arr[L] + arr[R] = 11 > target → move R left
```

### Same-Direction (Fast/Slow) Mode
```
  slow →   fast →→
  [1, 3, 2, 4, 5, 6, 7, null]
   ↑slow      ↑fast
```

---

## STEP DATA FORMAT (Universal)

Every step in every topic's JSON must follow this exact format:

```typescript
{
  stepIndex: number,              // 0-indexed
  
  diagramState: {
    // ArrayDiagram / SlidingWindow
    left?: number,
    right?: number,
    windowStart?: number,
    windowEnd?: number,
    highlighted?: number[],
    comparing?: [number, number],
    
    // TreeDiagram
    currentNode?: string,         // node id
    visitedNodes?: string[],
    callStack?: string[],
    
    // GraphDiagram
    visitedNodes?: string[],
    frontier?: string[],
    currentNode?: string,
    
    // DPDiagram
    currentCell?: [number, number],   // [row, col]
    filledCells?: [number, number][],
    dpValues?: number[][],            // current table state
    
    // StackDiagram
    stackContents?: number[],
    recentAction?: "push" | "pop",
    
    // Generic
    action?: string,              // "push" | "pop" | "enqueue" | "resize" | etc.
  },
  
  variables: {
    [key: string]: string | number    // shown in VariableStatePanel
  },
  
  constraintValue?: number,       // for gauge
  constraintMax?: number,
  explanation: string,            // one sentence, shown below diagram
  activeLine: number,             // 0-indexed line in code block
}
```

---

## VARIABLE STATE PANEL SPEC (`VariableStatePanel.tsx`)

### Layout
```
  ┌─────────────────────────────────────┐
  │  left    │  right   │  sum    │ max │
  │    2     │    5     │    8    │  9  │
  │  (green) │ (orange) │         │     │
  └─────────────────────────────────────┘
```
- Grid: 2-4 columns depending on number of variables
- Variable name: DM Mono 11px, TEXT_MUTED
- Variable value: DM Mono 22px bold, TEXT_PRIMARY
- Special color overrides: "left" variable value always green, "right" always orange
- Changed value: amber background flash, 400ms CSS transition
- `usePrevious` hook detects changes between steps

---

## CONSTRAINT GAUGE SPEC (`ConstraintGauge.tsx`)

### SVG Structure
```
  window_sum vs max_k

  ┌─────────────────────────────────┐
  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░│
  └─────────────────────────────────┘
   curr: 7                 max: 10
```
- Outer rect: 300×24px, rx=12, border 1px BORDER
- Fill rect: width animates via Framer Motion to (curr/max * 300)px
- Fill color: animate via Framer Motion based on ratio
  - < 70%: #16A34A (green)
  - 70-90%: #CA8A04 (amber)
  - > 90%: #DC2626 (red)
  - > 100% (violated): border flashes, fill overflows with red pulse animation
- Labels: curr value left, max value right, DM Mono 12px
- Violation label: "CONSTRAINT VIOLATED → SHRINK" appears in red below gauge

---

## CODE TABS SPEC (`CodeTabs.tsx`)

### Tab Order: Python | JavaScript | Java | C++

### Line Highlighting
- Server-side: Shiki renders with `data-line="N"` on each `<span>`
- Client-side: CSS targets `.line-${activeLine} { background: rgba(212,96,58,0.1); border-left: 2px solid #D4603A; }`
- Active line scrolls into view: `element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`

---

## RESPONSIVE BEHAVIOR FOR ALL VISUALIZERS

### Desktop (> 1024px)
- Diagram: left column (60% width)
- Variable panel: right column (40% width)
- Code: below both, full width

### Mobile (< 768px)
- Diagram: full width, scrollable if cells overflow
- Variable panel: below diagram, 2-column grid
- Constraint gauge: below variable panel
- Code: below gauge, horizontal scroll on overflow
- Slider: full width, touch-friendly (44px thumb)

---

## COMPLETE COMPONENT FILE LIST FOR VISUALIZERS

```
components/
  diagrams/
    ArrayDiagram.tsx          ← arrays, sliding window, two pointers, binary search
    VectorDiagram.tsx         ← vectors / dynamic arrays
    StringDiagram.tsx         ← strings (with frequency bar chart)
    LinkedListDiagram.tsx     ← linked lists
    StackDiagram.tsx          ← stacks (with monotonic mode)
    QueueDiagram.tsx          ← queues (with deque mode)
    HashMapDiagram.tsx        ← hash maps / hash sets
    TreeDiagram.tsx           ← binary trees, BST
    HeapDiagram.tsx           ← heaps (dual tree+array view)
    GraphDiagram.tsx          ← graphs (BFS/DFS colored)
    DPDiagram.tsx             ← dynamic programming (1D and 2D)
    BacktrackingDiagram.tsx   ← backtracking (decision tree)
    DiagramRouter.tsx         ← reads diagramType from JSON, renders correct component

  topic/
    StepperBlock.tsx          ← orchestrator: slider + DiagramRouter + VariableStatePanel + CodeTabs
    VariableStatePanel.tsx    ← the variable grid with flash animations
    ConstraintGauge.tsx       ← the fuel gauge SVG widget
    CodeTabs.tsx              ← Python/JS/Java/C++ with line highlighting
```
