class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False


def build_trie(words):
    root = TrieNode()
    for word in words:
        node = root                                  # @start
        for ch in word:
            if ch not in node.children:              # @check
                node.children[ch] = TrieNode()       # @create
            node = node.children[ch]                 # @step
        node.is_word = True                          # @mark
    return root                                      # @done
