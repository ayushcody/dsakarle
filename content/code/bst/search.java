class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
}

class Solution {
    TreeNode searchBST(TreeNode root, int key) {
        TreeNode curr = root;                  // @init
        while (curr != null) {
            if (key == curr.val) {             // @compare
                return curr;                   // @done
            }
            if (key < curr.val) {              // @compare
                curr = curr.left;              // @left
            } else {
                curr = curr.right;             // @right
            }
        }
        return null;                           // @done
    }
}
