import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    int largestRectangle(int[] heights) {
        int best = 0;                                     // @init
        Deque<Integer> stack = new ArrayDeque<>();        // @init
        int n = heights.length;
        for (int i = 0; i <= n; i++) {
            int h = i < n ? heights[i] : 0;               // @flush
            while (!stack.isEmpty() && heights[stack.peek()] > h) {   // @compare
                int j = stack.pop();                      // @pop
                int left = stack.isEmpty() ? 0 : stack.peek() + 1;   // @pop
                best = Math.max(best, heights[j] * (i - left));      // @measure
            }
            stack.push(i);                                // @push
        }
        return best;                                      // @done
    }
}
