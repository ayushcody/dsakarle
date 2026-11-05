#include <algorithm>
#include <vector>

// `data` is used as a plain fixed-size block of memory: we never call its
// own push_back, we manage size and capacity ourselves.
class Vector {
public:
    std::vector<int> data;
    int capacity;
    int size = 0;
    int copies = 0;

    explicit Vector(int capacity)
        : data(capacity), capacity(capacity) {}     // @init

    void pushBack(int value) {
        if (size == capacity) {                     // @room
            std::vector<int> bigger(std::max(1, 2 * capacity));  // @grow
            for (int i = 0; i < size; i++) {
                bigger[i] = data[i];                // @copy
                copies++;                           // @copy
            }
            data = bigger;                          // @swap
            capacity = (int)bigger.size();          // @swap
        }
        data[size] = value;                         // @write
        size++;                                     // @write
    }

    int pushAll(const std::vector<int>& values) {
        for (int value : values) {
            pushBack(value);
        }
        return copies;                              // @done
    }
};
