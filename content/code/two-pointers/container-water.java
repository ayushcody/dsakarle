class Solution {
    int containerWater(int[] height) {
        int left = 0;                           // @init
        int right = height.length - 1;          // @init
        int best = 0;                           // @init
        while (left < right) {
            int area = Math.min(height[left], height[right]) * (right - left);  // @measure
            best = Math.max(best, area);        // @record
            if (height[left] < height[right]) { // @move-left
                left++;                         // @move-left
            } else {
                right--;                        // @move-right
            }
        }
        return best;                            // @done
    }
}
