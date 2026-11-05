#include <cctype>
#include <string>

bool isPalindrome(const std::string& s) {
    int left = 0;                                                       // @init
    int right = (int)s.size() - 1;                                      // @init
    while (left < right) {
        if (!std::isalnum((unsigned char)s[left])) {                    // @skip
            left++;                                                     // @skip
        } else if (!std::isalnum((unsigned char)s[right])) {            // @skip
            right--;                                                    // @skip
        } else if (std::tolower((unsigned char)s[left])                 // @compare
                   != std::tolower((unsigned char)s[right])) {          // @compare
            return false;                                               // @done
        } else {
            left++;                                                     // @match
            right--;                                                    // @match
        }
    }
    return true;                                                        // @done
}
