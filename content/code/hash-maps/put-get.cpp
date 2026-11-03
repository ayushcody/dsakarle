#include <optional>
#include <string>
#include <utility>
#include <vector>

class HashTable {
public:
    // Keys are non-negative ints, so key % m is always a valid bucket.
    explicit HashTable(int size) : m(size), buckets(size) {}  // @init

    void put(int key, const std::string& value) {
        std::vector<std::pair<int, std::string>>& chain = buckets[key % m];  // @hash
        for (auto& entry : chain) {
            if (entry.first == key) {                   // @walk
                entry.second = value;                   // @update
                return;
            }
        }
        chain.push_back({key, value});                  // @insert
    }

    std::optional<std::string> get(int key) const {
        const auto& chain = buckets[key % m];           // @hash
        for (const auto& entry : chain) {
            if (entry.first == key) {                   // @walk
                return entry.second;                    // @found
            }
        }
        return std::nullopt;                            // @missing
    }

private:
    int m;
    std::vector<std::vector<std::pair<int, std::string>>> buckets;
};
