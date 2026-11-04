#include <utility>
#include <vector>

int push(std::vector<int>& heap, int value) {
    heap.push_back(value);                                  // @append
    int i = (int)heap.size() - 1;
    while (i > 0 && heap[(i - 1) / 2] > heap[i]) {          // @compare
        int parent = (i - 1) / 2;                           // @swap
        std::swap(heap[i], heap[parent]);                   // @swap
        i = parent;                                         // @swap
    }
    return i;                                               // @settle
}

std::vector<int> buildByPushing(const std::vector<int>& values) {
    std::vector<int> heap;                                  // @init
    for (int value : values) {
        push(heap, value);
    }
    return heap;                                            // @done
}
