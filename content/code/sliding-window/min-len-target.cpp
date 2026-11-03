#include <algorithm>
#include <climits>
#include <vector>

int minLenTarget(const std::vector<int>& nums, int target) {
    int window = 0;                             // @init
    int best = INT_MAX;                         // @init
    int left = 0;                               // @init
    for (int right = 0; right < (int)nums.size(); right++) {
        window += nums[right];                  // @expand
        while (window >= target) {              // @check
            best = std::min(best, right - left + 1);  // @record
            window -= nums[left];               // @shrink
            left++;                             // @shrink
        }
    }
    return best == INT_MAX ? 0 : best;          // @done
}
