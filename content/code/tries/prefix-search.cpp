#include <map>
#include <memory>
#include <string>
#include <vector>

struct TrieNode {
    std::map<char, std::unique_ptr<TrieNode>> children;
    bool isWord = false;
};

void collect(const TrieNode& node, const std::string& path, std::vector<std::string>& words) {
    if (node.isWord) {
        words.push_back(path);
    }
    for (const auto& entry : node.children) {
        collect(*entry.second, path + entry.first, words);
    }
}

std::vector<std::string> lookup(const TrieNode& root, const std::string& query, const std::string& mode) {
    const TrieNode* node = &root;                            // @start
    for (char ch : query) {
        auto it = node->children.find(ch);                   // @check
        if (it == node->children.end()) {                    // @check
            return {};                                       // @done
        }
        node = it->second.get();                             // @step
    }
    if (mode == "word") {                                    // @verdict
        return node->isWord ? std::vector<std::string>{query} : std::vector<std::string>{};   // @done
    }
    std::vector<std::string> words;                          // @collect
    collect(*node, query, words);                            // @collect
    return words;                                            // @done
}
