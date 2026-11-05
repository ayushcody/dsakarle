#include <optional>
#include <stack>
#include <string>
#include <vector>

std::vector<std::optional<int>> runOps(const std::vector<std::string>& ops, const std::vector<int>& values) {
    std::stack<int> stack;                                // @init
    std::vector<std::optional<int>> outputs;              // @init
    for (int i = 0; i < (int)ops.size(); i++) {
        if (ops[i] == "push") {
            stack.push(values[i]);                        // @push
        } else if (stack.empty()) {
            outputs.push_back(std::nullopt);              // @underflow
        } else if (ops[i] == "pop") {
            outputs.push_back(stack.top());               // @pop
            stack.pop();                                  // @pop
        } else {
            outputs.push_back(stack.top());               // @peek
        }
    }
    return outputs;                                       // @done
}
