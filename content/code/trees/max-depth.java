class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}

class Solution {
    int maxDepth(TreeNode root) {
        return depth(root);                         // @init
    }

    private int depth(TreeNode node) {
        if (node == null) {                         // @base
            return 0;                               // @base
        }
        int left = depth(node.left);                // @left
        int right = depth(node.right);              // @right
        return 1 + Math.max(left, right);           // @combine
    }
}
