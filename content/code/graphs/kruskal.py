def find(parent, x):
    while parent[x] != x:
        x = parent[x]
    return x


def kruskal(n, edges):
    parent = list(range(n))                                  # @init
    edges = sorted(edges, key=lambda e: (e[2], min(e[0], e[1]), max(e[0], e[1])))  # @init
    total = 0                                                # @init
    used = 0                                                 # @init
    for a, b, w in edges:                                    # @consider
        ra = find(parent, a)                                 # @find
        rb = find(parent, b)                                 # @find
        if ra == rb:                                         # @skip
            continue                                         # @skip
        parent[rb] = ra                                      # @take
        total += w                                           # @take
        used += 1                                            # @take
        if used == n - 1:                                    # @done
            break                                            # @done
    return total                                             # @done
