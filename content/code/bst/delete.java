class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
}

class Solution {
    TreeNode deleteNode(TreeNode root, int key) {
        TreeNode parent = null;                                  // @init
        TreeNode curr = root;                                    // @init
        while (curr != null && curr.val != key) {                // @search
            parent = curr;                                       // @walk
            curr = (key < curr.val) ? curr.left : curr.right;    // @walk
        }
        if (curr == null) {
            return root;                                         // @done
        }
        if (curr.left != null && curr.right != null) {           // @case
            parent = curr;                                       // @successor
            TreeNode succ = curr.right;                          // @successor
            while (succ.left != null) {                          // @successor
                parent = succ;                                   // @successor
                succ = succ.left;                                // @successor
            }
            curr.val = succ.val;                                 // @copy
            curr = succ;                                         // @copy
        }
        TreeNode child = (curr.left != null) ? curr.left : curr.right;   // @relink
        if (parent == null) {
            root = child;                                        // @relink
        } else if (parent.left == curr) {
            parent.left = child;                                 // @relink
        } else {
            parent.right = child;                                // @relink
        }
        return root;                                             // @done
    }
}
