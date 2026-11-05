#include <string>
#include <unordered_map>

bool isAnagram(const std::string& s, const std::string& t) {
    if (s.size() != t.size()) {                        // @lengths
        return false;                                  // @done
    }
    std::unordered_map<char, int> counts;              // @init
    for (char ch : s) {
        counts[ch]++;                                  // @count
    }
    for (char ch : t) {
        auto it = counts.find(ch);                     // @check
        if (it == counts.end() || it->second == 0) {   // @check
            return false;                              // @done
        }
        it->second--;                                  // @spend
    }
    return true;                                       // @done
}
