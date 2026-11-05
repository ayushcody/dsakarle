from collections import deque


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def level_order(root):
    result = []
    queue = deque([root]) if root is not None else deque()   # @init
    while queue:                                             # @check
        size = len(queue)                                    # @level
        level = []
        for _ in range(size):
            node = queue.popleft()                           # @pop
            level.append(node.val)                           # @visit
            if node.left is not None:
                queue.append(node.left)                      # @push
            if node.right is not None:
                queue.append(node.right)                     # @push
        result.append(level)                                 # @group
    return result                                            # @done
