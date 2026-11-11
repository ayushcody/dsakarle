#include <functional>
#include <queue>
#include <vector>

int kthLargest(const std::vector<int>& nums, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;   // @init
    for (int num : nums) {
        heap.push(num);                                     // @push
        if ((int)heap.size() > k) {
            heap.pop();                                     // @pop
        }
    }
    return heap.top();                                      // @done
}
