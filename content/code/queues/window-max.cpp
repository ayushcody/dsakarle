#include <deque>
#include <vector>

std::vector<int> maxSlidingWindow(const std::vector<int>& nums, int k) {
    std::deque<int> dq;                                     // @init
    std::vector<int> out;                                   // @init
    for (int i = 0; i < (int)nums.size(); i++) {
        if (!dq.empty() && dq.front() == i - k) {           // @expire
            dq.pop_front();                                 // @expire
        }
        while (!dq.empty() && nums[dq.back()] < nums[i]) {  // @pop-back
            dq.pop_back();                                  // @pop-back
        }
        dq.push_back(i);                                    // @push
        if (i >= k - 1) {
            out.push_back(nums[dq.front()]);                // @record
        }
    }
    return out;                                             // @done
}
