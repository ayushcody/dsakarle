#include <algorithm>
#include <vector>

int maxArea(const std::vector<int>& height) {
    int left = 0;
    int right = (int)height.size() - 1;
    int best = 0;
    while (left < right) {
        int width = right - left;
        best = std::max(best, width * std::min(height[left], height[right]));
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return best;
}
