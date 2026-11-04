#include <map>
#include <memory>
#include <string>
#include <vector>

struct TrieNode {
    std::map<char, std::unique_ptr<TrieNode>> children;
    bool isWord = false;
};

std::unique_ptr<TrieNode> buildTrie(const std::vector<std::string>& words) {
    auto root = std::make_unique<TrieNode>();
    for (const std::string& word : words) {
        TrieNode* node = root.get();                         // @start
        for (char ch : word) {
            if (node->children.count(ch) == 0) {            // @check
                node->children[ch] = std::make_unique<TrieNode>();   // @create
            }
            node = node->children[ch].get();                // @step
        }
        node->isWord = true;                                // @mark
    }
    return root;                                            // @done
}
