#include <queue>
#include <vector>

int lastStoneWeight(const std::vector<int>& stones) {
    std::priority_queue<int> heap(stones.begin(), stones.end());   // default is a max-heap
    while (heap.size() > 1) {
        int first = heap.top();      // heaviest
        heap.pop();
        int second = heap.top();     // second heaviest
        heap.pop();
        if (first != second) {
            heap.push(first - second);
        }
    }
    return heap.empty() ? 0 : heap.top();
}
