import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;

class Solution {
    boolean isValid(String s) {
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
        Deque<Character> stack = new ArrayDeque<>();      // @init
        for (char ch : s.toCharArray()) {
            if (pairs.containsKey(ch)) {
                if (stack.isEmpty() || !stack.peek().equals(pairs.get(ch))) {   // @check
                    return false;                         // @check
                }
                stack.pop();                              // @pop
            } else {
                stack.push(ch);                           // @push
            }
        }
        return stack.isEmpty();                           // @done
    }
}
