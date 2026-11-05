#include <stack>

class MyQueue {
    std::stack<int> inbox;
    std::stack<int> outbox;

public:
    void push(int x) {
        inbox.push(x);
    }

    int pop() {
        int x = peek();
        outbox.pop();
        return x;
    }

    int peek() {
        if (outbox.empty()) {
            while (!inbox.empty()) {
                outbox.push(inbox.top());
                inbox.pop();
            }
        }
        return outbox.top();
    }

    bool empty() {
        return inbox.empty() && outbox.empty();
    }
};
