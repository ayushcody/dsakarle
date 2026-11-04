class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def delete_node(root, key):
    parent, curr = None, root                                    # @init
    while curr is not None and curr.val != key:                  # @search
        parent = curr                                            # @walk
        curr = curr.left if key < curr.val else curr.right       # @walk
    if curr is None:
        return root                                              # @done
    if curr.left is not None and curr.right is not None:         # @case
        parent, succ = curr, curr.right                          # @successor
        while succ.left is not None:                             # @successor
            parent, succ = succ, succ.left                       # @successor
        curr.val = succ.val                                      # @copy
        curr = succ                                              # @copy
    child = curr.left if curr.left is not None else curr.right   # @relink
    if parent is None:
        root = child                                             # @relink
    elif parent.left is curr:
        parent.left = child                                      # @relink
    else:
        parent.right = child                                     # @relink
    return root                                                  # @done
