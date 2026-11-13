def dijkstra(n, edges, src):
    INF = 10**9
    adj = [[] for _ in range(n)]
    for a, b, w in edges:
        adj[a].append((b, w))
        adj[b].append((a, w))
    dist = [INF] * n                                    # @init
    dist[src] = 0                                       # @init
    done = [False] * n
    while True:
        u = -1                                          # @pick
        for i in range(n):                              # @pick
            if not done[i] and dist[i] < INF and (u == -1 or dist[i] < dist[u]):   # @pick
                u = i                                   # @pick
        if u == -1:                                     # @pick
            break                                       # @pick
        done[u] = True                                  # @settle
        for v, w in adj[u]:
            if done[v]:
                continue
            if dist[u] + w < dist[v]:                   # @relax
                dist[v] = dist[u] + w                   # @update
    return [-1 if d == INF else d for d in dist]        # @finish
