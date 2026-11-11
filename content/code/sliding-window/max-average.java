class Solution {
    double findMaxAverage(int[] nums, int k) {
        int window = 0;
        for (int i = 0; i < k; i++) {
            window += nums[i];
        }
        int best = window;
        for (int right = k; right < nums.length; right++) {
            window += nums[right] - nums[right - k];
            best = Math.max(best, window);
        }
        return (double) best / k;
    }
}
