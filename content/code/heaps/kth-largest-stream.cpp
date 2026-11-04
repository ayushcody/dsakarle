#include <functional>
#include <queue>
#include <vector>

class KthLargest {
public:
    KthLargest(int k, const std::vector<int>& nums) : k_(k) {
        for (int num : nums) {
            add(num);
        }
    }

    int add(int val) {
        heap_.push(val);
        if ((int)heap_.size() > k_) {
            heap_.pop();
        }
        return heap_.top();
    }

private:
    int k_;
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap_;
};
