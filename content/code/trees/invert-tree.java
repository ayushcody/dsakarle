class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}

class Solution {
    TreeNode invertTree(TreeNode root) {
        if (root == null) {
            return null;
        }
        TreeNode swap = root.left;
        root.left = root.right;
        root.right = swap;
        invertTree(root.left);
        invertTree(root.right);
        return root;
    }
}
