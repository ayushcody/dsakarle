def build_adjacency(n, edges, directed):
    adj = [[] for _ in range(n)]            # @init
    for u, v in edges:                      # @read
        adj[u].append(v)                    # @forward
        if not directed:                    # @back
            adj[v].append(u)                # @back
    return adj                              # @done
