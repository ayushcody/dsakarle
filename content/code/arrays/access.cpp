#include <stdexcept>
#include <vector>

int access(const std::vector<int>& nums, int i) {
    int base = 1000, size = 4;                    // @init
    if (i < 0 || i >= (int)nums.size()) {         // @check
        throw std::out_of_range("index out of range");  // @check
    }
    int address = base + i * size;                // @address
    return nums[(address - base) / size];         // @read
}
