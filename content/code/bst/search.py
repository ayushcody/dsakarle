class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def search_bst(root, key):
    curr = root                          # @init
    while curr is not None:
        if key == curr.val:              # @compare
            return curr                  # @done
        if key < curr.val:               # @compare
            curr = curr.left             # @left
        else:
            curr = curr.right            # @right
    return None                          # @done
