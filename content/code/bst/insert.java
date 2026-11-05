class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
}

class Solution {
    TreeNode insertIntoBST(TreeNode root, int val) {
        TreeNode node = new TreeNode(val);     // @init
        if (root == null) {
            return node;                       // @link
        }
        TreeNode parent = null;                // @init
        TreeNode curr = root;                  // @init
        while (curr != null) {
            if (val < curr.val) {              // @compare
                parent = curr;                 // @left
                curr = curr.left;              // @left
            } else {
                parent = curr;                 // @right
                curr = curr.right;             // @right
            }
        }
        if (val < parent.val) {                // @link
            parent.left = node;                // @link
        } else {
            parent.right = node;               // @link
        }
        return root;                           // @done
    }
}
