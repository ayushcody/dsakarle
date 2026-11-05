class Solution {
    int[] data;
    int capacity;
    int size = 0;
    int copies = 0;

    Solution(int capacity) {
        this.data = new int[capacity];              // @init
        this.capacity = capacity;                   // @init
    }

    void pushBack(int value) {
        if (size == capacity) {                     // @room
            int[] bigger = new int[Math.max(1, 2 * capacity)];  // @grow
            for (int i = 0; i < size; i++) {
                bigger[i] = data[i];                // @copy
                copies++;                           // @copy
            }
            data = bigger;                          // @swap
            capacity = bigger.length;               // @swap
        }
        data[size] = value;                         // @write
        size++;                                     // @write
    }

    int pushAll(int[] values) {
        for (int value : values) {
            pushBack(value);
        }
        return copies;                              // @done
    }
}
