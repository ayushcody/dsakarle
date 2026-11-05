import java.util.ArrayDeque;
import java.util.Deque;

class MyQueue {
    Deque<Integer> inbox = new ArrayDeque<>();
    Deque<Integer> outbox = new ArrayDeque<>();

    void push(int x) {
        inbox.push(x);
    }

    int pop() {
        peek();
        return outbox.pop();
    }

    int peek() {
        if (outbox.isEmpty()) {
            while (!inbox.isEmpty()) {
                outbox.push(inbox.pop());
            }
        }
        return outbox.peek();
    }

    boolean empty() {
        return inbox.isEmpty() && outbox.isEmpty();
    }
}
