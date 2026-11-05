import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

class RandomizedSet {
    private final List<Integer> items = new ArrayList<>();          // the values, packed with no gaps
    private final Map<Integer, Integer> indexOf = new HashMap<>();  // value -> its index in items
    private final Random random = new Random();

    boolean insert(int val) {
        if (indexOf.containsKey(val)) {
            return false;
        }
        indexOf.put(val, items.size());
        items.add(val);
        return true;
    }

    boolean remove(int val) {
        if (!indexOf.containsKey(val)) {
            return false;
        }
        int i = indexOf.get(val);
        int last = items.get(items.size() - 1);
        items.set(i, last);                        // the last value fills the hole
        indexOf.put(last, i);
        items.remove(items.size() - 1);            // remove from the back: O(1), nothing shifts
        indexOf.remove(val);
        return true;
    }

    int getRandom() {
        return items.get(random.nextInt(items.size()));
    }
}
