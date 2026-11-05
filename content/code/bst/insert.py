class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def insert_into_bst(root, val):
    node = TreeNode(val)                     # @init
    if root is None:
        return node                          # @link
    parent, curr = None, root                # @init
    while curr is not None:
        if val < curr.val:                   # @compare
            parent, curr = curr, curr.left   # @left
        else:
            parent, curr = curr, curr.right  # @right
    if val < parent.val:                     # @link
        parent.left = node                   # @link
    else:
        parent.right = node                  # @link
    return root                              # @done
