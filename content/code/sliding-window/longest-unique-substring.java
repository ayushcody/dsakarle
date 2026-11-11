import java.util.HashSet;
import java.util.Set;

class Solution {
    int lengthOfLongestSubstring(String s) {
        Set<Character> seen = new HashSet<>();
        int left = 0;
        int best = 0;
        for (int right = 0; right < s.length(); right++) {
            while (seen.contains(s.charAt(right))) {
                seen.remove(s.charAt(left));
                left++;
            }
            seen.add(s.charAt(right));
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
