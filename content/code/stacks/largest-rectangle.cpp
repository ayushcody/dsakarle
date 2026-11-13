#include <algorithm>
#include <stack>
#include <vector>

int largestRectangle(const std::vector<int>& heights) {
    int best = 0;                                         // @init
    std::stack<int> stack;                                // @init
    int n = (int)heights.size();
    for (int i = 0; i <= n; i++) {
        int h = i < n ? heights[i] : 0;                   // @flush
        while (!stack.empty() && heights[stack.top()] > h) {   // @compare
            int j = stack.top();                          // @pop
            stack.pop();                                  // @pop
            int left = stack.empty() ? 0 : stack.top() + 1;    // @pop
            best = std::max(best, heights[j] * (i - left));    // @measure
        }
        stack.push(i);                                    // @push
    }
    return best;                                          // @done
}
