import java.util.HashMap;
import java.util.Map;

class Solution {
    boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) {                        // @lengths
            return false;                                      // @done
        }
        Map<Character, Integer> counts = new HashMap<>();      // @init
        for (char ch : s.toCharArray()) {
            counts.put(ch, counts.getOrDefault(ch, 0) + 1);    // @count
        }
        for (char ch : t.toCharArray()) {
            if (counts.getOrDefault(ch, 0) == 0) {             // @check
                return false;                                  // @done
            }
            counts.put(ch, counts.get(ch) - 1);                // @spend
        }
        return true;                                           // @done
    }
}
