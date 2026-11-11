import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

class Solution {
    List<Integer> runOps(String[] ops, int[] values) {
        Deque<Integer> stack = new ArrayDeque<>();        // @init
        List<Integer> outputs = new ArrayList<>();        // @init
        for (int i = 0; i < ops.length; i++) {
            if (ops[i].equals("push")) {
                stack.push(values[i]);                    // @push
            } else if (stack.isEmpty()) {
                outputs.add(null);                        // @underflow
            } else if (ops[i].equals("pop")) {
                outputs.add(stack.pop());                 // @pop
            } else {
                outputs.add(stack.peek());                // @peek
            }
        }
        return outputs;                                   // @done
    }
}
