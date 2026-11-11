#include <utility>
#include <vector>

int siftDown(std::vector<int>& heap, int i) {
    int n = (int)heap.size();
    while (2 * i + 1 < n) {
        int child = 2 * i + 1;                                  // @children
        if (child + 1 < n && heap[child + 1] < heap[child]) {   // @children
            child++;                                            // @children
        }
        if (heap[child] >= heap[i]) {                           // @compare
            break;
        }
        std::swap(heap[i], heap[child]);                        // @swap
        i = child;                                              // @swap
    }
    return i;                                                   // @settle
}

int pop(std::vector<int>& heap) {
    int smallest = heap[0];                                     // @take
    int last = heap.back();                                     // @move
    heap.pop_back();                                            // @move
    if (!heap.empty()) {
        heap[0] = last;                                         // @move
        siftDown(heap, 0);
    }
    return smallest;
}

std::vector<int> popMany(std::vector<int>& heap, int pops) {
    std::vector<int> popped;                                    // @init
    for (int t = 0; t < pops; t++) {
        popped.push_back(pop(heap));
    }
    return popped;                                              // @done
}
