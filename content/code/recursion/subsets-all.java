import java.util.ArrayList;
import java.util.List;

class Solution {
    private int[] nums;
    private List<List<Integer>> res;
    private List<Integer> path;

    List<List<Integer>> subsets(int[] nums) {
        this.nums = nums;
        res = new ArrayList<>();
        path = new ArrayList<>();
        backtrack(0);
        return res;
    }

    private void backtrack(int start) {
        res.add(new ArrayList<>(path));
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);
            backtrack(i + 1);
            path.remove(path.size() - 1);
        }
    }
}
