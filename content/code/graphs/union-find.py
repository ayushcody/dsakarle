def find(parent, x):
    root = x
    while parent[root] != root:                         # @find
        root = parent[root]                             # @find
    while parent[x] != root:                            # @compress
        nxt = parent[x]                                 # @compress
        parent[x] = root                                # @compress
        x = nxt                                         # @compress
    return root


def count_groups(n, edges):
    parent = list(range(n))                             # @init
    size = [1] * n                                      # @init
    components = n                                      # @init
    for a, b in edges:
        ra = find(parent, a)
        rb = find(parent, b)
        if ra == rb:                                    # @same
            continue                                    # @same
        if size[ra] < size[rb]:                         # @union
            ra, rb = rb, ra                             # @union
        parent[rb] = ra                                 # @union
        size[ra] += size[rb]                            # @union
        components -= 1                                 # @union
    return components                                   # @finish
