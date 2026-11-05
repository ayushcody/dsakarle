#include <algorithm>
#include <vector>

int minEatingSpeed(const std::vector<int>& piles, int h) {
    int lo = 1;
    int hi = *std::max_element(piles.begin(), piles.end());
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        long long hours = 0;
        for (int pile : piles) {
            hours += ((long long)pile + mid - 1) / mid;
        }
        if (hours <= h) {
            hi = mid;
        } else {
            lo = mid + 1;
        }
    }
    return lo;
}
