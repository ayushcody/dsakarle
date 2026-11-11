class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def depth(node):
    if node is None:                      # @base
        return 0                          # @base
    left = depth(node.left)               # @left
    right = depth(node.right)             # @right
    return 1 + max(left, right)           # @combine


def max_depth(root):
    return depth(root)                    # @init
