#include <algorithm>
#include <vector>

int containerWater(const std::vector<int>& height) {
    int left = 0;                               // @init
    int right = (int)height.size() - 1;         // @init
    int best = 0;                               // @init
    while (left < right) {
        int area = std::min(height[left], height[right]) * (right - left);  // @measure
        best = std::max(best, area);            // @record
        if (height[left] < height[right]) {     // @move-left
            left++;                             // @move-left
        } else {
            right--;                            // @move-right
        }
    }
    return best;                                // @done
}
