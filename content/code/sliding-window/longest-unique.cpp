#include <algorithm>
#include <string>
#include <unordered_set>

int longestUnique(const std::string& s) {
    std::unordered_set<char> seen;              // @init
    int left = 0;                               // @init
    int best = 0;                               // @init
    for (int right = 0; right < (int)s.size(); right++) {
        while (seen.count(s[right])) {          // @check
            seen.erase(s[left]);                // @shrink
            left++;                             // @shrink
        }
        seen.insert(s[right]);                  // @expand
        best = std::max(best, right - left + 1);    // @record
    }
    return best;                                // @done
}
