import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

class TrieNode {
    Map<Character, TrieNode> children = new TreeMap<>();
    boolean isWord = false;
}

class Solution {
    void collect(TrieNode node, String path, List<String> words) {
        if (node.isWord) {
            words.add(path);
        }
        for (Map.Entry<Character, TrieNode> entry : node.children.entrySet()) {
            collect(entry.getValue(), path + entry.getKey(), words);
        }
    }

    List<String> lookup(TrieNode root, String query, String mode) {
        TrieNode node = root;                                // @start
        for (char ch : query.toCharArray()) {
            if (!node.children.containsKey(ch)) {            // @check
                return new ArrayList<>();                    // @done
            }
            node = node.children.get(ch);                    // @step
        }
        if (mode.equals("word")) {                           // @verdict
            return node.isWord ? List.of(query) : new ArrayList<>();   // @done
        }
        List<String> words = new ArrayList<>();              // @collect
        collect(node, query, words);                         // @collect
        return words;                                        // @done
    }
}
