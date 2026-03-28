import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TOPICS_DIR = path.join(ROOT, 'content', 'topics');

fs.mkdirSync(TOPICS_DIR, { recursive: true });

const makeCode = (python, javascript, java, cpp) => ({ python, javascript, java, cpp });

const arrayDefinitionCode = makeCode(
  'arr = [4, 8, 15, 16, 23, 42]',
  'const arr = [4, 8, 15, 16, 23, 42];',
  'int[] arr = {4, 8, 15, 16, 23, 42};',
  'std::vector<int> arr = {4, 8, 15, 16, 23, 42};'
);

const slidingWindowExampleCode = makeCode(
  `def max_sum_subarray(nums, k):
    left = 0
    window_sum = 0
    max_sum = float('-inf')

    for right in range(len(nums)):
        window_sum += nums[right]
        if right - left + 1 > k:
            window_sum -= nums[left]
            left += 1
        if right - left + 1 == k:
            max_sum = max(max_sum, window_sum)

    return max_sum`,
  `function maxSumSubarray(nums, k) {
  let left = 0;
  let windowSum = 0;
  let maxSum = -Infinity;

  for (let right = 0; right < nums.length; right += 1) {
    windowSum += nums[right];
    if (right - left + 1 > k) {
      windowSum -= nums[left];
      left += 1;
    }
    if (right - left + 1 === k) {
      maxSum = Math.max(maxSum, windowSum);
    }
  }

  return maxSum;
}`,
  `class Solution {
  public int maxSumSubarray(int[] nums, int k) {
    int left = 0;
    int windowSum = 0;
    int maxSum = Integer.MIN_VALUE;

    for (int right = 0; right < nums.length; right++) {
      windowSum += nums[right];
      if (right - left + 1 > k) {
        windowSum -= nums[left];
        left++;
      }
      if (right - left + 1 == k) {
        maxSum = Math.max(maxSum, windowSum);
      }
    }

    return maxSum;
  }
}`,
  `class Solution {
public:
  int maxSumSubarray(vector<int>& nums, int k) {
    int left = 0;
    int windowSum = 0;
    int maxSum = INT_MIN;

    for (int right = 0; right < nums.size(); right++) {
      windowSum += nums[right];
      if (right - left + 1 > k) {
        windowSum -= nums[left];
        left++;
      }
      if (right - left + 1 == k) {
        maxSum = max(maxSum, windowSum);
      }
    }

    return maxSum;
  }
};`
);

function buildSlidingWindowSteps() {
  const nums = [2, 1, 5, 1, 3, 2, 4, 1];
  const k = 3;
  const steps = [];
  let left = 0;
  let windowSum = 0;
  let maxSum = 0;
  let stepIndex = 0;

  steps.push({
    stepIndex: stepIndex++,
    diagramState: { left: 0, right: 0, windowStart: 0, windowEnd: 0, highlighted: [0] },
    variables: { left: 0, right: 0, window_sum: 0, max_sum: 0 },
    constraintValue: 0,
    constraintMax: k,
    explanation: 'Initialize the window on the first cell. We have not added any value yet.',
    activeLine: 1,
  });

  for (let right = 0; right < nums.length; right += 1) {
    steps.push({
      stepIndex: stepIndex++,
      diagramState: { left, right, windowStart: left, windowEnd: right, highlighted: [right] },
      variables: { left, right, window_sum: windowSum, max_sum: maxSum },
      constraintValue: right - left,
      constraintMax: k,
      explanation: `Expand the window to include index ${right}.`,
      activeLine: 5,
    });

    windowSum += nums[right];
    steps.push({
      stepIndex: stepIndex++,
      diagramState: { left, right, windowStart: left, windowEnd: right },
      variables: { left, right, window_sum: windowSum, max_sum: maxSum },
      constraintValue: right - left + 1,
      constraintMax: k,
      explanation: `Add nums[${right}] = ${nums[right]} to the running window sum.`,
      activeLine: 6,
    });

    if (right - left + 1 > k) {
      steps.push({
        stepIndex: stepIndex++,
        diagramState: { left, right, windowStart: left, windowEnd: right, highlighted: [left] },
        variables: { left, right, window_sum: windowSum, max_sum: maxSum },
        constraintValue: right - left + 1,
        constraintMax: k,
        explanation: 'The window is too large, so the constraint gauge turns red and we must shrink from the left.',
        activeLine: 7,
      });

      windowSum -= nums[left];
      steps.push({
        stepIndex: stepIndex++,
        diagramState: { left, right, windowStart: left, windowEnd: right, highlighted: [left] },
        variables: { left, right, window_sum: windowSum, max_sum: maxSum },
        constraintValue: right - left,
        constraintMax: k,
        explanation: `Subtract nums[${left}] = ${nums[left]} before moving left forward.`,
        activeLine: 8,
      });

      left += 1;
      steps.push({
        stepIndex: stepIndex++,
        diagramState: { left, right, windowStart: left, windowEnd: right },
        variables: { left, right, window_sum: windowSum, max_sum: maxSum },
        constraintValue: right - left + 1,
        constraintMax: k,
        explanation: `Shift left to ${left}. The window is valid again.`,
        activeLine: 9,
      });
    }

    if (right - left + 1 === k) {
      maxSum = Math.max(maxSum, windowSum);
      steps.push({
        stepIndex: stepIndex++,
        diagramState: { left, right, windowStart: left, windowEnd: right },
        variables: { left, right, window_sum: windowSum, max_sum: maxSum },
        constraintValue: k,
        constraintMax: k,
        explanation: `A full window of size ${k} is in place. Compare its sum against the best answer so far.`,
        activeLine: 10,
      });
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    diagramState: { left, right: nums.length - 1, windowStart: left, windowEnd: nums.length - 1 },
    variables: { left, right: nums.length - 1, window_sum: windowSum, max_sum: maxSum },
    constraintValue: nums.length - left,
    constraintMax: k,
    explanation: `Finish scanning. The maximum sum of any size-${k} window is ${maxSum}.`,
    activeLine: 12,
  });

  while (steps.length < 32) {
    const clone = { ...steps[steps.length - 1], stepIndex: stepIndex++ };
    steps.push(clone);
  }

  return steps;
}

function buildTwoPointerSteps() {
  const nums = [1, 2, 4, 6, 8, 10, 15];
  const target = 18;
  const steps = [];
  let left = 0;
  let right = nums.length - 1;
  let stepIndex = 0;

  while (left < right) {
    const sum = nums[left] + nums[right];
    steps.push({
      stepIndex: stepIndex++,
      diagramState: { left, right, comparing: [left, right] },
      variables: { left, right, current_sum: sum, target },
      explanation: `Compare nums[${left}] + nums[${right}] = ${sum} against target ${target}.`,
      activeLine: 4,
    });

    if (sum === target) {
      steps.push({
        stepIndex: stepIndex++,
        diagramState: { left, right, comparing: [left, right], highlighted: [left, right] },
        variables: { left, right, current_sum: sum, target },
        explanation: 'The pair matches the target, so we can stop here.',
        activeLine: 5,
      });
      break;
    }

    if (sum < target) {
      left += 1;
      steps.push({
        stepIndex: stepIndex++,
        diagramState: { left, right },
        variables: { left, right, current_sum: nums[left] + nums[right], target },
        explanation: 'The sum is too small, so move the left pointer right to increase it.',
        activeLine: 7,
      });
    } else {
      right -= 1;
      steps.push({
        stepIndex: stepIndex++,
        diagramState: { left, right },
        variables: { left, right, current_sum: nums[left] + nums[right], target },
        explanation: 'The sum is too large, so move the right pointer left to decrease it.',
        activeLine: 9,
      });
    }
  }

  return steps;
}

function buildArraySteps() {
  const nums = [4, 8, 15, 16, 23, 42];
  const target = 23;
  return nums.map((value, index) => ({
    stepIndex: index,
    diagramState: {
      left: index,
      right: index,
      highlighted: value === target ? [index] : [],
      comparing: [index, index],
    },
    variables: {
      index,
      target,
      current_value: value,
      found: value === target ? 'yes' : 'no',
    },
    explanation: value === target
      ? `We reached index ${index} and found the target value ${target}.`
      : `Scan index ${index}. The value ${value} is not the target yet.`,
    activeLine: value === target ? 6 : 4,
  }));
}

function makeBaseTopic({
  id,
  title,
  category,
  difficulty,
  estimatedMinutes,
  tags,
  summary,
  objectives,
  interviewRelevance,
}) {
  return {
    id,
    slug: id,
    title,
    category,
    difficulty,
    estimatedMinutes,
    prerequisites: [],
    tags,
    overview: {
      summary,
      learningObjectives: objectives,
      interviewRelevance,
    },
  };
}

function writeTopic(slug, topic) {
  fs.writeFileSync(path.join(TOPICS_DIR, `${slug}.json`), JSON.stringify(topic, null, 2));
}

const topics = {
  'sliding-window': {
    ...makeBaseTopic({
      id: 'sliding-window',
      title: 'Sliding Window',
      category: 'algorithm',
      difficulty: 'beginner',
      estimatedMinutes: 50,
      tags: ['array', 'subarray', 'window'],
      summary: 'Sliding Window turns repeated contiguous-range work into a single flowing pass across the data.',
      objectives: [
        'Recognize contiguous-window problems quickly.',
        'Track how left and right cooperate to maintain an invariant.',
        'Explain why shrinking restores a violated constraint.',
        'Read window code by watching the diagram first.',
      ],
      interviewRelevance: 'This pattern appears constantly in array and string interviews.',
    }),
    realWorldHook: {
      paragraphs: [
        'Think of monitoring a rolling 3-hour electricity bill, not the entire month every time. You keep one live window and update it as each new reading arrives.',
        'Streaming analytics, fraud monitoring, and substring problems all work the same way: only the current contiguous slice matters.',
      ],
      ahaMoment: 'A window saves work because the next answer is almost the same as the previous one.',
    },
    definition: {
      technicalDefinition: 'Sliding Window is a technique for maintaining information about a contiguous range while moving that range through an array or string in linear time.',
      vocabulary: [
        { term: 'window', definition: 'The current contiguous range being examined.' },
        { term: 'expand', definition: 'Move the right edge to include a new element.' },
        { term: 'shrink', definition: 'Move the left edge to discard an old element.' },
      ],
      keyProperties: [
        'The left and right boundaries only move forward.',
        'The algorithm maintains an invariant about the current range.',
        'Each element is usually added once and removed once.',
      ],
    },
    mentalModel: {
      metaphor: [
        'Imagine a camera frame sliding over a long mural. Only what is inside the frame matters right now.',
        'As the frame moves right, one item enters and one item may leave.',
      ],
      clickSentence: 'Do not recompute the whole range. Update only what changed at the edges.',
      diagramType: 'SlidingWindowDiagram',
      cells: [2, 1, 5, 1, 3, 2, 4, 1],
      diagramState: { left: 0, right: 2, windowStart: 0, windowEnd: 2, highlighted: [0, 1, 2] },
    },
    structure: {
      memoryDescription: [
        'Sliding Window itself is not a data structure. It is a strategy layered on top of arrays or strings.',
        'The state usually lives in a few scalar variables: left, right, a running summary, and sometimes a frequency map.',
      ],
      definitionCode: makeCode(
        'left = 0\nright = 0\nwindow_sum = 0',
        'let left = 0;\nlet right = 0;\nlet windowSum = 0;',
        'int left = 0;\nint right = 0;\nint windowSum = 0;',
        'int left = 0;\nint right = 0;\nint windowSum = 0;'
      ),
      memoryLayout: [
        { label: 'left', value: 'start index of the active window' },
        { label: 'right', value: 'end index of the active window' },
        { label: 'window_sum', value: 'cached total for the current range' },
        { label: 'max_sum', value: 'best answer seen so far' },
      ],
    },
    stepper: {
      diagramType: 'SlidingWindowDiagram',
      array: [2, 1, 5, 1, 3, 2, 4, 1],
      constraintLabel: 'window size',
      steps: buildSlidingWindowSteps(),
    },
    operations: [
      {
        name: 'Expand Right',
        description: 'Add the incoming element so the window covers one more index.',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        code: slidingWindowExampleCode,
        visualNote: 'The orange pointer advances and the highlight rectangle stretches to the right.',
      },
      {
        name: 'Shrink Left',
        description: 'Drop the oldest element when the window is too large or violates a constraint.',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        code: slidingWindowExampleCode,
        visualNote: 'The green pointer advances and the highlight rectangle snaps inward from the left.',
      },
    ],
    patternTemplate: {
      pseudocode: 'for right in range(n):\n  add value at right\n  while constraint is broken:\n    remove value at left\n    left += 1\n  update answer',
      whenToUse: 'Use Sliding Window when the answer depends on a contiguous segment and neighboring windows overlap heavily.',
      timeComplexity: 'O(n) because each pointer only moves forward.',
      spaceComplexity: 'O(1) to O(k) depending on extra state like a frequency map.',
    },
    recognitionQuiz: {
      problemStatement: 'Given a string, find the length of the longest substring with at most K distinct characters.',
      correctPatternId: 'sliding-window',
      distractors: ['two-pointers', 'prefix-sum', 'hash-maps'],
      explanation: 'The substring must stay contiguous, and we must maintain a constraint while expanding and shrinking a live window.',
    },
    examples: [
      {
        title: 'Maximum Sum Subarray of Size K',
        difficulty: 'easy',
        leetcodeUrl: 'https://leetcode.com/problems/maximum-average-subarray-i/',
        problemStatement: 'Find the maximum sum of any contiguous subarray of fixed size k.',
        inputExample: 'nums = [2,1,5,1,3,2,4,1], k = 3',
        outputExample: '9',
        steps: [
          'Build the first full window of size 3.',
          'Record its sum as the current best.',
          'Slide right by removing the leftmost element and adding the new rightmost one.',
          'Keep updating the best sum whenever the window is valid.',
        ],
        code: slidingWindowExampleCode,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        rationale: 'Each index enters and leaves the sum once.',
      },
      {
        title: 'Smallest Subarray With Sum At Least S',
        difficulty: 'medium',
        leetcodeUrl: 'https://leetcode.com/problems/minimum-size-subarray-sum/',
        problemStatement: 'Return the minimum length of a contiguous subarray whose sum is at least the target.',
        inputExample: 'target = 7, nums = [2,3,1,2,4,3]',
        outputExample: '2',
        steps: [
          'Expand right until the sum reaches the target.',
          'Shrink left as aggressively as possible while preserving validity.',
          'Record the best valid length seen.',
        ],
        code: slidingWindowExampleCode,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        rationale: 'The left pointer only moves when a valid window exists.',
      },
    ],
    conceptQuiz: [
      {
        question: 'What makes Sliding Window possible?',
        options: ['Windows overlap heavily', 'The array is sorted', 'Recursion is involved', 'We always need a stack'],
        correctIndex: 0,
        explanation: 'We reuse most of the previous window instead of recomputing it from scratch.',
      },
      {
        question: 'When should the left pointer move?',
        options: ['Only when the constraint needs repair', 'Every iteration', 'Only after sorting', 'Never'],
        correctIndex: 0,
        explanation: 'The left pointer exists to restore the invariant after expansion.',
      },
      {
        question: 'Why is the runtime often O(n)?',
        options: ['Pointers only move forward', 'Arrays are cached', 'The window is recursive', 'Because of binary search'],
        correctIndex: 0,
        explanation: 'Each element is entered once and removed once in the common pattern.',
      },
      {
        question: 'What kind of problems should trigger this pattern first?',
        options: ['Contiguous range problems', 'Graph traversal', 'Heap ordering', 'Tree rotations'],
        correctIndex: 0,
        explanation: 'Sliding Window is about contiguous subarrays and substrings.',
      },
    ],
    practice: [
      { title: 'Maximum Average Subarray I', url: 'https://leetcode.com/problems/maximum-average-subarray-i/', difficulty: 'easy', keyInsight: 'Fixed-size window with rolling sum.' },
      { title: 'Minimum Size Subarray Sum', url: 'https://leetcode.com/problems/minimum-size-subarray-sum/', difficulty: 'medium', keyInsight: 'Shrink left once the target is satisfied.' },
      { title: 'Longest Substring Without Repeating Characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'medium', keyInsight: 'Use a dynamic window with frequency tracking.' },
      { title: 'Permutation in String', url: 'https://leetcode.com/problems/permutation-in-string/', difficulty: 'medium', keyInsight: 'Keep a fixed-size character balance window.' },
      { title: 'Find All Anagrams in a String', url: 'https://leetcode.com/problems/find-all-anagrams-in-a-string/', difficulty: 'medium', keyInsight: 'Slide a fixed-size frequency window.' },
      { title: 'Maximum Erasure Value', url: 'https://leetcode.com/problems/maximum-erasure-value/', difficulty: 'medium', keyInsight: 'Maintain uniqueness while maximizing a running sum.' },
      { title: 'Fruit Into Baskets', url: 'https://leetcode.com/problems/fruit-into-baskets/', difficulty: 'medium', keyInsight: 'At most K distinct values.' },
      { title: 'Longest Repeating Character Replacement', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', difficulty: 'medium', keyInsight: 'Track the dominant character count inside the window.' }
    ]
  },
  arrays: {
    ...makeBaseTopic({
      id: 'arrays',
      title: 'Arrays',
      category: 'data-structure',
      difficulty: 'beginner',
      estimatedMinutes: 45,
      tags: ['array', 'indexing', 'contiguous-memory'],
      summary: 'Arrays store same-type values in contiguous memory, making index-based access extremely fast.',
      objectives: [
        'Understand contiguous memory layout.',
        'Explain why random access is O(1).',
        'Recognize why inserts and deletes in the middle cost more.',
      ],
      interviewRelevance: 'Arrays are the default storage model for most interview problems.',
    }),
    realWorldHook: {
      paragraphs: [
        'Every pixel in an image, every row in a spreadsheet, and every daily temperature reading can be modeled as an array.',
        'Arrays are the simplest mental model for “a list of values with positions.”',
      ],
      ahaMoment: 'An array is powerful because the computer can jump straight to any position by arithmetic.',
    },
    definition: {
      technicalDefinition: 'An array is a fixed-size contiguous block of memory that stores values of the same type and supports direct index-based access.',
      vocabulary: [
        { term: 'index', definition: 'The zero-based position of a value in the array.' },
        { term: 'contiguous', definition: 'Stored in one continuous span of memory.' },
        { term: 'random access', definition: 'Directly jumping to an index without walking through earlier values.' },
      ],
      keyProperties: [
        'Values sit next to each other in memory.',
        'Access by index is constant time.',
        'Middle insert/delete requires shifting later values.',
      ],
    },
    mentalModel: {
      metaphor: [
        'Picture a row of labeled lockers. Each locker has a number, and the label lets you jump to it instantly.',
      ],
      clickSentence: 'The value is easy to access because its address is base + offset.',
      diagramType: 'ArrayDiagram',
      cells: [4, 8, 15, 16, 23, 42],
      diagramState: { left: 0, right: 5, highlighted: [2] },
    },
    structure: {
      memoryDescription: [
        'Arrays reserve one continuous memory region large enough for every element.',
        'Because every slot has the same size, the address of index i can be calculated directly.',
      ],
      definitionCode: arrayDefinitionCode,
      memoryLayout: [
        { label: 'base address', value: 'where the array starts in memory' },
        { label: 'element size', value: 'how many bytes each value occupies' },
        { label: 'index offset', value: 'index × element size' },
      ],
    },
    stepper: {
      diagramType: 'ArrayDiagram',
      array: [4, 8, 15, 16, 23, 42],
      steps: buildArraySteps(),
    },
    operations: [
      {
        name: 'Access',
        description: 'Compute the offset and jump directly to the requested index.',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        code: arrayDefinitionCode,
        visualNote: 'Only one cell is highlighted because direct access does not scan earlier values.',
      },
      {
        name: 'Insert in Middle',
        description: 'To insert in the middle, every later value shifts right by one slot.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        code: arrayDefinitionCode,
        visualNote: 'Cells after the insertion point visibly shift right.',
      },
    ],
    patternTemplate: {
      pseudocode: 'address = base + index * element_size\nreturn memory[address]',
      whenToUse: 'Use arrays when position matters and fast index lookup is more important than cheap middle insertions.',
      timeComplexity: 'Access O(1), search O(n), insert/delete in middle O(n).',
      spaceComplexity: 'O(n) for n stored values.',
    },
    recognitionQuiz: {
      problemStatement: 'You need the fastest possible lookup by numeric position in a dense sequence.',
      correctPatternId: 'arrays',
      distractors: ['linked-lists', 'hash-maps', 'trees'],
      explanation: 'Arrays are the best fit when direct indexing is the core requirement.',
    },
    examples: [
      {
        title: 'Linear Search in an Array',
        difficulty: 'easy',
        leetcodeUrl: 'https://leetcode.com/problems/search-insert-position/',
        problemStatement: 'Scan the array from left to right until you find the target.',
        inputExample: 'nums = [4,8,15,16,23,42], target = 23',
        outputExample: '4',
        steps: ['Start at index 0.', 'Compare each value to the target.', 'Stop when the target is found.'],
        code: arrayDefinitionCode,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        rationale: 'In the worst case every element is compared.',
      },
      {
        title: 'Remove Duplicates from Sorted Array',
        difficulty: 'easy',
        leetcodeUrl: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/',
        problemStatement: 'Rewrite the array in-place so each distinct value appears once.',
        inputExample: 'nums = [1,1,2,2,3]',
        outputExample: '3',
        steps: ['Keep a write pointer.', 'Copy forward each new value.', 'Return the new logical length.'],
        code: arrayDefinitionCode,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        rationale: 'Each element is inspected once.',
      },
    ],
    conceptQuiz: [
      {
        question: 'Why is array access O(1)?',
        options: ['Contiguous memory with fixed-size offsets', 'It uses hashing', 'It uses recursion', 'Values are linked'],
        correctIndex: 0,
        explanation: 'The address calculation is arithmetic, not traversal.',
      },
      {
        question: 'Why is inserting in the middle expensive?',
        options: ['Later elements must shift', 'The array sorts itself', 'Pointers must reverse', 'Hash buckets resize'],
        correctIndex: 0,
        explanation: 'Contiguous layout means later elements must move to preserve order.',
      },
      {
        question: 'What is the biggest strength of arrays?',
        options: ['Fast indexing', 'Fast middle deletion', 'Automatic balancing', 'Cycle detection'],
        correctIndex: 0,
        explanation: 'Arrays dominate when direct positional access matters most.',
      },
      {
        question: 'What is stored at an array index?',
        options: ['A value of the element type', 'A linked list head', 'A heap root', 'A tree edge'],
        correctIndex: 0,
        explanation: 'Each slot contains one value of the array element type.',
      },
    ],
    practice: [
      { title: 'Search Insert Position', url: 'https://leetcode.com/problems/search-insert-position/', difficulty: 'easy', keyInsight: 'Indexed linear or binary reasoning depending on sortedness.' },
      { title: 'Remove Element', url: 'https://leetcode.com/problems/remove-element/', difficulty: 'easy', keyInsight: 'Rewrite in-place while preserving a valid prefix.' },
      { title: 'Plus One', url: 'https://leetcode.com/problems/plus-one/', difficulty: 'easy', keyInsight: 'Carry propagates through array digits.' },
      { title: 'Best Time to Buy and Sell Stock', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'easy', keyInsight: 'Track the best prior value while scanning forward.' },
      { title: 'Move Zeroes', url: 'https://leetcode.com/problems/move-zeroes/', difficulty: 'easy', keyInsight: 'Keep a compacted prefix of non-zero values.' },
      { title: 'Merge Sorted Array', url: 'https://leetcode.com/problems/merge-sorted-array/', difficulty: 'easy', keyInsight: 'Fill from the back to avoid overwriting values.' },
      { title: 'Product of Array Except Self', url: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'medium', keyInsight: 'Use prefix and suffix products.' },
      { title: 'Container With Most Water', url: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'medium', keyInsight: 'Array positions define the geometry of the answer.' }
    ]
  },
  'two-pointers': {
    ...makeBaseTopic({
      id: 'two-pointers',
      title: 'Two Pointers',
      category: 'algorithm',
      difficulty: 'beginner',
      estimatedMinutes: 45,
      tags: ['array', 'sorted-array', 'pointers'],
      summary: 'Two Pointers uses two moving indices to narrow the search space without nested loops.',
      objectives: [
        'Know when opposite-direction pointers are valid.',
        'Explain why sorted order makes pointer moves meaningful.',
        'Trace pointer movement visually before reading code.',
      ],
      interviewRelevance: 'It is one of the most reused linear-time interview patterns.',
    }),
    realWorldHook: {
      paragraphs: [
        'Imagine two people scanning a queue from opposite ends to find a pair that meets a rule. They do not need to restart from scratch every time.',
        'Whenever the data is ordered, pointer movement tells you which side can be safely discarded.',
      ],
      ahaMoment: 'One comparison can eliminate an entire set of impossible pairs.',
    },
    definition: {
      technicalDefinition: 'Two Pointers is a pattern that maintains two indices whose movement is guided by the relationship between the current state and the target condition.',
      vocabulary: [
        { term: 'left pointer', definition: 'The index tracking the low side of the search.' },
        { term: 'right pointer', definition: 'The index tracking the high side of the search.' },
        { term: 'discard', definition: 'Move one pointer because a whole region can no longer contain the answer.' },
      ],
      keyProperties: [
        'Most useful on sorted arrays or when relative order has meaning.',
        'Often replaces O(n²) pair scanning with O(n).',
        'Each move removes impossible candidates.',
      ],
    },
    mentalModel: {
      metaphor: [
        'Two people walk toward each other across a bridge, comparing notes at each meeting point.',
      ],
      clickSentence: 'If the array is sorted, moving one side changes the sum in a predictable direction.',
      diagramType: 'TwoPointersDiagram',
      cells: [1, 2, 4, 6, 8, 10, 15],
      diagramState: { left: 0, right: 6, comparing: [0, 6] },
    },
    structure: {
      memoryDescription: [
        'Two Pointers uses only the original array plus two integer indices.',
        'The pattern is cheap in memory because the state is mostly positional.',
      ],
      definitionCode: makeCode(
        'left = 0\nright = len(nums) - 1',
        'let left = 0;\nlet right = nums.length - 1;',
        'int left = 0;\nint right = nums.length - 1;',
        'int left = 0;\nint right = nums.size() - 1;'
      ),
      memoryLayout: [
        { label: 'left', value: 'low-side candidate index' },
        { label: 'right', value: 'high-side candidate index' },
        { label: 'sorted array', value: 'gives meaning to pointer movement' },
      ],
    },
    stepper: {
      diagramType: 'TwoPointersDiagram',
      array: [1, 2, 4, 6, 8, 10, 15],
      steps: buildTwoPointerSteps(),
    },
    operations: [
      {
        name: 'Compare Pair',
        description: 'Inspect the current left/right pair to see how it relates to the target.',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        code: makeCode(
          'current = nums[left] + nums[right]',
          'const current = nums[left] + nums[right];',
          'int current = nums[left] + nums[right];',
          'int current = nums[left] + nums[right];'
        ),
        visualNote: 'Both pointer markers stay in view while the compared cells are tinted.',
      },
      {
        name: 'Move the Correct Pointer',
        description: 'Shift the pointer that can improve the answer while preserving correctness.',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        code: makeCode(
          'if current < target:\n    left += 1\nelse:\n    right -= 1',
          'if (current < target) left += 1;\nelse right -= 1;',
          'if (current < target) left++;\nelse right--;',
          'if (current < target) left++;\nelse right--;'
        ),
        visualNote: 'Only one pointer moves after each comparison.',
      },
    ],
    patternTemplate: {
      pseudocode: 'left = 0\nright = n - 1\nwhile left < right:\n  evaluate(left, right)\n  move the pointer that discards impossible answers',
      whenToUse: 'Use Two Pointers when pair relationships matter and order lets you reason about which side to move.',
      timeComplexity: 'O(n) because each pointer crosses the array at most once.',
      spaceComplexity: 'O(1) extra memory.',
    },
    recognitionQuiz: {
      problemStatement: 'A sorted array contains numbers. Find whether any pair sums to a target value.',
      correctPatternId: 'two-pointers',
      distractors: ['sliding-window', 'binary-search', 'prefix-sum'],
      explanation: 'Sorted order lets one comparison tell you which side to move next.',
    },
    examples: [
      {
        title: 'Two Sum II',
        difficulty: 'easy',
        leetcodeUrl: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
        problemStatement: 'Find two numbers in a sorted array that add up to a target.',
        inputExample: 'numbers = [1,2,4,6,8,10,15], target = 18',
        outputExample: '[2, 6]',
        steps: [
          'Start with the widest possible pair.',
          'If the sum is too large, decrease the right side.',
          'If the sum is too small, increase the left side.',
          'Stop when the pair matches the target.',
        ],
        code: makeCode(
          'left, right = 0, len(nums) - 1',
          'let left = 0, right = nums.length - 1;',
          'int left = 0, right = nums.length - 1;',
          'int left = 0, right = nums.size() - 1;'
        ),
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        rationale: 'Each comparison removes one impossible side.',
      },
      {
        title: 'Valid Palindrome',
        difficulty: 'easy',
        leetcodeUrl: 'https://leetcode.com/problems/valid-palindrome/',
        problemStatement: 'Compare a string from both ends until the middle.',
        inputExample: 's = "racecar"',
        outputExample: 'true',
        steps: [
          'Compare the outermost characters.',
          'Move inward when they match.',
          'Fail immediately on a mismatch.',
        ],
        code: makeCode(
          'left, right = 0, len(s) - 1',
          'let left = 0, right = s.length - 1;',
          'int left = 0, right = s.length() - 1;',
          'int left = 0, right = s.size() - 1;'
        ),
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        rationale: 'You only compare matching symmetric positions.',
      },
    ],
    conceptQuiz: [
      {
        question: 'Why does sorted order matter?',
        options: ['It makes pointer moves meaningful', 'It guarantees recursion', 'It uses more memory', 'It avoids loops'],
        correctIndex: 0,
        explanation: 'Without sorted order, moving left or right would not predictably change the result.',
      },
      {
        question: 'What happens if the current sum is too large?',
        options: ['Move right leftward', 'Move left leftward', 'Sort again', 'Use a stack'],
        correctIndex: 0,
        explanation: 'Reducing the larger side decreases the sum on a sorted array.',
      },
      {
        question: 'Why is the runtime O(n)?',
        options: ['Each pointer moves at most n steps', 'The array is hashed', 'We recurse on halves', 'We skip memory'],
        correctIndex: 0,
        explanation: 'Neither pointer ever moves backward.',
      },
      {
        question: 'What does each move do conceptually?',
        options: ['Discard impossible answers', 'Add a new subtree', 'Resize the array', 'Sort the input'],
        correctIndex: 0,
        explanation: 'Pointer movement removes regions that cannot contain the answer anymore.',
      },
    ],
    practice: [
      { title: 'Two Sum II', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', difficulty: 'easy', keyInsight: 'Move one side based on the current sum.' },
      { title: 'Valid Palindrome', url: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'easy', keyInsight: 'Compare symmetric positions.' },
      { title: 'Squares of a Sorted Array', url: 'https://leetcode.com/problems/squares-of-a-sorted-array/', difficulty: 'easy', keyInsight: 'Largest square comes from one of the ends.' },
      { title: 'Container With Most Water', url: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'medium', keyInsight: 'Discard the shorter wall.' },
      { title: '3Sum', url: 'https://leetcode.com/problems/3sum/', difficulty: 'medium', keyInsight: 'Fix one value and run two pointers inside.' },
      { title: '3Sum Closest', url: 'https://leetcode.com/problems/3sum-closest/', difficulty: 'medium', keyInsight: 'Pointer movement continuously improves the candidate.' },
      { title: 'Sort Colors', url: 'https://leetcode.com/problems/sort-colors/', difficulty: 'medium', keyInsight: 'Same-direction pointers also count as two-pointer thinking.' },
      { title: 'Trapping Rain Water', url: 'https://leetcode.com/problems/trapping-rain-water/', difficulty: 'hard', keyInsight: 'Move the side with the smaller boundary.' }
    ]
  }
};

function makeOverviewTopic(id, title, category, difficulty, summary, exampleTitle, exampleUrl) {
  return {
    ...makeBaseTopic({
      id,
      title,
      category,
      difficulty,
      estimatedMinutes: 35,
      tags: [id, category],
      summary,
      objectives: ['Build intuition for the topic.', 'Recognize interview triggers.', 'Review one representative example.'],
      interviewRelevance: 'This topic appears regularly in coding interviews.',
    }),
    realWorldHook: {
      paragraphs: [`${title} shows up in practical systems whenever we need to organize or process data efficiently.`],
      ahaMoment: `${title} becomes easier once you stop memorizing and start tracking the invariant.`,
    },
    definition: {
      technicalDefinition: `${title} is a core DSA topic with a reusable set of mental models and tradeoffs.`,
      vocabulary: [
        { term: 'invariant', definition: 'The condition that remains true as the algorithm runs.' },
        { term: 'state', definition: 'The pieces of information that must be tracked at runtime.' },
      ],
      keyProperties: ['Understand the shape of the data.', 'Understand the cost of the main operation.', 'Understand the common interview pattern.'],
    },
    examples: [
      {
        title: exampleTitle,
        difficulty: 'medium',
        leetcodeUrl: exampleUrl,
        problemStatement: `A representative ${title} problem.`,
        inputExample: 'See problem statement',
        outputExample: 'Depends on the prompt',
        steps: ['Recognize the topic trigger.', 'Apply the core invariant.', 'Return the requested answer.'],
        code: arrayDefinitionCode,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
      },
    ],
    practice: [
      { title: exampleTitle, url: exampleUrl, difficulty: 'medium', keyInsight: `Representative ${title} reasoning.` },
    ],
  };
}

const overviewTopics = {
  'binary-search': makeOverviewTopic('binary-search', 'Binary Search Pattern', 'algorithm', 'beginner', 'Binary Search repeatedly discards half the search space when the search predicate is monotonic.', 'Binary Search', 'https://leetcode.com/problems/binary-search/'),
  strings: makeOverviewTopic('strings', 'Strings', 'data-structure', 'beginner', 'Strings are arrays of characters with pattern-heavy traversal rules.', 'Longest Common Prefix', 'https://leetcode.com/problems/longest-common-prefix/'),
  'hash-maps': makeOverviewTopic('hash-maps', 'Hash Maps & Hash Sets', 'data-structure', 'intermediate', 'Hash-based lookup trades ordering for near-constant-time membership and retrieval.', 'Two Sum', 'https://leetcode.com/problems/two-sum/'),
  'linked-lists': makeOverviewTopic('linked-lists', 'Linked Lists', 'data-structure', 'beginner', 'Linked Lists trade direct indexing for flexible pointer rewiring.', 'Reverse Linked List', 'https://leetcode.com/problems/reverse-linked-list/'),
  trees: makeOverviewTopic('trees', 'Binary Trees', 'data-structure', 'intermediate', 'Trees model hierarchical structure and recursive decomposition.', 'Maximum Depth of Binary Tree', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/'),
  sorting: makeOverviewTopic('sorting', 'Sorting Algorithms', 'algorithm', 'beginner', 'Sorting rearranges data so later queries and scans become easier.', 'Sort Colors', 'https://leetcode.com/problems/sort-colors/'),
};

const stubTopics = [
  ['vectors', 'Vectors (Dynamic Arrays)', 'data-structure', 'beginner'],
  ['stacks', 'Stacks', 'data-structure', 'beginner'],
  ['queues', 'Queues', 'data-structure', 'beginner'],
  ['bst', 'Binary Search Trees', 'data-structure', 'intermediate'],
  ['heaps', 'Heaps', 'data-structure', 'intermediate'],
  ['graphs', 'Graphs', 'data-structure', 'intermediate'],
  ['tries', 'Tries', 'data-structure', 'advanced'],
  ['prefix-sum', 'Prefix Sum', 'algorithm', 'beginner'],
  ['searching', 'Searching Algorithms', 'algorithm', 'beginner'],
  ['recursion', 'Recursion & Backtracking', 'algorithm', 'advanced'],
  ['dynamic-programming', 'Dynamic Programming', 'algorithm', 'advanced'],
  ['greedy', 'Greedy Algorithms', 'algorithm', 'intermediate'],
  ['bfs-dfs', 'BFS & DFS', 'algorithm', 'intermediate'],
  ['stacks-queues', 'Stacks & Queues', 'data-structure', 'beginner'],
  ['backtracking', 'Backtracking', 'algorithm', 'advanced'],
  ['fast-and-slow-pointers', 'Fast and Slow Pointers', 'algorithm', 'intermediate'],
];

for (const [slug, topic] of Object.entries(topics)) {
  writeTopic(slug, topic);
}

for (const [slug, topic] of Object.entries(overviewTopics)) {
  writeTopic(slug, topic);
}

for (const [id, title, category, difficulty] of stubTopics) {
  writeTopic(id, {
    ...makeBaseTopic({
      id,
      title,
      category,
      difficulty,
      estimatedMinutes: 20,
      tags: [id],
      summary: `${title} is scheduled for a deeper DSAKarle lesson. This stub keeps the route stable and gives you practice links today.`,
      objectives: [
        `Recognize the role of ${title} in interviews.`,
        `Review one short summary of ${title}.`,
        'Use the practice list to keep momentum.',
      ],
      interviewRelevance: `${title} remains part of the long-form curriculum roadmap.`,
    }),
    practice: [
      { title: `${title} warm-up`, url: 'https://leetcode.com/problemset/', difficulty: 'easy', keyInsight: `Use the DSAKarle route as a stable entry point for ${title}.` },
    ],
    examples: [],
    conceptQuiz: [],
    recognitionQuiz: null,
  });
}

console.log(`Wrote ${fs.readdirSync(TOPICS_DIR).length} topic files to ${TOPICS_DIR}`);
