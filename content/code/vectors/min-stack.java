import java.util.ArrayList;
import java.util.List;

class MinStack {
    private final List<Integer> items = new ArrayList<>();   // the stack: add at the back, remove from the back
    private final List<Integer> mins = new ArrayList<>();    // mins.get(k) is the smallest of items 0..k

    void push(int val) {
        items.add(val);
        int smallest = mins.isEmpty() ? val : Math.min(val, mins.get(mins.size() - 1));
        mins.add(smallest);
    }

    void pop() {
        items.remove(items.size() - 1);
        mins.remove(mins.size() - 1);
    }

    int top() {
        return items.get(items.size() - 1);
    }

    int getMin() {
        return mins.get(mins.size() - 1);
    }
}
