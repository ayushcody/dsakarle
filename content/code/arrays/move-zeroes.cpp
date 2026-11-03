#include <utility>
#include <vector>

void moveZeroes(std::vector<int>& nums) {
    int write = 0;
    for (int read = 0; read < (int)nums.size(); read++) {
        if (nums[read] != 0) {
            std::swap(nums[write], nums[read]);
            write++;
        }
    }
}
