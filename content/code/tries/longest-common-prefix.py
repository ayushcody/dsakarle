class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False


def longest_common_prefix(strs):
    root = TrieNode()
    for word in strs:
        node = root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_word = True

    prefix = []
    node = root
    # Walk while there is exactly one way on and no word ends here.
    while len(node.children) == 1 and not node.is_word:
        ch = next(iter(node.children))
        prefix.append(ch)
        node = node.children[ch]
    return "".join(prefix)
