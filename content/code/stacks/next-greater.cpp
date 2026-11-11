#include <stack>
#include <vector>

std::vector<int> dailyTemperatures(const std::vector<int>& temps) {
    std::vector<int> answer(temps.size(), 0);             // @init
    std::stack<int> stack;                                // @init
    for (int i = 0; i < (int)temps.size(); i++) {
        while (!stack.empty() && temps[stack.top()] < temps[i]) {   // @compare
            int j = stack.top();                          // @pop
            stack.pop();                                  // @pop
            answer[j] = i - j;                            // @pop
        }
        stack.push(i);                                    // @push
    }
    return answer;                                        // @done
}
