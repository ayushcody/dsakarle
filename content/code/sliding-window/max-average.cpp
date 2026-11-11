#include <algorithm>
#include <vector>

double findMaxAverage(const std::vector<int>& nums, int k) {
    int window = 0;
    for (int i = 0; i < k; i++) {
        window += nums[i];
    }
    int best = window;
    for (int right = k; right < (int)nums.size(); right++) {
        window += nums[right] - nums[right - k];
        best = std::max(best, window);
    }
    return (double)best / k;
}
