#include <cctype>
#include <string>

bool isPalindrome(const std::string& s) {
    int left = 0;
    int right = (int)s.size() - 1;
    while (left < right) {
        while (left < right && !std::isalnum((unsigned char)s[left])) {
            left++;
        }
        while (left < right && !std::isalnum((unsigned char)s[right])) {
            right--;
        }
        if (std::tolower((unsigned char)s[left]) != std::tolower((unsigned char)s[right])) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}
