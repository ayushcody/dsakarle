#include <algorithm>
#include <climits>
#include <vector>

int eraseOverlapIntervals(std::vector<std::vector<int>> intervals) {
    auto byEnd = [](const std::vector<int>& a, const std::vector<int>& b) { return a[1] < b[1]; };
    std::stable_sort(intervals.begin(), intervals.end(), byEnd);    // @sort
    int removed = 0;                                // @init
    int lastEnd = INT_MIN;                          // @init
    for (const auto& iv : intervals) {
        int start = iv[0];
        int end = iv[1];
        if (start >= lastEnd) {                     // @check
            lastEnd = end;                          // @keep
        } else {
            removed++;                              // @drop
        }
    }
    return removed;                                 // @done
}
