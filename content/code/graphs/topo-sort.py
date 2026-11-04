from collections import deque


def topo_order(n, edges):
    adj = [[] for _ in range(n)]                        # @indegree
    indegree = [0] * n                                  # @indegree
    for a, b in edges:                                  # @indegree
        adj[a].append(b)                                # @indegree
        indegree[b] += 1                                # @indegree
    queue = deque(i for i in range(n) if indegree[i] == 0)   # @seed
    order = []                                          # @seed
    while queue:
        u = queue.popleft()                             # @pop
        order.append(u)                                 # @pop
        for v in adj[u]:
            indegree[v] -= 1                            # @drop
            if indegree[v] == 0:                        # @ready
                queue.append(v)                         # @ready
    return order if len(order) == n else []             # @finish
