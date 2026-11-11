#include <algorithm>
#include <stack>
#include <utility>

class MinStack {
public:
    void push(int val) {
        int smallest = stack.empty() ? val : std::min(val, stack.top().second);
        stack.push({val, smallest});
    }

    void pop() {
        stack.pop();
    }

    int top() {
        return stack.top().first;
    }

    int getMin() {
        return stack.top().second;
    }

private:
    // each entry is {value, smallest value at or below it}
    std::stack<std::pair<int, int>> stack;
};
