class Solution {
    int access(int[] nums, int i) {
        int base = 1000, size = 4;                // @init
        if (i < 0 || i >= nums.length) {          // @check
            throw new IndexOutOfBoundsException("index out of range");  // @check
        }
        int address = base + i * size;            // @address
        return nums[(address - base) / size];     // @read
    }
}
