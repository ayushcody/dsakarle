class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def dfs(node, order, out):
    if node is None:                                    # @base
        return                                          # @base
    if order == "pre": out.append(node.val)            # @visit
    dfs(node.left, order, out)                          # @left
    if order == "in": out.append(node.val)             # @visit
    dfs(node.right, order, out)                         # @right
    if order == "post": out.append(node.val)           # @visit
    return                                              # @back


def dfs_order(root, order):
    out = []
    dfs(root, order, out)                               # @init
    return out                                          # @done
