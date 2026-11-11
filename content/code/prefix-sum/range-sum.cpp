#include <vector>

class NumArray {
public:
    explicit NumArray(const std::vector<int>& nums) {
        prefix.assign(nums.size() + 1, 0);                    // @init
        for (int i = 0; i < static_cast<int>(nums.size()); i++) {
            prefix[i + 1] = prefix[i] + nums[i];              // @build
        }
    }

    int sumRange(int left, int right) const {
        return prefix[right + 1] - prefix[left];              // @query
    }

private:
    std::vector<int> prefix;
};
