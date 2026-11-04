#include <cstdlib>
#include <unordered_map>
#include <vector>

class RandomizedSet {
public:
    bool insert(int val) {
        if (indexOf.count(val)) {
            return false;
        }
        indexOf[val] = (int)items.size();
        items.push_back(val);
        return true;
    }

    bool remove(int val) {
        auto it = indexOf.find(val);
        if (it == indexOf.end()) {
            return false;
        }
        int i = it->second;
        int last = items.back();
        items[i] = last;                   // the last value fills the hole
        indexOf[last] = i;
        items.pop_back();                  // pop_back: O(1), nothing shifts
        indexOf.erase(val);
        return true;
    }

    int getRandom() {
        return items[std::rand() % items.size()];
    }

private:
    std::vector<int> items;                // the values, packed with no gaps
    std::unordered_map<int, int> indexOf;  // value -> its index in items
};
