import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class Solution {
    int push(List<Integer> heap, int value) {
        heap.add(value);                                          // @append
        int i = heap.size() - 1;
        while (i > 0 && heap.get((i - 1) / 2) > heap.get(i)) {    // @compare
            int parent = (i - 1) / 2;                             // @swap
            Collections.swap(heap, i, parent);                    // @swap
            i = parent;                                           // @swap
        }
        return i;                                                 // @settle
    }

    List<Integer> buildByPushing(int[] values) {
        List<Integer> heap = new ArrayList<>();                   // @init
        for (int value : values) {
            push(heap, value);
        }
        return heap;                                              // @done
    }
}
