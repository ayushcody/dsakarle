#include <algorithm>
#include <vector>

std::vector<std::vector<int>> mergeIntervals(std::vector<std::vector<int>> intervals) {
    std::sort(intervals.begin(), intervals.end(),
              [](const std::vector<int>& a, const std::vector<int>& b) { return a[0] < b[0]; });
    std::vector<std::vector<int>> merged;
    for (const std::vector<int>& interval : intervals) {
        if (!merged.empty() && interval[0] <= merged.back()[1]) {
            merged.back()[1] = std::max(merged.back()[1], interval[1]);
        } else {
            merged.push_back({interval[0], interval[1]});
        }
    }
    return merged;
}
