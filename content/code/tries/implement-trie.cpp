#include <memory>
#include <string>
#include <unordered_map>

struct TrieNode {
    std::unordered_map<char, std::unique_ptr<TrieNode>> children;
    bool isWord = false;
};

class Trie {
public:
    void insert(const std::string& word) {
        TrieNode* node = &root;
        for (char ch : word) {
            if (node->children.count(ch) == 0) {
                node->children[ch] = std::make_unique<TrieNode>();
            }
            node = node->children[ch].get();
        }
        node->isWord = true;
    }

    bool search(const std::string& word) const {
        const TrieNode* node = walk(word);
        return node != nullptr && node->isWord;
    }

    bool startsWith(const std::string& prefix) const {
        return walk(prefix) != nullptr;
    }

private:
    TrieNode root;

    const TrieNode* walk(const std::string& text) const {
        const TrieNode* node = &root;
        for (char ch : text) {
            auto it = node->children.find(ch);
            if (it == node->children.end()) {
                return nullptr;
            }
            node = it->second.get();
        }
        return node;
    }
};
