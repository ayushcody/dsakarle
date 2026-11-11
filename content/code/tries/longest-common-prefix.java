import java.util.HashMap;
import java.util.Map;

class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isWord = false;
}

class Solution {
    String longestCommonPrefix(String[] strs) {
        TrieNode root = new TrieNode();
        for (String word : strs) {
            TrieNode node = root;
            for (char ch : word.toCharArray()) {
                if (!node.children.containsKey(ch)) {
                    node.children.put(ch, new TrieNode());
                }
                node = node.children.get(ch);
            }
            node.isWord = true;
        }

        StringBuilder prefix = new StringBuilder();
        TrieNode node = root;
        // Walk while there is exactly one way on and no word ends here.
        while (node.children.size() == 1 && !node.isWord) {
            char ch = node.children.keySet().iterator().next();
            prefix.append(ch);
            node = node.children.get(ch);
        }
        return prefix.toString();
    }
}
