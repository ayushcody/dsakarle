#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

struct TrieNode {
    std::unordered_map<char, std::unique_ptr<TrieNode>> children;
    bool isWord = false;
};

std::string longestCommonPrefix(const std::vector<std::string>& strs) {
    TrieNode root;
    for (const std::string& word : strs) {
        TrieNode* node = &root;
        for (char ch : word) {
            if (node->children.count(ch) == 0) {
                node->children[ch] = std::make_unique<TrieNode>();
            }
            node = node->children[ch].get();
        }
        node->isWord = true;
    }

    std::string prefix;
    const TrieNode* node = &root;
    // Walk while there is exactly one way on and no word ends here.
    while (node->children.size() == 1 && !node->isWord) {
        char ch = node->children.begin()->first;
        prefix += ch;
        node = node->children.begin()->second.get();
    }
    return prefix;
}
