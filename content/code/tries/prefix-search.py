class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False


def collect(node, path, words):
    if node.is_word:
        words.append(path)
    for ch in sorted(node.children):
        collect(node.children[ch], path + ch, words)


def lookup(root, query, mode):
    node = root                                      # @start
    for ch in query:
        if ch not in node.children:                  # @check
            return []                                # @done
        node = node.children[ch]                     # @step
    if mode == "word":                               # @verdict
        return [query] if node.is_word else []       # @done
    words = []                                       # @collect
    collect(node, query, words)                      # @collect
    return words                                     # @done
