import java.util.ArrayList;
import java.util.List;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}

class Solution {
    List<Integer> dfsOrder(TreeNode root, String order) {
        List<Integer> out = new ArrayList<>();
        dfs(root, order, out);                              // @init
        return out;                                         // @done
    }

    private void dfs(TreeNode node, String order, List<Integer> out) {
        if (node == null) {                                 // @base
            return;                                         // @base
        }
        if (order.equals("pre")) out.add(node.val);         // @visit
        dfs(node.left, order, out);                         // @left
        if (order.equals("in")) out.add(node.val);          // @visit
        dfs(node.right, order, out);                        // @right
        if (order.equals("post")) out.add(node.val);        // @visit
        return;                                             // @back
    }
}
