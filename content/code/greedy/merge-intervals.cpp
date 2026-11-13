#include <algorithm>
#include <vector>

std::vector<std::vector<int>> merge(std::vector<std::vector<int>> intervals) {
    auto byStart = [](const std::vector<int>& a, const std::vector<int>& b) { return a[0] < b[0]; };
    std::stable_sort(intervals.begin(), intervals.end(), byStart);  // @sort
    std::vector<std::vector<int>> merged;
    merged.push_back({intervals[0][0], intervals[0][1]});           // @start
    for (size_t i = 1; i < intervals.size(); i++) {
        int start = intervals[i][0];
        int end = intervals[i][1];
        if (start <= merged.back()[1]) {            // @check
            merged.back()[1] = std::max(merged.back()[1], end);     // @extend
        } else {
            merged.push_back({start, end});         // @push
        }
    }
    return merged;                                  // @done
}
