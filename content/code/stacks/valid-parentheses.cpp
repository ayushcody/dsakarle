#include <stack>
#include <string>
#include <unordered_map>

bool isValid(const std::string& s) {
    std::unordered_map<char, char> pairs = {{')', '('}, {']', '['}, {'}', '{'}};
    std::stack<char> stack;                               // @init
    for (char ch : s) {
        if (pairs.count(ch)) {
            if (stack.empty() || stack.top() != pairs[ch]) {   // @check
                return false;                             // @check
            }
            stack.pop();                                  // @pop
        } else {
            stack.push(ch);                               // @push
        }
    }
    return stack.empty();                                 // @done
}
