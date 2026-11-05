class Solution {
    int[] getConcatenation(int[] nums) {
        int n = nums.length;
        int[] ans = new int[2 * n];          // ask for all 2n slots once: no resizing
        for (int i = 0; i < n; i++) {
            ans[i] = nums[i];
            ans[i + n] = nums[i];
        }
        return ans;
    }
}
