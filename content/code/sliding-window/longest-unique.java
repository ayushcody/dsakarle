import java.util.HashSet;
import java.util.Set;

class Solution {
    int longestUnique(String s) {
        Set<Character> seen = new HashSet<>();      // @init
        int left = 0;                               // @init
        int best = 0;                               // @init
        for (int right = 0; right < s.length(); right++) {
            while (seen.contains(s.charAt(right))) {    // @check
                seen.remove(s.charAt(left));        // @shrink
                left++;                             // @shrink
            }
            seen.add(s.charAt(right));              // @expand
            best = Math.max(best, right - left + 1);    // @record
        }
        return best;                                // @done
    }
}
