#include <vector>

// `data` is used as a plain fixed-size block of memory: we never call its
// own pop_back or push_back, we manage size and capacity ourselves.
class Vector {
public:
    std::vector<int> data;
    int capacity;
    int size;
    int copies = 0;

    Vector(const std::vector<int>& block, int size)
        : data(block), capacity((int)block.size()), size(size) {}   // @init

    // The caller makes sure size > 0 before popping.
    void popBack() {
        size--;                                     // @pop
        if (size * 4 <= capacity && capacity >= 4) {    // @check
            std::vector<int> smaller(capacity / 2); // @shrink
            for (int i = 0; i < size; i++) {
                smaller[i] = data[i];               // @copy
                copies++;                           // @copy
            }
            data = smaller;                         // @swap
            capacity = (int)smaller.size();         // @swap
        }
    }

    int popMany(int pops) {
        for (int k = 0; k < pops; k++) {
            popBack();
        }
        return copies;                              // @done
    }
};
