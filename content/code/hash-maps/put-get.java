import java.util.ArrayList;
import java.util.List;

class HashTable {
    static class Entry {
        final int key;
        String value;

        Entry(int key, String value) {
            this.key = key;
            this.value = value;
        }
    }

    private final int m;
    private final List<List<Entry>> buckets = new ArrayList<>();

    // Keys are non-negative ints, so key % m is always a valid bucket.
    HashTable(int m) {
        this.m = m;                                     // @init
        for (int b = 0; b < m; b++) {
            buckets.add(new ArrayList<>());             // @init
        }
    }

    void put(int key, String value) {
        List<Entry> chain = buckets.get(key % m);       // @hash
        for (Entry entry : chain) {
            if (entry.key == key) {                     // @walk
                entry.value = value;                    // @update
                return;
            }
        }
        chain.add(new Entry(key, value));               // @insert
    }

    String get(int key) {
        List<Entry> chain = buckets.get(key % m);       // @hash
        for (Entry entry : chain) {
            if (entry.key == key) {                     // @walk
                return entry.value;                     // @found
            }
        }
        return null;                                    // @missing
    }
}
