#include <algorithm>
#include <string>
#include <unordered_set>

int lengthOfLongestSubstring(const std::string& s) {
    std::unordered_set<char> seen;
    int left = 0;
    int best = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        while (seen.count(s[right])) {
            seen.erase(s[left]);
            left++;
        }
        seen.insert(s[right]);
        best = std::max(best, right - left + 1);
    }
    return best;
}
