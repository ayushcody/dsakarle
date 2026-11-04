import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}

class Solution {
    List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        Queue<TreeNode> queue = new ArrayDeque<>();         // @init
        if (root != null) queue.add(root);                  // @init
        while (!queue.isEmpty()) {                          // @check
            int size = queue.size();                        // @level
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();               // @pop
                level.add(node.val);                        // @visit
                if (node.left != null) queue.add(node.left);    // @push
                if (node.right != null) queue.add(node.right);  // @push
            }
            result.add(level);                              // @group
        }
        return result;                                      // @done
    }
}
