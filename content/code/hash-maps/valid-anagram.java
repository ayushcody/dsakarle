import java.util.HashMap;
import java.util.Map;

class Solution {
    boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }
        Map<Character, Integer> counts = new HashMap<>();
        for (char ch : s.toCharArray()) {
            counts.put(ch, counts.getOrDefault(ch, 0) + 1);
        }
        for (char ch : t.toCharArray()) {
            if (counts.getOrDefault(ch, 0) == 0) {
                return false;
            }
            counts.put(ch, counts.get(ch) - 1);
        }
        return true;
    }
}
