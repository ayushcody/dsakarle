import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    int[] dailyTemperatures(int[] temps) {
        int[] answer = new int[temps.length];             // @init
        Deque<Integer> stack = new ArrayDeque<>();        // @init
        for (int i = 0; i < temps.length; i++) {
            while (!stack.isEmpty() && temps[stack.peek()] < temps[i]) {   // @compare
                int j = stack.pop();                      // @pop
                answer[j] = i - j;                        // @pop
            }
            stack.push(i);                                // @push
        }
        return answer;                                    // @done
    }
}
