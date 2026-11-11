class Solution {
    int[] data;
    int capacity;
    int size;
    int copies = 0;

    Solution(int[] data, int size) {
        this.data = data;                           // @init
        this.capacity = data.length;                // @init
        this.size = size;                           // @init
    }

    // The caller makes sure size > 0 before popping.
    void popBack() {
        size--;                                     // @pop
        if (size * 4 <= capacity && capacity >= 4) {    // @check
            int[] smaller = new int[capacity / 2];  // @shrink
            for (int i = 0; i < size; i++) {
                smaller[i] = data[i];               // @copy
                copies++;                           // @copy
            }
            data = smaller;                         // @swap
            capacity = smaller.length;              // @swap
        }
    }

    int popMany(int pops) {
        for (int k = 0; k < pops; k++) {
            popBack();
        }
        return copies;                              // @done
    }
}
