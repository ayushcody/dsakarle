import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    int[] maxSlidingWindow(int[] nums, int k) {
        Deque<Integer> dq = new ArrayDeque<>();                     // @init
        int[] out = new int[nums.length - k + 1];                   // @init
        for (int i = 0; i < nums.length; i++) {
            if (!dq.isEmpty() && dq.peekFirst() == i - k) {         // @expire
                dq.pollFirst();                                     // @expire
            }
            while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) { // @pop-back
                dq.pollLast();                                      // @pop-back
            }
            dq.offerLast(i);                                        // @push
            if (i >= k - 1) {
                out[i - k + 1] = nums[dq.peekFirst()];              // @record
            }
        }
        return out;                                                 // @done
    }
}
