class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def check(node, lo, hi):
    if node is None:
        return True
    if lo is not None and node.val <= lo:
        return False
    if hi is not None and node.val >= hi:
        return False
    return check(node.left, lo, node.val) and check(node.right, node.val, hi)


def is_valid_bst(root):
    return check(root, None, None)
