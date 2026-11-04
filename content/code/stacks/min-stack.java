import java.util.ArrayDeque;
import java.util.Deque;

class MinStack {
    // each entry is {value, smallest value at or below it}
    private final Deque<int[]> stack = new ArrayDeque<>();

    public void push(int val) {
        int smallest = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[] {val, smallest});
    }

    public void pop() {
        stack.pop();
    }

    public int top() {
        return stack.peek()[0];
    }

    public int getMin() {
        return stack.peek()[1];
    }
}
