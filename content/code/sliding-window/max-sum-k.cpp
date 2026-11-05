#include <algorithm>
#include <climits>
#include <vector>

int maxSumK(const std::vector<int>& nums, int k) {
    int window = 0;                             // @init
    int best = INT_MIN;                         // @init
    int left = 0;                               // @init
    for (int right = 0; right < (int)nums.size(); right++) {
        window += nums[right];                  // @expand
        if (right - left + 1 > k) {
            window -= nums[left];               // @shrink
            left++;                             // @shrink
        }
        if (right - left + 1 == k) {
            best = std::max(best, window);      // @record
        }
    }
    return best;                                // @done
}
