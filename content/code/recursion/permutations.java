import java.util.ArrayList;
import java.util.List;

class Solution {
    private int[] nums;
    private boolean[] used;
    private List<List<Integer>> res;
    private List<Integer> path;

    List<List<Integer>> permute(int[] nums) {
        this.nums = nums;
        used = new boolean[nums.length];
        res = new ArrayList<>();
        path = new ArrayList<>();
        backtrack();
        return res;
    }

    private void backtrack() {
        if (path.size() == nums.length) {
            res.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) {
                continue;
            }
            used[i] = true;
            path.add(nums[i]);
            backtrack();
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
