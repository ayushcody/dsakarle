import java.util.PriorityQueue;

class Solution {
    int kthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();   // @init
        for (int num : nums) {
            heap.offer(num);                                    // @push
            if (heap.size() > k) {
                heap.poll();                                    // @pop
            }
        }
        return heap.peek();                                     // @done
    }
}
