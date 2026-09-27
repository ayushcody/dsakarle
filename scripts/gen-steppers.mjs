// Regenerates `stepper` (and mental-model diagrams) for topics by simulating the real algorithm.
// Run: node scripts/gen-steppers.mjs
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'content', 'topics');

function recorder() {
  const steps = [];
  const add = (activeLine, diagramState, variables, explanation) =>
    steps.push({ stepIndex: steps.length, diagramState: structuredClone(diagramState), variables: { ...variables }, explanation, activeLine });
  return { steps, add };
}

const py = (lines) => lines.join('\n');

// ---------- Array family ----------

function arraysLinear() {
  const arr = [10, 20, 30, 40, 50];
  const target = 30;
  const { steps, add } = recorder();
  add(1, {}, { target }, `Search for ${target}. An array lets us read any index directly, so we simply walk left to right.`);
  for (let i = 0; i < arr.length; i++) {
    add(2, { comparing: [i], left: i }, { i, 'arr[i]': arr[i], target }, `Read arr[${i}] in O(1) — the address is start + ${i} × size. Value is ${arr[i]}.`);
    if (arr[i] === target) {
      add(4, { highlighted: [i], left: i }, { i, found: 'yes' }, `arr[${i}] == ${target}. Found it after ${i + 1} reads.`);
      break;
    }
    add(3, { left: i }, { i, 'arr[i]': arr[i] }, `${arr[i]} ≠ ${target}, move to the next index.`);
  }
  return {
    diagramType: 'ArrayDiagram',
    array: arr,
    code: { python: py(['def find(arr, target):', '    for i in range(len(arr)):', '        if arr[i] != target: continue', '        return i', '    return -1']) },
    steps,
  };
}

function vectorsPush() {
  const { steps, add } = recorder();
  let cap = 2;
  let data = [];
  const view = () => [...data, ...Array(cap - data.length).fill('·')];
  add(1, { cells: view() }, { size: 0, capacity: cap }, 'Start with an empty vector of capacity 2. Empty slots are shown as ·.');
  for (const x of [4, 8, 15, 16, 23]) {
    if (data.length === cap) {
      add(3, { cells: view(), highlighted: data.map((_, i) => i) }, { size: data.length, capacity: cap }, `Full! Pushing ${x} needs room, so allocate a new block of capacity ${cap * 2}.`);
      cap *= 2;
      add(4, { cells: view(), comparing: data.map((_, i) => i) }, { size: data.length, capacity: cap }, `Copy all ${data.length} elements into the bigger block. This O(n) copy is rare, so push stays O(1) amortized.`);
    }
    data.push(x);
    add(5, { cells: view(), highlighted: [data.length - 1] }, { size: data.length, capacity: cap, pushed: x }, `Write ${x} into slot ${data.length - 1}. Size is now ${data.length}.`);
  }
  return {
    diagramType: 'ArrayDiagram',
    array: view(),
    code: { python: py(['def push(v, x):', '    if v.size == v.capacity:', '        new = [None] * (2 * v.capacity)  # grow', '        copy(v.data, new); v.data = new', '    v.data[v.size] = x; v.size += 1']) },
    steps,
  };
}

function stringsPalindrome() {
  const s = 'racecar'.split('');
  const { steps, add } = recorder();
  let l = 0;
  let r = s.length - 1;
  add(1, { left: l, right: r }, { l, r }, 'A string is an array of characters. Put one pointer at each end.');
  while (l < r) {
    add(3, { left: l, right: r, comparing: [l, r] }, { l, r, 's[l]': s[l], 's[r]': s[r] }, `Compare '${s[l]}' and '${s[r]}'. They match.`);
    l++;
    r--;
    add(5, { left: l, right: r }, { l, r }, 'Move both pointers inward.');
  }
  add(6, { highlighted: s.map((_, i) => i) }, { result: 'True' }, 'Pointers met without a mismatch, so "racecar" is a palindrome.');
  return {
    diagramType: 'ArrayDiagram',
    array: s,
    code: { python: py(['def is_palindrome(s):', '    l, r = 0, len(s) - 1', '    while l < r:', '        if s[l] != s[r]: return False', '        l += 1; r -= 1', '    return True']) },
    steps,
  };
}

function binarySearch() {
  const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  const target = 23;
  const { steps, add } = recorder();
  let lo = 0;
  let hi = arr.length - 1;
  add(2, { left: lo, right: hi, windowStart: lo, windowEnd: hi }, { lo, hi, target }, `Search for ${target}. The whole sorted array is the search space.`);
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    add(4, { left: lo, right: hi, windowStart: lo, windowEnd: hi, comparing: [mid] }, { lo, hi, mid, 'arr[mid]': arr[mid] }, `mid = (${lo} + ${hi}) // 2 = ${mid}. arr[mid] = ${arr[mid]}.`);
    if (arr[mid] === target) {
      add(5, { highlighted: [mid] }, { mid, found: 'yes' }, `arr[${mid}] == ${target}. Found in ${steps.filter((s) => s.activeLine === 4).length} comparisons instead of up to 10.`);
      break;
    }
    if (arr[mid] < target) {
      lo = mid + 1;
      add(6, { left: lo, right: hi, windowStart: lo, windowEnd: hi }, { lo, hi }, `${arr[mid]} < ${target}: everything left of mid is too small. Discard it: lo = ${lo}.`);
    } else {
      hi = mid - 1;
      add(7, { left: lo, right: hi, windowStart: lo, windowEnd: hi }, { lo, hi }, `${arr[mid]} > ${target}: everything right of mid is too big. Discard it: hi = ${hi}.`);
    }
  }
  return {
    diagramType: 'ArrayDiagram',
    array: arr,
    code: { python: py(['def binary_search(arr, target):', '    lo, hi = 0, len(arr) - 1', '    while lo <= hi:', '        mid = (lo + hi) // 2', '        if arr[mid] == target: return mid', '        if arr[mid] < target: lo = mid + 1', '        else: hi = mid - 1', '    return -1']) },
    steps,
  };
}

function searchingLinear() {
  const arr = [7, 14, 21, 28, 35];
  const target = 28;
  const { steps, add } = recorder();
  add(1, {}, { target }, `Linear search checks every element until it finds ${target}. Works on unsorted data too.`);
  for (let i = 0; i < arr.length; i++) {
    add(3, { comparing: [i], left: i }, { i, 'arr[i]': arr[i] }, `Is arr[${i}] = ${arr[i]} equal to ${target}? ${arr[i] === target ? 'Yes!' : 'No.'}`);
    if (arr[i] === target) {
      add(4, { highlighted: [i] }, { i, found: 'yes' }, `Return ${i}. Worst case would have checked all ${arr.length} elements: O(n).`);
      break;
    }
  }
  return {
    diagramType: 'ArrayDiagram',
    array: arr,
    code: { python: py(['def linear_search(arr, target):', '    for i in range(len(arr)):', '        if arr[i] == target:', '            return i', '    return -1']) },
    steps,
  };
}

function bubbleSort() {
  const a = [5, 1, 4, 2, 8];
  const { steps, add } = recorder();
  const sorted = [];
  add(1, { cells: [...a] }, {}, 'Bubble sort: repeatedly swap adjacent out-of-order pairs. The biggest value bubbles to the end each pass.');
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      const swap = a[j] > a[j + 1];
      add(4, { cells: [...a], comparing: [j, j + 1], highlighted: [...sorted] }, { pass: i + 1, j, 'a[j]': a[j], 'a[j+1]': a[j + 1] }, `Compare ${a[j]} and ${a[j + 1]}. ${swap ? 'Out of order → swap.' : 'Already in order.'}`);
      if (swap) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        add(5, { cells: [...a], comparing: [j, j + 1], highlighted: [...sorted] }, { pass: i + 1, j }, `Swapped: now ${a[j]}, ${a[j + 1]}.`);
      }
    }
    sorted.push(a.length - 1 - i);
    add(2, { cells: [...a], highlighted: [...sorted] }, { pass: i + 1 }, `End of pass ${i + 1}: ${a[a.length - 1 - i]} is locked in its final spot.`);
  }
  add(6, { cells: [...a], highlighted: a.map((_, i) => i) }, { result: a.join(',') }, 'Sorted! Two nested loops make this O(n²).');
  return {
    diagramType: 'ArrayDiagram',
    array: [5, 1, 4, 2, 8],
    code: { python: py(['def bubble_sort(a):', '    for i in range(len(a) - 1):', '        for j in range(len(a) - 1 - i):', '            if a[j] > a[j + 1]:', '                a[j], a[j + 1] = a[j + 1], a[j]', '    return a']) },
    steps,
  };
}

function prefixSum() {
  const a = [3, 1, 4, 1, 5, 9];
  const pre = [0];
  const { steps, add } = recorder();
  add(2, { cells: [...a] }, {}, 'Build prefix[i] = sum of the first i numbers. prefix[0] = 0.');
  for (let i = 0; i < a.length; i++) {
    pre.push(pre[i] + a[i]);
    add(4, { cells: [...a], windowStart: 0, windowEnd: i, highlighted: [i] }, { i, 'a[i]': a[i], [`prefix[${i + 1}]`]: pre[i + 1] }, `prefix[${i + 1}] = prefix[${i}] + a[${i}] = ${pre[i]} + ${a[i]} = ${pre[i + 1]}.`);
  }
  const l = 2;
  const r = 4;
  add(6, { cells: [...a], windowStart: l, windowEnd: r, highlighted: [l, r] }, { l, r, prefix: pre.join(',') }, `Query sum(a[${l}..${r}]) = prefix[${r + 1}] − prefix[${l}] = ${pre[r + 1]} − ${pre[l]} = ${pre[r + 1] - pre[l]}. One subtraction, O(1).`);
  return {
    diagramType: 'ArrayDiagram',
    array: a,
    code: { python: py(['def build(a):', '    prefix = [0]', '    for x in a:', '        prefix.append(prefix[-1] + x)', '    return prefix', 'def range_sum(prefix, l, r): return prefix[r + 1] - prefix[l]']) },
    steps,
  };
}

function greedyCoins() {
  const coins = [25, 10, 5, 1];
  let amount = 63;
  const { steps, add } = recorder();
  const used = [];
  add(1, { cells: coins }, { amount }, `Make ${amount}¢ with the fewest coins. Greedy rule: always take the biggest coin that fits.`);
  for (let i = 0; i < coins.length; i++) {
    while (amount >= coins[i]) {
      amount -= coins[i];
      used.push(coins[i]);
      add(4, { cells: coins, highlighted: [i], aux: [{ label: 'used', items: [...used] }] }, { coin: coins[i], remaining: amount }, `${coins[i]}¢ fits. Take it; ${amount}¢ left.`);
    }
    if (amount > 0) add(3, { cells: coins, comparing: [i], aux: [{ label: 'used', items: [...used] }] }, { coin: coins[i], remaining: amount }, `${coins[i]}¢ no longer fits into ${amount}¢. Move to the next smaller coin.`);
  }
  add(6, { cells: coins, aux: [{ label: 'used', items: [...used] }] }, { coins: used.length }, `Done with ${used.length} coins. Greedy is optimal here because US coin values are "canonical".`);
  return {
    diagramType: 'ArrayDiagram',
    array: coins,
    code: { python: py(['def min_coins(coins, amount):', '    used = []', '    for c in coins:            # largest first', '        while amount >= c:', '            amount -= c; used.append(c)', '    return used']) },
    steps,
  };
}

function queueOps() {
  const { steps, add } = recorder();
  const q = [];
  const snap = () => ({ cells: q.length ? [...q] : ['·'], left: q.length ? 0 : -1, right: q.length ? q.length - 1 : -1 });
  add(1, snap(), { size: 0 }, 'A queue is first-in, first-out, like a line at a ticket counter. L marks the front, R the back.');
  const ops = [['enq', 'A'], ['enq', 'B'], ['enq', 'C'], ['deq'], ['enq', 'D'], ['deq']];
  for (const [op, v] of ops) {
    if (op === 'enq') {
      q.push(v);
      add(2, { ...snap(), highlighted: [q.length - 1] }, { size: q.length, enqueued: v }, `enqueue(${v}): join at the back.`);
    } else {
      const out = q.shift();
      add(3, snap(), { size: q.length, dequeued: out }, `dequeue(): ${out} was first in, so it leaves first.`);
    }
  }
  return {
    diagramType: 'ArrayDiagram',
    array: ['·'],
    code: { python: py(['q = deque()', 'q.append(x)      # enqueue at back', 'q.popleft()      # dequeue from front']) },
    steps,
  };
}

// ---------- Stack family ----------

function stackParens() {
  const s = '({[]})';
  const stack = [];
  const { steps, add } = recorder();
  const pairs = { ')': '(', ']': '[', '}': '{' };
  add(1, { stack: [] }, { input: s }, `Check if "${s}" is balanced. Openers go on the stack; each closer must match the top.`);
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (!pairs[c]) {
      stack.push(c);
      add(4, { stack: [...stack] }, { i, char: c }, `'${c}' is an opener → push. Top is now '${c}'.`);
    } else {
      add(6, { stack: [...stack] }, { i, char: c, top: stack.at(-1) }, `'${c}' is a closer. Top is '${stack.at(-1)}', its match → pop.`);
      stack.pop();
      add(7, { stack: [...stack] }, { i, char: c }, 'Popped. The most recent opener is resolved first — that is LIFO.');
    }
  }
  add(8, { stack: [] }, { result: 'True' }, 'Stack is empty at the end, so every bracket was matched.');
  return {
    diagramType: 'StackDiagram',
    code: { python: py(['def is_valid(s):', '    stack = []', '    for c in s:', '        if c in "([{": stack.append(c)', '        else:', '            if not stack or stack[-1] != match[c]: return False', '            stack.pop()', '    return not stack']) },
    steps,
  };
}

function recursionFactorial() {
  const { steps, add } = recorder();
  const stack = [];
  add(1, { stack: [] }, {}, 'Call factorial(4). Each call waits on a smaller call, and each waiting call is a frame on the call stack.');
  for (let n = 4; n >= 1; n--) {
    stack.push(`fact(${n})`);
    add(n === 1 ? 2 : 3, { stack: [...stack] }, { n }, n === 1 ? 'n == 1 is the base case: return 1 without recursing.' : `fact(${n}) needs fact(${n - 1}) first. Push a new frame.`);
  }
  let acc = 1;
  for (let n = 1; n <= 4; n++) {
    acc *= n;
    stack.pop();
    add(3, { stack: [...stack] }, { n, returns: acc }, `fact(${n}) returns ${acc}. Its frame is popped and the caller resumes.`);
  }
  return {
    diagramType: 'StackDiagram',
    code: { python: py(['def fact(n):', '    if n == 1: return 1', '    return n * fact(n - 1)']) },
    steps,
  };
}

// ---------- Linked list ----------

function linkedReverse() {
  const vals = [1, 2, 3, 4];
  const { steps, add } = recorder();
  const nodes = vals.map((v, i) => ({ id: `n${i}`, value: v }));
  add(2, { nodes, current: 0 }, { prev: 'None', curr: 1 }, 'Reverse the list in place. prev starts at None, curr at the head.');
  const done = [];
  for (let i = 0; i < vals.length; i++) {
    add(4, { nodes, current: i }, { curr: vals[i], next: vals[i + 1] ?? 'None' }, `Save next = ${vals[i + 1] ?? 'None'} before we lose it.`);
    done.unshift(vals[i]);
    add(5, { nodes, current: i, reversing: true }, { curr: vals[i], 'curr.next': done[1] ?? 'None' }, `Point ${vals[i]}.next back to ${done[1] ?? 'None'}. Reversed so far: ${done.join(' → ')}.`);
  }
  add(7, { nodes: done.map((v, i) => ({ id: `r${i}`, value: v })), current: 0 }, { head: done[0] }, `prev is the new head: ${done.join(' → ')} → None. O(n) time, O(1) space.`);
  return {
    diagramType: 'LinkedListDiagram',
    code: { python: py(['def reverse(head):', '    prev, curr = None, head', '    while curr:', '        nxt = curr.next', '        curr.next = prev', '        prev, curr = curr, nxt', '    return prev']) },
    steps,
  };
}

// ---------- Hash map ----------

function hashMapInsert() {
  const size = 5;
  const buckets = Array.from({ length: size }, () => []);
  const { steps, add } = recorder();
  const h = (k) => [...k].reduce((a, c) => a + c.charCodeAt(0), 0) % size;
  add(1, { buckets }, { buckets: size }, 'A hash map turns a key into a bucket index. Start with 5 empty buckets.');
  for (const [k, v] of [['cat', 3], ['dog', 7], ['emu', 1], ['tac', 9]]) {
    const i = h(k);
    add(2, { buckets, active: i }, { key: k, 'hash(key) % 5': i }, `hash("${k}") % 5 = ${i}. Jump straight to bucket ${i}.`);
    const collide = buckets[i].length > 0;
    buckets[i].push(`${k}:${v}`);
    add(3, { buckets, active: i, hit: k }, { key: k, value: v }, collide ? `Bucket ${i} is already taken — a collision. Chain "${k}" onto the same bucket.` : `Store "${k}: ${v}" in bucket ${i}.`);
  }
  const i = h('dog');
  add(5, { buckets, active: i, hit: 'dog' }, { lookup: 'dog', result: 7 }, `Lookup "dog": hash to bucket ${i}, scan its short chain → 7. Average O(1).`);
  return {
    diagramType: 'hash-map',
    code: { python: py(['def put(table, key, val):', '    i = hash(key) % len(table)', '    table[i].append((key, val))   # chain on collision', 'def get(table, key):', '    for k, v in table[hash(key) % len(table)]:', '        if k == key: return v']) },
    steps,
  };
}

// ---------- Trees ----------

function treeBfs() {
  const cells = [1, 2, 3, 4, 5, 6, 7];
  const { steps, add } = recorder();
  const st = {};
  const queue = [0];
  const out = [];
  add(2, { nodeStates: {}, aux: [{ label: 'queue', items: [1] }, { label: 'output', items: [] }] }, {}, 'Level-order (BFS) traversal: a queue holds nodes waiting to be visited. Start with the root.');
  while (queue.length) {
    const i = queue.shift();
    st[i] = 'active';
    out.push(cells[i]);
    const kids = [2 * i + 1, 2 * i + 2].filter((k) => k < cells.length);
    queue.push(...kids);
    add(4, { nodeStates: { ...st }, aux: [{ label: 'queue', items: queue.map((q) => cells[q]) }, { label: 'output', items: [...out] }] }, { node: cells[i] }, `Dequeue ${cells[i]} and visit it.${kids.length ? ` Enqueue its children ${kids.map((k) => cells[k]).join(', ')}.` : ' It is a leaf.'}`);
    st[i] = 'visited';
  }
  add(6, { nodeStates: { ...st }, aux: [{ label: 'output', items: out }] }, { order: out.join(' ') }, 'Queue empty. Nodes came out level by level: that is why BFS uses a queue.');
  return {
    diagramType: 'tree',
    array: cells,
    code: { python: py(['def level_order(root):', '    q = deque([root])', '    while q:', '        node = q.popleft(); visit(node)', '        if node.left: q.append(node.left)', '        if node.right: q.append(node.right)']) },
    steps,
  };
}

function bstSearch() {
  const cells = [10, 5, 15, 2, 7, 12, 20];
  const target = 12;
  const { steps, add } = recorder();
  const st = {};
  let i = 0;
  add(1, {}, { target }, `Search the BST for ${target}. Smaller values live left, larger values live right.`);
  while (i < cells.length) {
    st[i] = 'active';
    add(2, { nodeStates: { ...st } }, { node: cells[i], target }, `At ${cells[i]}.`);
    if (cells[i] === target) {
      st[i] = 'success';
      add(3, { nodeStates: { ...st } }, { found: 'yes' }, `Found ${target}. We checked one node per level: O(h).`);
      break;
    }
    st[i] = 'visited';
    const goLeft = target < cells[i];
    add(goLeft ? 4 : 5, { nodeStates: { ...st } }, { node: cells[i] }, `${target} ${goLeft ? '<' : '>'} ${cells[i]} → go ${goLeft ? 'left' : 'right'} and ignore the whole other subtree.`);
    i = goLeft ? 2 * i + 1 : 2 * i + 2;
  }
  return {
    diagramType: 'tree',
    array: cells,
    code: { python: py(['def search(node, target):', '    while node:', '        if node.val == target: return node', '        if target < node.val: node = node.left', '        else: node = node.right', '    return None']) },
    steps,
  };
}

function heapInsert() {
  const h = [10, 8, 7, 4, 5, 2];
  const { steps, add } = recorder();
  add(1, { cells: [...h] }, { size: h.length }, 'Max-heap: every parent ≥ its children. Stored as an array in level order.');
  h.push(9);
  let i = h.length - 1;
  add(2, { cells: [...h], nodeStates: { [i]: 'active' } }, { inserted: 9, i }, 'Insert 9 at the next free spot (end of the array).');
  while (i > 0) {
    const p = (i - 1) >> 1;
    add(4, { cells: [...h], nodeStates: { [i]: 'active', [p]: 'compare' } }, { i, parent: p, 'h[i]': h[i], 'h[p]': h[p] }, `Compare with parent ${h[p]} at index ${p} = (${i}−1)//2.`);
    if (h[p] >= h[i]) {
      add(5, { cells: [...h], nodeStates: { [i]: 'success' } }, { i }, `${h[p]} ≥ ${h[i]}: heap property holds. Stop.`);
      break;
    }
    [h[p], h[i]] = [h[i], h[p]];
    add(6, { cells: [...h], nodeStates: { [p]: 'active' } }, { i: p }, `Parent is smaller → swap. 9 sifts up to index ${p}.`);
    i = p;
  }
  return {
    diagramType: 'tree',
    array: [10, 8, 7, 4, 5, 2],
    code: { python: py(['def push(h, x):', '    h.append(x); i = len(h) - 1', '    while i > 0:', '        p = (i - 1) // 2', '        if h[p] >= h[i]: break', '        h[p], h[i] = h[i], h[p]; i = p']) },
    steps,
  };
}

function trieInsert() {
  const { steps, add } = recorder();
  const nodes = [{ id: 'root', label: '•' }];
  const has = (id) => nodes.some((n) => n.id === id);
  add(1, { nodes: [...nodes] }, {}, 'A trie stores words character by character. Every path from the root spells a prefix.');
  for (const w of ['car', 'cat', 'do']) {
    let parent = 'root';
    for (let k = 0; k < w.length; k++) {
      const id = w.slice(0, k + 1);
      const fresh = !has(id);
      if (fresh) nodes.push({ id, label: w[k], parent });
      add(fresh ? 4 : 3, { nodes: [...nodes], nodeStates: { [id]: fresh ? 'active' : 'visited' } }, { word: w, char: w[k], prefix: id }, fresh ? `No child '${w[k]}' under "${id.slice(0, -1) || 'root'}" → create it.` : `Child '${w[k]}' already exists (shared prefix "${id}") → just walk down.`);
      parent = id;
    }
    add(5, { nodes: [...nodes], nodeStates: { [w]: 'success' } }, { word: w }, `Mark "${w}" as the end of a word.`);
  }
  return {
    diagramType: 'tree',
    code: { python: py(['def insert(root, word):', '    node = root', '    for ch in word:', '        node = node.children.setdefault(ch, Node())', '    node.is_end = True']) },
    steps,
  };
}

// ---------- Graphs ----------

const G = {
  nodes: [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: -110, y: 90 },
    { id: 'C', x: 110, y: 90 },
    { id: 'D', x: -150, y: 200 },
    { id: 'E', x: 0, y: 200 },
    { id: 'F', x: 150, y: 200 },
  ],
  edges: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'E'], ['C', 'F']],
};
const adj = (u) => G.edges.flatMap(([a, b]) => (a === u ? [b] : b === u ? [a] : [])).sort();

function graphTraverse(kind) {
  const { steps, add } = recorder();
  const st = {};
  const hot = [];
  const seen = new Set(['A']);
  const frontier = ['A'];
  const out = [];
  const label = kind === 'bfs' ? 'queue' : 'stack';
  const base = () => ({ ...G, nodeStates: { ...st }, activeEdges: [...hot], aux: [{ label, items: [...frontier] }, { label: 'visited', items: [...out] }] });
  add(2, base(), {}, kind === 'bfs' ? 'BFS from A: a queue explores the graph in rings of increasing distance.' : 'DFS from A: a stack dives down one path as deep as possible before backing up.');
  while (frontier.length) {
    const u = kind === 'bfs' ? frontier.shift() : frontier.pop();
    st[u] = 'active';
    out.push(u);
    const next = adj(u).filter((v) => !seen.has(v));
    add(4, base(), { node: u }, `${kind === 'bfs' ? 'Dequeue' : 'Pop'} ${u} and visit it.`);
    for (const v of kind === 'bfs' ? next : [...next].reverse()) {
      seen.add(v);
      frontier.push(v);
      hot.push([u, v]);
    }
    if (next.length) add(6, base(), { node: u, added: next.join(',') }, `Unvisited neighbours ${next.join(', ')} → mark seen and ${kind === 'bfs' ? 'enqueue' : 'push'}.`);
    st[u] = 'visited';
  }
  add(3, base(), { order: out.join(' ') }, `Done. Visit order: ${out.join(' → ')}. The highlighted edges form the ${kind.toUpperCase()} tree.`);
  const code =
    kind === 'bfs'
      ? ['def bfs(g, start):', '    q, seen = deque([start]), {start}', '    while q:', '        u = q.popleft(); visit(u)', '        for v in g[u]:', '            if v not in seen: seen.add(v); q.append(v)']
      : ['def dfs(g, start):', '    stack, seen = [start], {start}', '    while stack:', '        u = stack.pop(); visit(u)', '        for v in reversed(g[u]):', '            if v not in seen: seen.add(v); stack.append(v)'];
  return { diagramType: 'graph', code: { python: py(code) }, steps };
}

// ---------- DP & backtracking ----------

function fibDp() {
  const n = 7;
  const memo = Array(n + 1).fill(null);
  const { steps, add } = recorder();
  memo[0] = 0;
  memo[1] = 1;
  add(2, { memo: [...memo], activeIndex: 1, lookups: [0] }, { n }, 'Bottom-up Fibonacci. Seed the table with dp[0] = 0 and dp[1] = 1.');
  for (let i = 2; i <= n; i++) {
    memo[i] = memo[i - 1] + memo[i - 2];
    add(4, { memo: [...memo], activeIndex: i, lookups: [i - 1, i - 2] }, { i, [`dp[${i}]`]: memo[i] }, `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${memo[i - 1]} + ${memo[i - 2]} = ${memo[i]}. Both answers are cached — no recomputation.`);
  }
  add(5, { memo: [...memo], activeIndex: n, lookups: [] }, { answer: memo[n] }, `fib(${n}) = ${memo[n]} in O(n), versus O(2ⁿ) for naive recursion.`);
  return {
    diagramType: 'DPDiagram',
    code: { python: py(['def fib(n):', '    dp = [0, 1] + [0] * (n - 1)', '    for i in range(2, n + 1):', '        dp[i] = dp[i - 1] + dp[i - 2]', '    return dp[n]']) },
    steps,
  };
}

function subsetsBacktrack() {
  const nums = [1, 2, 3];
  const target = 3;
  const { steps, add } = recorder();
  const nodes = [{ id: 'r', label: '{}' }];
  const st = {};
  add(1, { nodes: [...nodes] }, { target }, `Find subsets of [1,2,3] that sum to ${target}. Each branch chooses the next number; bad branches are abandoned.`);
  const go = (start, path, sum, id) => {
    for (let i = start; i < nums.length; i++) {
      const nid = `${id}-${nums[i]}`;
      const s = sum + nums[i];
      nodes.push({ id: nid, label: nums[i], parent: id });
      st[nid] = 'active';
      add(5, { nodes: [...nodes], nodeStates: { ...st } }, { path: [...path, nums[i]].join(','), sum: s }, `Choose ${nums[i]}: path [${[...path, nums[i]]}] sums to ${s}.`);
      if (s === target) {
        st[nid] = 'success';
        add(3, { nodes: [...nodes], nodeStates: { ...st } }, { found: [...path, nums[i]].join(',') }, `Sum is ${target} → record [${[...path, nums[i]]}].`);
      } else if (s > target) {
        st[nid] = 'fail';
        add(4, { nodes: [...nodes], nodeStates: { ...st } }, { sum: s }, `${s} > ${target}: dead end. Backtrack — undo the choice.`);
      } else {
        st[nid] = 'visited';
        go(i + 1, [...path, nums[i]], s, nid);
      }
    }
  };
  go(0, [], 0, 'r');
  return {
    diagramType: 'backtracking',
    code: { python: py(['def solve(start, path, total):', '    for i in range(start, len(nums)):', '        if total + nums[i] == target: record(path + [nums[i]])', '        elif total + nums[i] > target: continue   # prune', '        else: solve(i + 1, path + [nums[i]], total + nums[i])']) },
    steps,
  };
}

// ---------- Apply ----------

const PLAN = {
  arrays: arraysLinear,
  vectors: vectorsPush,
  strings: stringsPalindrome,
  'binary-search': binarySearch,
  searching: searchingLinear,
  sorting: bubbleSort,
  'prefix-sum': prefixSum,
  greedy: greedyCoins,
  queues: queueOps,
  stacks: stackParens,
  recursion: recursionFactorial,
  'linked-lists': linkedReverse,
  'hash-maps': hashMapInsert,
  trees: treeBfs,
  bst: bstSearch,
  heaps: heapInsert,
  tries: trieInsert,
  graphs: () => graphTraverse('dfs'),
  'bfs-dfs': () => graphTraverse('bfs'),
  'dynamic-programming': fibDp,
  backtracking: subsetsBacktrack,
};

for (const [slug, gen] of Object.entries(PLAN)) {
  const file = path.join(DIR, `${slug}.json`);
  const topic = JSON.parse(fs.readFileSync(file, 'utf8'));
  const stepper = gen();
  topic.stepper = { ...stepper, array: stepper.array ?? [] };
  // Mental model shows the most informative frame: mid-walkthrough, or the finished structure for tries.
  const frame = stepper.steps[slug === 'tries' ? stepper.steps.length - 1 : Math.floor(stepper.steps.length / 2)];
  topic.mentalModel = { ...topic.mentalModel, diagramType: stepper.diagramType, cells: topic.stepper.array, diagramState: frame.diagramState };
  fs.writeFileSync(file, JSON.stringify(topic, null, 2) + '\n');
  console.log(`${slug.padEnd(22)} ${stepper.steps.length} steps`);
}
