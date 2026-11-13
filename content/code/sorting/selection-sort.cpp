#include <utility>
#include <vector>

std::vector<int> selectionSort(std::vector<int> nums) {
    int n = (int)nums.size();                   // @init
    for (int i = 0; i < n - 1; i++) {
        int lowest = i;                         // @outer
        for (int j = i + 1; j < n; j++) {
            if (nums[j] < nums[lowest]) {       // @scan
                lowest = j;                     // @newmin
            }
        }
        std::swap(nums[i], nums[lowest]);       // @swap
    }
    return nums;                                // @done
}
