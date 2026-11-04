#include <memory>
#include <string>
#include <unordered_map>

struct TrieNode {
    std::unordered_map<char, std::unique_ptr<TrieNode>> children;
    bool isWord = false;
};

class WordDictionary {
public:
    void addWord(const std::string& word) {
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
        return dfs(root, word, 0);
    }

private:
    TrieNode root;

    bool dfs(const TrieNode& node, const std::string& word, size_t i) const {
        if (i == word.size()) {
            return node.isWord;
        }
        char ch = word[i];
        if (ch == '.') {
            // A wildcard may be any letter: try every child.
            for (const auto& entry : node.children) {
                if (dfs(*entry.second, word, i + 1)) {
                    return true;
                }
            }
            return false;
        }
        auto it = node.children.find(ch);
        if (it == node.children.end()) {
            return false;
        }
        return dfs(*it->second, word, i + 1);
    }
};
