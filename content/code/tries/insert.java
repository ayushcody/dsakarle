import java.util.List;
import java.util.Map;
import java.util.TreeMap;

class TrieNode {
    Map<Character, TrieNode> children = new TreeMap<>();
    boolean isWord = false;
}

class Solution {
    TrieNode buildTrie(List<String> words) {
        TrieNode root = new TrieNode();
        for (String word : words) {
            TrieNode node = root;                            // @start
            for (char ch : word.toCharArray()) {
                if (!node.children.containsKey(ch)) {        // @check
                    node.children.put(ch, new TrieNode());   // @create
                }
                node = node.children.get(ch);                // @step
            }
            node.isWord = true;                              // @mark
        }
        return root;                                         // @done
    }
}
