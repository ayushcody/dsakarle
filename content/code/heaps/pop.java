import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class Solution {
    int siftDown(List<Integer> heap, int i) {
        int n = heap.size();
        while (2 * i + 1 < n) {
            int child = 2 * i + 1;                                          // @children
            if (child + 1 < n && heap.get(child + 1) < heap.get(child)) {   // @children
                child++;                                                    // @children
            }
            if (heap.get(child) >= heap.get(i)) {                           // @compare
                break;
            }
            Collections.swap(heap, i, child);                               // @swap
            i = child;                                                      // @swap
        }
        return i;                                                           // @settle
    }

    int pop(List<Integer> heap) {
        int smallest = heap.get(0);                                         // @take
        int last = heap.remove(heap.size() - 1);                            // @move
        if (!heap.isEmpty()) {
            heap.set(0, last);                                              // @move
            siftDown(heap, 0);
        }
        return smallest;
    }

    List<Integer> popMany(List<Integer> heap, int pops) {
        List<Integer> popped = new ArrayList<>();                           // @init
        for (int t = 0; t < pops; t++) {
            popped.add(pop(heap));
        }
        return popped;                                                      // @done
    }
}
