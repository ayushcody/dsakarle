import type { CodeLanguage } from '@/types/learning';

export interface DebuggerStep {
  instruction: string;
  dragSource: string;
  dragTarget: string;
  codeLine: string;
  onSuccess: string;
  onFailure: string;
}

export interface DebuggerChallenge {
  id: string;
  title: string;
  description: string;
  visualizerType: 'linked-list' | 'array' | 'tree';
  initialNodes: Array<{ id: string; value: string | number; next?: string | null }>;
  steps: DebuggerStep[];
  code: Record<CodeLanguage, string>;
}

export const DEBUGGER_CHALLENGES: Record<string, DebuggerChallenge[]> = {
  'linked-lists': [
    {
      id: 'll-delete-middle',
      title: 'Delete a Node (Visual)',
      description: 'Delete node B from the linked list A → B → C → D by redirecting pointers.',
      visualizerType: 'linked-list',
      initialNodes: [
        { id: 'A', value: 'A', next: 'B' },
        { id: 'B', value: 'B', next: 'C' },
        { id: 'C', value: 'C', next: 'D' },
        { id: 'D', value: 'D', next: null },
      ],
      steps: [
        {
          instruction: 'Drag A\'s next pointer to node C (skip over B)',
          dragSource: 'ptr-A',
          dragTarget: 'node-C',
          codeLine: 'prev.next = curr.next',
          onSuccess: 'A now points directly to C — B is bypassed!',
          onFailure: 'Not that node. A needs to skip B, so where should A.next point?',
        },
        {
          instruction: 'Drag B\'s next pointer to NULL (cleanup)',
          dragSource: 'ptr-B',
          dragTarget: 'node-null',
          codeLine: 'curr.next = null',
          onSuccess: 'B is fully detached. Deletion complete!',
          onFailure: 'We need to disconnect B entirely. Drag its pointer to the NULL node.',
        },
      ],
      code: {
        python: 'def delete_node(head, target):\n    if head.val == target:\n        return head.next\n    prev = head\n    curr = head.next\n    while curr:\n        if curr.val == target:\n            prev.next = curr.next  # ← Step 1\n            curr.next = None       # ← Step 2\n            return head\n        prev = curr\n        curr = curr.next\n    return head',
        javascript: 'function deleteNode(head, target) {\n  if (head.val === target) return head.next;\n  let prev = head, curr = head.next;\n  while (curr) {\n    if (curr.val === target) {\n      prev.next = curr.next;  // ← Step 1\n      curr.next = null;       // ← Step 2\n      return head;\n    }\n    prev = curr;\n    curr = curr.next;\n  }\n  return head;\n}',
        java: 'ListNode deleteNode(ListNode head, int target) {\n  if (head.val == target) return head.next;\n  ListNode prev = head, curr = head.next;\n  while (curr != null) {\n    if (curr.val == target) {\n      prev.next = curr.next;  // ← Step 1\n      curr.next = null;       // ← Step 2\n      return head;\n    }\n    prev = curr;\n    curr = curr.next;\n  }\n  return head;\n}',
        cpp: 'ListNode* deleteNode(ListNode* head, int target) {\n  if (head->val == target) return head->next;\n  ListNode* prev = head;\n  ListNode* curr = head->next;\n  while (curr) {\n    if (curr->val == target) {\n      prev->next = curr->next;  // ← Step 1\n      curr->next = nullptr;     // ← Step 2\n      return head;\n    }\n    prev = curr;\n    curr = curr->next;\n  }\n  return head;\n}',
      },
    },
  ],
  'arrays': [
    {
      id: 'arr-swap-visual',
      title: 'Two Element Swap (Visual)',
      description: 'Swap elements at index 1 and index 3 in the array [5, 2, 8, 1].',
      visualizerType: 'array',
      initialNodes: [
        { id: '0', value: 5 },
        { id: '1', value: 2 },
        { id: '2', value: 8 },
        { id: '3', value: 1 },
      ],
      steps: [
        {
          instruction: 'Drag element at index 1 (value: 2) onto index 3 (value: 1)',
          dragSource: 'cell-1',
          dragTarget: 'cell-3',
          codeLine: 'arr[i], arr[j] = arr[j], arr[i]',
          onSuccess: 'Elements swapped! arr is now [5, 1, 8, 2].',
          onFailure: 'Swap needs to happen between index 1 and index 3.',
        },
      ],
      code: {
        python: 'arr = [5, 2, 8, 1]\ni, j = 1, 3\narr[i], arr[j] = arr[j], arr[i]  # ← Swap\nprint(arr)  # [5, 1, 8, 2]',
        javascript: 'let arr = [5, 2, 8, 1];\nlet i = 1, j = 3;\n[arr[i], arr[j]] = [arr[j], arr[i]];  // ← Swap\nconsole.log(arr);  // [5, 1, 8, 2]',
        java: 'int[] arr = {5, 2, 8, 1};\nint i = 1, j = 3;\nint temp = arr[i];\narr[i] = arr[j];  // ← Swap step 1\narr[j] = temp;    // ← Swap step 2',
        cpp: 'int arr[] = {5, 2, 8, 1};\nint i = 1, j = 3;\nstd::swap(arr[i], arr[j]);  // ← Swap',
      },
    },
  ],
};
