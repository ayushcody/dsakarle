import java.util.Collections;
import java.util.PriorityQueue;

class Solution {
    int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());   // max-heap
        for (int stone : stones) {
            heap.offer(stone);
        }
        while (heap.size() > 1) {
            int first = heap.poll();     // heaviest
            int second = heap.poll();    // second heaviest
            if (first != second) {
                heap.offer(first - second);
            }
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}
