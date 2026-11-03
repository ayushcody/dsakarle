#include <string>
#include <unordered_map>

bool isAnagram(const std::string& s, const std::string& t) {
    if (s.size() != t.size()) {
        return false;
    }
    std::unordered_map<char, int> counts;
    for (char ch : s) {
        counts[ch]++;
    }
    for (char ch : t) {
        auto it = counts.find(ch);
        if (it == counts.end() || it->second == 0) {
            return false;
        }
        it->second--;
    }
    return true;
}
