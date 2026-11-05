def dfs(graph, node, visited, order):
    visited[node] = True                       # @visit
    order.append(node)                         # @visit
    for nxt in graph[node]:
        if visited[nxt]:                       # @skip
            continue                           # @skip
        dfs(graph, nxt, visited, order)        # @descend
    return                                     # @backtrack


def dfs_order(graph, start):
    visited = [False] * len(graph)             # @init
    order = []                                 # @init
    dfs(graph, start, visited, order)
    return order                               # @done
