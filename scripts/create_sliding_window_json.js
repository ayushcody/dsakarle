const fs = require('fs');
const path = require('path');

const array = [2, 1, 5, 1, 3, 2];
const k = 3;
let max_sum = 0;
let window_sum = 0;

const steps = [];
let stepIndex = 0;

steps.push({
  stepIndex: stepIndex++,
  diagramState: { left: 0, right: 0 },
  variables: { window_start: 0, window_end: 0, window_sum: 0, max_sum: 0 },
  explanation: "Initialize variables. We haven't started looking at the array yet.",
  activeLine: 2
});

let window_start = 0;
for (let window_end = 0; window_end < array.length; window_end++) {
  
  steps.push({
    stepIndex: stepIndex++,
    diagramState: { left: window_start, right: window_end, windowStart: window_start, windowEnd: window_end, highlighted: [window_end] },
    variables: { window_start, window_end, window_sum, max_sum },
    explanation: "Expand the window by moving window_end to index " + window_end + ".",
    activeLine: 4
  });

  window_sum += array[window_end];

  steps.push({
    stepIndex: stepIndex++,
    diagramState: { left: window_start, right: window_end, windowStart: window_start, windowEnd: window_end },
    variables: { window_start, window_end, window_sum, max_sum },
    explanation: "Add arr[" + window_end + "] (" + array[window_end] + ") to window_sum. It becomes " + window_sum + ".",
    activeLine: 5
  });

  steps.push({
    stepIndex: stepIndex++,
    diagramState: { left: window_start, right: window_end, windowStart: window_start, windowEnd: window_end },
    variables: { window_start, window_end, window_sum, max_sum },
    constraintValue: window_end - window_start + 1,
    constraintMax: k,
    explanation: "Check if window size (" + (window_end - window_start + 1) + ") has reached k (" + k + ").",
    activeLine: 6
  });

  if (window_end >= k - 1) {
    max_sum = Math.max(max_sum, window_sum);
    steps.push({
      stepIndex: stepIndex++,
      diagramState: { left: window_start, right: window_end, windowStart: window_start, windowEnd: window_end },
      variables: { window_start, window_end, window_sum, max_sum },
      constraintValue: window_end - window_start + 1,
      constraintMax: k,
      explanation: "Window size is " + k + ". Update max_sum to " + max_sum + ".",
      activeLine: 7
    });

    window_sum -= array[window_start];
    steps.push({
      stepIndex: stepIndex++,
      diagramState: { left: window_start, right: window_end, windowStart: window_start, windowEnd: window_end, highlighted: [window_start] },
      variables: { window_start, window_end, window_sum, max_sum },
      constraintValue: window_end - window_start + 1,
      constraintMax: k,
      explanation: "Subtract arr[" + window_start + "] (" + array[window_start] + ") to prepare for sliding the window. window_sum becomes " + window_sum + ".",
      activeLine: 8
    });

    window_start += 1;
    steps.push({
      stepIndex: stepIndex++,
      diagramState: { left: window_start, right: window_end, windowStart: window_start, windowEnd: window_end },
      variables: { window_start, window_end, window_sum, max_sum },
      constraintValue: window_end - window_start + 1,
      constraintMax: k,
      explanation: "Slide the window by incrementing window_start. The window moves right.",
      activeLine: 9
    });
  }
}

steps.push({
  stepIndex: stepIndex++,
  diagramState: { left: window_start, right: array.length - 1 },
  variables: { window_start, window_end: array.length, window_sum, max_sum },
  explanation: "We've checked all possible windows of size " + k + ". The maximum sum found is " + max_sum + ".",
  activeLine: 10
});

const slidingWindowJson = {
  id: "sliding-window",
  title: "Sliding Window",
  slug: "sliding-window",
  category: "algorithm",
  difficulty: "beginner",
  estimatedMinutes: 45,
  prerequisites: ["arrays"],
  tags: ["arrays", "subarrays", "continuous sequences", "optimization"],
  overview: {
    summary: "The Sliding Window pattern is used to perform required operations on consecutive subsets of a given array or group.",
    learningObjectives: [
      "Understand the time and space complexity difference between naive loop and sliding window",
      "Identify problems that ask for contiguous subarrays or sublists",
      "Trace the two pointers that define the boundaries of the window",
      "Recognize fixed vs dynamic window variants",
      "Translate visual logic to code in your preferred language"
    ],
    interviewRelevance: "Extremely high. Many 'easy' or 'medium' array problems are just disguised sliding window questions."
  },
  content: [
    {
      type: "theory",
      content: "When confronted with array problems that ask you to find or calculate something among all contiguous subarrays of a given size, the sliding window pattern is usually your best friend. Instead of recalculating the sum (or product, etc.) from scratch for each window, you simply subtract the element going out of the window and add the element coming into the window."
    },
    {
      type: "callout",
      calloutType: "tip",
      title: "The core intuition",
      content: "A sliding window works like a snake crawling over the array. Every time its head moves forward to eat a new element, its tail must slither forward and drop the oldest element to maintain its size."
    },
    {
      type: "stepper",
      codeHtml: {
        python: '<pre class="shiki"><span class="line" data-line="1"><span style="color:#F97583">def</span><span style="color:#E1E4E8"> </span><span style="color:#B392F0">max_sub_array_of_size_k</span><span style="color:#E1E4E8">(k, arr):</span></span>\\n<span class="line" data-line="2"><span style="color:#E1E4E8">  max_sum, window_sum </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">0</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">0</span></span>\\n<span class="line" data-line="3"><span style="color:#E1E4E8">  window_start </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">0</span></span>\\n<span class="line" data-line="4"><span style="color:#E1E4E8">  </span><span style="color:#F97583">for</span><span style="color:#E1E4E8"> window_end </span><span style="color:#F97583">in</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">range</span><span style="color:#E1E4E8">(</span><span style="color:#79B8FF">len</span><span style="color:#E1E4E8">(arr)):</span></span>\\n<span class="line" data-line="5"><span style="color:#E1E4E8">    window_sum </span><span style="color:#F97583">+=</span><span style="color:#E1E4E8"> arr[window_end]</span></span>\\n<span class="line" data-line="6"><span style="color:#E1E4E8">    </span><span style="color:#F97583">if</span><span style="color:#E1E4E8"> window_end </span><span style="color:#F97583">>=</span><span style="color:#E1E4E8"> k </span><span style="color:#F97583">-</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">1</span><span style="color:#E1E4E8">:</span></span>\\n<span class="line" data-line="7"><span style="color:#E1E4E8">      max_sum </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">max</span><span style="color:#E1E4E8">(max_sum, window_sum)</span></span>\\n<span class="line" data-line="8"><span style="color:#E1E4E8">      window_sum </span><span style="color:#F97583">-=</span><span style="color:#E1E4E8"> arr[window_start]</span></span>\\n<span class="line" data-line="9"><span style="color:#E1E4E8">      window_start </span><span style="color:#F97583">+=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">1</span></span>\\n<span class="line" data-line="10"><span style="color:#E1E4E8">  </span><span style="color:#F97583">return</span><span style="color:#E1E4E8"> max_sum</span></span></pre>',
        javascript: '<pre class="shiki"><span class="line" data-line="1"><span style="color:#F97583">function</span><span style="color:#E1E4E8"> </span><span style="color:#B392F0">max_sub_array_of_size_k</span><span style="color:#E1E4E8">(</span><span style="color:#FFAB70">k</span><span style="color:#E1E4E8">, </span><span style="color:#FFAB70">arr</span><span style="color:#E1E4E8">) {</span></span>\\n<span class="line" data-line="2"><span style="color:#E1E4E8">  </span><span style="color:#F97583">let</span><span style="color:#E1E4E8"> maxSum </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">0</span><span style="color:#E1E4E8">, windowSum </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">0</span><span style="color:#E1E4E8">;</span></span>\\n<span class="line" data-line="3"><span style="color:#E1E4E8">  </span><span style="color:#F97583">let</span><span style="color:#E1E4E8"> windowStart </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">0</span><span style="color:#E1E4E8">;</span></span>\\n<span class="line" data-line="4"><span style="color:#E1E4E8">  </span><span style="color:#F97583">for</span><span style="color:#E1E4E8"> (</span><span style="color:#F97583">let</span><span style="color:#E1E4E8"> windowEnd </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">0</span><span style="color:#E1E4E8">; windowEnd </span><span style="color:#F97583"><</span><span style="color:#E1E4E8"> arr.length; windowEnd</span><span style="color:#F97583">++</span><span style="color:#E1E4E8">) {</span></span>\\n<span class="line" data-line="5"><span style="color:#E1E4E8">    windowSum </span><span style="color:#F97583">+=</span><span style="color:#E1E4E8"> arr[windowEnd];</span></span>\\n<span class="line" data-line="6"><span style="color:#E1E4E8">    </span><span style="color:#F97583">if</span><span style="color:#E1E4E8"> (windowEnd </span><span style="color:#F97583">>=</span><span style="color:#E1E4E8"> k </span><span style="color:#F97583">-</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">1</span><span style="color:#E1E4E8">) {</span></span>\\n<span class="line" data-line="7"><span style="color:#E1E4E8">      maxSum </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> Math.</span><span style="color:#B392F0">max</span><span style="color:#E1E4E8">(maxSum, windowSum);</span></span>\\n<span class="line" data-line="8"><span style="color:#E1E4E8">      windowSum </span><span style="color:#F97583">-=</span><span style="color:#E1E4E8"> arr[windowStart];</span></span>\\n<span class="line" data-line="9"><span style="color:#E1E4E8">      windowStart </span><span style="color:#F97583">+=</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">1</span><span style="color:#E1E4E8">;</span></span>\\n<span class="line" data-line="10"><span style="color:#E1E4E8">    }</span></span>\\n<span class="line" data-line="11"><span style="color:#E1E4E8">  }</span></span>\\n<span class="line" data-line="12"><span style="color:#E1E4E8">  </span><span style="color:#F97583">return</span><span style="color:#E1E4E8"> maxSum;</span></span>\\n<span class="line" data-line="13"><span style="color:#E1E4E8">}</span></span></pre>',
        java: '<pre class="shiki"><span class="line" data-line="1">Java Code Placeholder...</span></pre>',
        cpp: '<pre class="shiki"><span class="line" data-line="1">C++ Code Placeholder...</span></pre>',
      },
      diagramType: "array",
      arrayCells: array,
      constraintLabel: "Window Size",
      steps: steps
    }
  ],
  patternTemplate: {
    pseudocode: "left = 0\nfor right in range(n):\n  add arr[right] to window\n  while window condition violated:\n    remove arr[left] from window\n    left += 1\n  update result with current window",
    whenToUse: "When dealing with contiguous arrays or strings and need to find the shortest/longest/target substring or subarray.",
    timeComplexity: "O(N) - each element is processed at most twice (added and deleted).",
    spaceComplexity: "O(1) - or O(K) if storing a hash map of K distinct characters."
  },
  examples: [
    {
      title: "Maximum Sum Subarray of Size K",
      difficulty: "easy",
      leetcodeUrl: "https://leetcode.com/problems/maximum-average-subarray-i/",
      problemStatement: "Given an array of positive numbers and a positive number 'k', find the maximum sum of any contiguous subarray of size 'k'.",
      inputExample: "Input: [2, 1, 5, 1, 3, 2], k=3",
      outputExample: "Output: 9 (subarray [5, 1, 3])",
      steps: [
        "Initialize window_sum and max_sum to 0",
        "Add incoming elements to window_sum",
        "Once we hit size k, compare to max_sum",
        "Subtract element leaving window and advance start"
      ],
      code: {
        python: "def max_sub_array_of_size_k(k, arr):\n  max_sum, window_sum = 0, 0\n  window_start = 0\n  for window_end in range(len(arr)):\n    window_sum += arr[window_end]\n    if window_end >= k - 1:\n      max_sum = max(max_sum, window_sum)\n      window_sum -= arr[window_start]\n      window_start += 1\n  return max_sum",
        javascript: "function max_sub_array_of_size_k(k, arr) {\n  let maxSum = 0, windowSum = 0;\n  let windowStart = 0;\n  // ...\n  return maxSum;\n}",
        java: "class Solution {}",
        cpp: "class Solution {}"
      },
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)"
    }
  ],
  recognitionQuiz: {
    problemStatement: "Given an array of positive numbers and a number S, find the length of the smallest contiguous subarray whose sum is greater than or equal to S.",
    correctPatternId: "sliding-window",
    distractors: ["two-pointers", "binary-search", "hash-maps"],
    explanation: "Because we are asked for a 'contiguous subarray' that satisfies a condition (sum >= S), we can use a dynamic sliding window."
  },
  conceptQuiz: [
    {
      question: "Which of the following is true about sliding window?",
      options: [
        "It always uses a fixed size",
        "It reduces nested loops to a single loop",
        "It can only be used on sorted arrays",
        "It requires O(N) extra space"
      ],
      correctIndex: 1,
      explanation: "A sliding window optimization turns O(N^2) nested loops into an O(N) single loop by preventing redundant calculations."
    }
  ],
  practice: [
    {
      title: "Maximum Average Subarray I",
      url: "https://leetcode.com/problems/maximum-average-subarray-i/",
      difficulty: "easy",
      patternTag: "Fixed Size Window"
    }
  ]
};

const topicsDir = path.join(__dirname, '..', 'content', 'topics');
if (!fs.existsSync(topicsDir)) {
  fs.mkdirSync(topicsDir, { recursive: true });
}
fs.writeFileSync(path.join(topicsDir, 'sliding-window.json'), JSON.stringify(slidingWindowJson, null, 2));
console.log('Created sliding-window.json');
