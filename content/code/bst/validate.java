class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}

class Solution {
    boolean check(TreeNode node, Integer lo, Integer hi) {
        if (node == null) {
            return true;
        }
        if (lo != null && node.val <= lo) {
            return false;
        }
        if (hi != null && node.val >= hi) {
            return false;
        }
        return check(node.left, lo, node.val) && check(node.right, node.val, hi);
    }

    boolean isValidBST(TreeNode root) {
        return check(root, null, null);
    }
}
