#include <algorithm>
#include <vector>

class MinStack {
public:
    void push(int val) {
        items.push_back(val);
        int smallest = mins.empty() ? val : std::min(val, mins.back());
        mins.push_back(smallest);
    }

    void pop() {
        items.pop_back();
        mins.pop_back();
    }

    int top() { return items.back(); }

    int getMin() { return mins.back(); }

private:
    std::vector<int> items;   // the stack: push_back and pop_back on a vector
    std::vector<int> mins;    // mins[k] is the smallest of items[0..k]
};
