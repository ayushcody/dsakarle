import java.util.ArrayList;
import java.util.List;

class Solution {
    private int[] nums;
    private int limit;
    private List<List<Integer>> res;
    private List<Integer> path;

    List<List<Integer>> subsets(int[] nums, int limit) {
        this.nums = nums;
        this.limit = limit;
        res = new ArrayList<>();                        // @init
        path = new ArrayList<>();                       // @init
        explore(0);                                     // @init
        return res;                                     // @done
    }

    private void explore(int i) {
        if (i == nums.length) {                         // @found
            res.add(new ArrayList<>(path));             // @found
            return;                                     // @found
        }
        if (path.size() < limit) {                      // @prune
            path.add(nums[i]);                          // @choose
            explore(i + 1);                             // @explore
            path.remove(path.size() - 1);               // @unchoose
        }
        explore(i + 1);                                 // @skip
    }
}
