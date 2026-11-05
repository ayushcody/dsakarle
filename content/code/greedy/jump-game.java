class Solution {
    boolean canJump(int[] nums) {
        int last = nums.length - 1;                 // @init
        int reach = 0;                              // @init
        for (int i = 0; i <= last; i++) {
            if (i > reach) {                        // @check
                break;                              // @stuck
            }
            reach = Math.max(reach, i + nums[i]);   // @extend
            if (reach >= last) {                    // @done
                break;
            }
        }
        return reach >= last;                       // @done
    }
}
