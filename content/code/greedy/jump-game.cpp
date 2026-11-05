#include <algorithm>
#include <vector>

bool canJump(const std::vector<int>& nums) {
    int last = (int)nums.size() - 1;                // @init
    int reach = 0;                                  // @init
    for (int i = 0; i <= last; i++) {
        if (i > reach) {                            // @check
            break;                                  // @stuck
        }
        reach = std::max(reach, i + nums[i]);       // @extend
        if (reach >= last) {                        // @done
            break;
        }
    }
    return reach >= last;                           // @done
}
