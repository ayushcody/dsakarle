import java.util.HashMap;
import java.util.Map;

class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isWord = false;
}

class WordDictionary {
    private final TrieNode root = new TrieNode();

    public void addWord(String word) {
        TrieNode node = root;
        for (char ch : word.toCharArray()) {
            if (!node.children.containsKey(ch)) {
                node.children.put(ch, new TrieNode());
            }
            node = node.children.get(ch);
        }
        node.isWord = true;
    }

    public boolean search(String word) {
        return dfs(root, word, 0);
    }

    private boolean dfs(TrieNode node, String word, int i) {
        if (i == word.length()) {
            return node.isWord;
        }
        char ch = word.charAt(i);
        if (ch == '.') {
            // A wildcard may be any letter: try every child.
            for (TrieNode child : node.children.values()) {
                if (dfs(child, word, i + 1)) {
                    return true;
                }
            }
            return false;
        }
        if (!node.children.containsKey(ch)) {
            return false;
        }
        return dfs(node.children.get(ch), word, i + 1);
    }
}
